#!/usr/bin/env node
/**
 * 把 scripts/interpretations/*.json 写到 quote_interpretations 表。
 *
 * v3: 用"内容匹配"代替 v2 的"按 ID 顺序配对"。对每条解释，从 core/story 里
 *     提取 **...** 加粗短语 或 "..." 直接引用，作为"特征指纹"，
 *     在同 master 的 quote 里找包含该指纹的那条，作为配对目标。
 *
 *   - 命中：写入（INSERT OR REPLACE）
 *   - 未命中：跳过
 *
 * 用法：node scripts/gen-interpretations-v3.mjs
 *       DB_PATH=/path/to/quotes.db node scripts/gen-interpretations-v3.mjs
 */
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = process.env.DB_PATH || path.join(process.env.HOME || "/root", "iq-data", "quotes.db");
const INTERP_DIR = path.join(__dirname, "interpretations");

const FILE_TO_MASTER = {
  buffett: "m-buffett",
  munger: "m-munger",
  graham: "m-graham",
  lynch: "m-lynch",
  soros: "m-soros",
  dalio: "m-dalio",
  marks: "m-marks",
  bogle: "m-bogle",
  fisher: "m-fisher",
  livermore: "m-livermore",
  taleb: "m-taleb",
  klarman: "m-klarman",
};

if (!fs.existsSync(DB_PATH)) {
  console.error(`[gen-interp-v3] DB not found: ${DB_PATH}`);
  process.exit(1);
}
if (!fs.existsSync(INTERP_DIR)) {
  console.error(`[gen-interp-v3] interpretations dir not found: ${INTERP_DIR}`);
  process.exit(1);
}

const db = new Database(DB_PATH);
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS quote_interpretations (
    quote_id TEXT PRIMARY KEY,
    core TEXT NOT NULL,
    practice TEXT NOT NULL,
    story TEXT NOT NULL,
    master_view TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (quote_id) REFERENCES quotes(id)
  );
`);

const insertStmt = db.prepare(`
  INSERT OR REPLACE INTO quote_interpretations (quote_id, core, practice, story, master_view)
  VALUES (?, ?, ?, ?, ?)
`);

// 取每个 master 的所有 quote
const quotesByMaster = {};
for (const masterId of Object.values(FILE_TO_MASTER)) {
  quotesByMaster[masterId] = db
    .prepare(`SELECT id, content_cn FROM quotes WHERE master_id = ?`)
    .all(masterId);
}

function normalize(s) {
  // 去除所有空白和常见中英文标点，做宽松匹配
  return s
    .replace(/[\s\u3000]/g, "")
    .replace(/[，。！？、；：,!?;:\.""'"'""''《》（）()「」『』【】\[\]·…—\-*]/g, "");
}

function extractFingerprints(core, story) {
  const text = (core || "") + "\n" + (story || "");
  const fps = [];
  // 1) **...** 加粗短语
  for (const m of text.matchAll(/\*\*([^*]+)\*\*/g)) {
    fps.push(m[1]);
  }
  // 2) 双引号 / 单引号 引用 (中英文)
  for (const m of text.matchAll(/[""'「」『』'']([^""'「」『』'']{6,80})[""'」」『』'']/g)) {
    fps.push(m[1]);
  }
  // 3) 至少 4 个有效字符
  return fps.filter((s) => normalize(s).length >= 4);
}

function findBestQuote(masterId, fingerprints) {
  const candidates = quotesByMaster[masterId];
  if (!candidates) return null;
  // 按指纹长度降序（更长的更精确）
  const sorted = [...fingerprints].sort((a, b) => normalize(b).length - normalize(a).length);
  for (const fp of sorted) {
    const fpN = normalize(fp);
    if (fpN.length < 4) continue;
    for (const c of candidates) {
      const ccN = normalize(c.content_cn);
      if (ccN.includes(fpN)) {
        return c;
      }
    }
  }
  return null;
}

let total = 0;
let inserted = 0;
let replaced = 0;
let skipped = 0;
let ambiguous = 0; // 同 master 多个 quote 命中（取第一个）

const files = fs
  .readdirSync(INTERP_DIR)
  .filter((f) => f.endsWith(".json"))
  .sort();

console.log(`[gen-interp-v3] 找到 ${files.length} 个 JSON 文件`);

for (const f of files) {
  const fileKey = f.replace(/\.json$/, "");
  const masterId = FILE_TO_MASTER[fileKey];
  if (!masterId) {
    console.warn(`  ✗ ${f} 未知文件名，跳过`);
    continue;
  }

  let arr;
  try {
    arr = JSON.parse(fs.readFileSync(path.join(INTERP_DIR, f), "utf-8"));
  } catch (e) {
    console.error(`  ✗ ${f} 解析失败: ${e.message}`);
    continue;
  }
  if (!Array.isArray(arr)) {
    console.error(`  ✗ ${f} 不是数组，跳过`);
    continue;
  }

  let fileHit = 0;
  let fileMiss = 0;
  const usedQuoteIds = new Set();

  const txn = db.transaction((batch) => {
    for (const item of batch) {
      const fps = extractFingerprints(item.core, item.story);
      if (fps.length === 0) {
        fileMiss++;
        skipped++;
        continue;
      }
      // 优先选未使用过的
      let best = null;
      const sorted = [...fps].sort((a, b) => normalize(b).length - normalize(a).length);
      for (const fp of sorted) {
        const fpN = normalize(fp);
        if (fpN.length < 4) continue;
        for (const c of quotesByMaster[masterId]) {
          const ccN = normalize(c.content_cn);
          if (ccN.includes(fpN)) {
            if (!usedQuoteIds.has(c.id)) {
              best = c;
              break;
            }
            // 已被使用过，记为 ambiguous
            ambiguous++;
          }
        }
        if (best) break;
      }
      if (!best) {
        fileMiss++;
        skipped++;
        continue;
      }

      const practiceJson = JSON.stringify(
        Array.isArray(item.practice) ? item.practice : [String(item.practice)]
      );
      const masterView = item.master_view ?? null;
      const existed = db
        .prepare(`SELECT 1 FROM quote_interpretations WHERE quote_id = ?`)
        .get(best.id);
      insertStmt.run(best.id, item.core, practiceJson, item.story, masterView);
      total++;
      fileHit++;
      if (existed) replaced++;
      else inserted++;
      usedQuoteIds.add(best.id);
    }
  });

  txn(arr);
  console.log(`  → ${f}: ${fileHit} 命中 / ${fileMiss} 跳过（共 ${arr.length}）`);
}

console.log("");
console.log(`[gen-interp-v3] 完成:`);
console.log(`  新插入: ${inserted}`);
console.log(`  覆盖: ${replaced}`);
console.log(`  跳过（无指纹 / 无匹配 quote）: ${skipped}`);
console.log(`  实际写入: ${total}`);

const totalRow = db.prepare(`SELECT COUNT(*) AS c FROM quote_interpretations`).get();
const remainingRow = db.prepare(`
  SELECT COUNT(*) AS c FROM quotes q
  WHERE NOT EXISTS (SELECT 1 FROM quote_interpretations i WHERE i.quote_id = q.id)
`).get();
console.log(`  表内总条数: ${totalRow.c}`);
console.log(`  仍未覆盖的名言条数: ${remainingRow.c}`);

db.close();
