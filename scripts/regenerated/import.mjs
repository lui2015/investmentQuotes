#!/usr/bin/env node
/**
 * 导入重写后的解读到 quote_interpretations 表（幂等 INSERT OR REPLACE）。
 *
 * 用法（容器内，指向生产库）：
 *   NODE_PATH=/app/node_modules DB_PATH=/app/data/quotes.db \
 *     node /app/data/import/import.mjs
 *
 * 读取与本脚本同目录下的所有 *.json（buffett.json、munger.json ...）。
 * 单条结构：{ quote_id, core, practice: string[], story, master_view }
 */
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "data", "quotes.db");
if (!fs.existsSync(DB_PATH)) {
  console.error(`[import] DB not found: ${DB_PATH}`);
  process.exit(1);
}

const db = new Database(DB_PATH);
db.pragma("foreign_keys = ON");

const insertStmt = db.prepare(`
  INSERT OR REPLACE INTO quote_interpretations (quote_id, core, practice, story, master_view)
  VALUES (?, ?, ?, ?, ?)
`);
const existsStmt = db.prepare(`SELECT 1 FROM quote_interpretations WHERE quote_id = ?`);
const validIds = new Set(db.prepare(`SELECT id FROM quotes`).all().map((r) => r.id));

const files = fs
  .readdirSync(__dirname)
  .filter((f) => f.endsWith(".json"));

let inserted = 0;
let replaced = 0;
let skipped = 0;
const txn = db.transaction((batch) => {
  for (const item of batch) {
    if (!item || !item.quote_id) { skipped++; continue; }
    if (!validIds.has(item.quote_id)) { skipped++; continue; }
    if (!item.core || !item.story) { skipped++; continue; }
    const practiceJson = JSON.stringify(
      Array.isArray(item.practice) ? item.practice : [String(item.practice ?? "")]
    );
    const existed = existsStmt.get(item.quote_id);
    insertStmt.run(item.quote_id, item.core, practiceJson, item.story, item.master_view ?? null);
    if (existed) replaced++; else inserted++;
  }
});

for (const f of files) {
  let arr;
  try {
    arr = JSON.parse(fs.readFileSync(path.join(__dirname, f), "utf-8"));
  } catch (e) {
    console.error(`  ✗ ${f} 解析失败: ${e.message}`);
    continue;
  }
  if (!Array.isArray(arr)) { console.error(`  ✗ ${f} 不是数组`); continue; }
  console.log(`  → ${f}: ${arr.length} 条`);
  txn(arr);
}

const total = db.prepare(`SELECT COUNT(*) c FROM quote_interpretations`).get().c;
const missing = db.prepare(`
  SELECT COUNT(*) c FROM quotes q
  WHERE NOT EXISTS (SELECT 1 FROM quote_interpretations i WHERE i.quote_id = q.id)
`).get().c;
console.log(`[import] 新增 ${inserted} 覆盖 ${replaced} 跳过 ${skipped}`);
console.log(`[import] 表内总计 ${total}，仍缺失 ${missing}`);
db.close();
