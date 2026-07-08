#!/usr/bin/env node
/**
 * 批量把 scripts/interpretations/*.json 写入 quote_interpretations 表。
 *
 * 幂等：按 quote_id INSERT OR REPLACE。
 * 用法：node scripts/gen-interpretations.mjs
 *      DB_PATH=/path/to/quotes.db node scripts/gen-interpretations.mjs
 *
 * JSON 单条结构：
 *   { "quote_id": "xxx", "core": "...", "practice": ["...", "..."], "story": "...", "master_view": "..." }
 */
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = process.env.DB_PATH || path.join(process.env.HOME || "/root", "iq-data", "quotes.db");
const INTERP_DIR = path.join(__dirname, "interpretations");

if (!fs.existsSync(DB_PATH)) {
  console.error(`[gen-interpretations] DB not found: ${DB_PATH}`);
  console.error("  → 在容器内跑（/root/iq-data/quotes.db）或用 DB_PATH 覆盖。");
  process.exit(1);
}
if (!fs.existsSync(INTERP_DIR)) {
  console.error(`[gen-interpretations] interpretations dir not found: ${INTERP_DIR}`);
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
  CREATE INDEX IF NOT EXISTS idx_interp_created ON quote_interpretations(created_at);
`);

const insertStmt = db.prepare(`
  INSERT OR REPLACE INTO quote_interpretations (quote_id, core, practice, story, master_view)
  VALUES (?, ?, ?, ?, ?)
`);

// 收集所有 quote_id 以便校验其存在
const validIds = new Set(
  db.prepare(`SELECT id FROM quotes`).all().map((r) => r.id)
);

const files = fs.readdirSync(INTERP_DIR).filter((f) => f.endsWith(".json"));
console.log(`[gen-interpretations] 找到 ${files.length} 个 JSON 文件`);

let total = 0;
let skippedMissing = 0;
let replaced = 0;
let inserted = 0;
const txn = db.transaction((batch) => {
  for (const item of batch) {
    if (!validIds.has(item.quote_id)) {
      skippedMissing++;
      continue;
    }
    const practiceJson = JSON.stringify(Array.isArray(item.practice) ? item.practice : [String(item.practice)]);
    const masterView = item.master_view ?? null;
    const existed = db.prepare(`SELECT 1 FROM quote_interpretations WHERE quote_id = ?`).get(item.quote_id);
    insertStmt.run(item.quote_id, item.core, practiceJson, item.story, masterView);
    total++;
    if (existed) replaced++; else inserted++;
  }
});

for (const f of files) {
  const fp = path.join(INTERP_DIR, f);
  let arr;
  try {
    arr = JSON.parse(fs.readFileSync(fp, "utf-8"));
  } catch (e) {
    console.error(`  ✗ ${f} 解析失败: ${e.message}`);
    continue;
  }
  if (!Array.isArray(arr)) {
    console.error(`  ✗ ${f} 不是数组，跳过`);
    continue;
  }
  console.log(`  → ${f}: ${arr.length} 条`);
  txn(arr);
}

console.log("");
console.log(`[gen-interpretations] 完成:`);
console.log(`  新插入: ${inserted}`);
console.log(`  覆盖: ${replaced}`);
console.log(`  跳过（quote_id 不存在）: ${skippedMissing}`);
console.log(`  实际写入: ${total}`);

// 输出当前表统计
const totalRow = db.prepare(`SELECT COUNT(*) AS c FROM quote_interpretations`).get();
const remainingRow = db.prepare(`
  SELECT COUNT(*) AS c FROM quotes q
  WHERE NOT EXISTS (SELECT 1 FROM quote_interpretations i WHERE i.quote_id = q.id)
`).get();
console.log(`  表内总条数: ${totalRow.c}`);
console.log(`  仍未覆盖的名言条数: ${remainingRow.c}`);

db.close();
