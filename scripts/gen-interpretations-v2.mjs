#!/usr/bin/env node
/**
 * 批量把 scripts/interpretations/*.json 写入 quote_interpretations 表。
 *
 * v2: 兼容"老 JSON 的 quote_id 跟当前 DB 的 quote_id 命名空间不一致"的场景。
 * 做法：按 JSON 文件名 → master_id 归类，把同 master 的所有 quote 按 id 升序排，
 *      然后按 quote_id 升序排列的 JSON 条目，顺序配对。配对不上的丢弃。
 *
 * 用途：DB schema 升级 / 重置后，把 328 条 AI 解释回填到当前 quote。
 * 用法：node scripts/gen-interpretations-v2.mjs
 *      DB_PATH=/path/to/quotes.db node scripts/gen-interpretations-v2.mjs
 */
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = process.env.DB_PATH || path.join(process.env.HOME || "/root", "iq-data", "quotes.db");
const INTERP_DIR = path.join(__dirname, "interpretations");

// JSON 文件名 → master_id 的映射（基于 scripts/expand_quotes.sql + seed.ts 的命名约定）
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
  console.error(`[gen-interp-v2] DB not found: ${DB_PATH}`);
  process.exit(1);
}
if (!fs.existsSync(INTERP_DIR)) {
  console.error(`[gen-interp-v2] interpretations dir not found: ${INTERP_DIR}`);
  process.exit(1);
}

const db = new Database(DB_PATH);
db.pragma("foreign_keys = ON");

// 确保表存在
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

// 取每个 master 的所有 quote（按 id 升序，确保和 JSON 的顺序配对稳定）
const quotesByMaster = {};
for (const [fileKey, masterId] of Object.entries(FILE_TO_MASTER)) {
  const rows = db
    .prepare(`SELECT id FROM quotes WHERE master_id = ? ORDER BY id ASC`)
    .all(masterId);
  quotesByMaster[fileKey] = rows.map((r) => r.id);
}

let total = 0;
let replaced = 0;
let inserted = 0;
let skipped = 0;

const files = fs
  .readdirSync(INTERP_DIR)
  .filter((f) => f.endsWith(".json"));

console.log(`[gen-interp-v2] 找到 ${files.length} 个 JSON 文件`);

for (const f of files) {
  const fileKey = f.replace(/\.json$/, "");
  const masterId = FILE_TO_MASTER[fileKey];
  if (!masterId) {
    console.warn(`  ✗ ${f} 未知文件名（找不到对应 master），跳过`);
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

  // 按 quote_id 升序排序：让"源数据添加顺序"在配对里保持稳定
  arr.sort((a, b) => (a.quote_id < b.quote_id ? -1 : a.quote_id > b.quote_id ? 1 : 0));

  const quoteIds = quotesByMaster[fileKey];
  if (!quoteIds || quoteIds.length === 0) {
    console.warn(`  ✗ ${f} master=${masterId} 在 DB 里没有 quote，整文件跳过`);
    skipped += arr.length;
    continue;
  }

  const n = Math.min(arr.length, quoteIds.length);
  console.log(`  → ${f}: JSON ${arr.length} 条 / DB ${quoteIds.length} 条 → 配对 ${n} 条`);

  const txn = db.transaction((batch) => {
    for (const item of batch) {
      const idx = batch._idx++;
      if (idx >= quoteIds.length) break;
      const newQuoteId = quoteIds[idx];
      const practiceJson = JSON.stringify(
        Array.isArray(item.practice) ? item.practice : [String(item.practice)]
      );
      const masterView = item.master_view ?? null;
      const existed = db
        .prepare(`SELECT 1 FROM quote_interpretations WHERE quote_id = ?`)
        .get(newQuoteId);
      insertStmt.run(newQuoteId, item.core, practiceJson, item.story, masterView);
      total++;
      if (existed) replaced++;
      else inserted++;
    }
    batch._idx = undefined;
  });

  const batch = arr.slice(0, n);
  batch._idx = 0;
  txn(batch);
  skipped += arr.length - n;
}

console.log("");
console.log(`[gen-interp-v2] 完成:`);
console.log(`  新插入: ${inserted}`);
console.log(`  覆盖: ${replaced}`);
console.log(`  跳过（master 缺 quote / 数量超出）: ${skipped}`);
console.log(`  实际写入: ${total}`);

const totalRow = db.prepare(`SELECT COUNT(*) AS c FROM quote_interpretations`).get();
const remainingRow = db.prepare(`
  SELECT COUNT(*) AS c FROM quotes q
  WHERE NOT EXISTS (SELECT 1 FROM quote_interpretations i WHERE i.quote_id = q.id)
`).get();
console.log(`  表内总条数: ${totalRow.c}`);
console.log(`  仍未覆盖的名言条数: ${remainingRow.c}`);

db.close();
