/**
 * 将名言数据库扩充到 1000+ 条
 * 用法: node scripts/expand-to-1000.js
 */
const Database = require("better-sqlite3");
const path = require("path");
const crypto = require("crypto");

const DB_PATH = path.join(__dirname, "..", "data", "quotes.db");

const T = {
  v: "t-value",
  l: "t-longterm",
  r: "t-risk",
  c: "t-contrarian",
  cc: "t-circle",
  m: "t-market",
  md: "t-mindset",
  lr: "t-learning",
  b: "t-business",
  p: "t-philosophy",
};

// ADDITIONS 在文件末尾合并
const ADDITIONS = require("./expand-data-1000.js");

function run() {
  const db = new Database(DB_PATH);
  const before = db.prepare("SELECT COUNT(*) as c FROM quotes").get().c;
  console.log(`扩充前: ${before} 条`);

  const insertQuote = db.prepare(
    `INSERT OR IGNORE INTO quotes (id, content_cn, content_en, master_id, source, source_year, is_featured) VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  const insertTag = db.prepare(
    `INSERT OR IGNORE INTO quote_tags (quote_id, tag_id) VALUES (?, ?)`
  );

  // 检查是否有重复（按 master_id + content_cn 判重）
  const existsStmt = db.prepare(
    `SELECT 1 FROM quotes WHERE master_id = ? AND content_cn = ? LIMIT 1`
  );

  let added = 0;
  let skipped = 0;

  const tx = db.transaction(() => {
    for (const masterId of Object.keys(ADDITIONS)) {
      for (const q of ADDITIONS[masterId]) {
        if (existsStmt.get(masterId, q.cn)) {
          skipped++;
          continue;
        }
        const id = "ex-" + crypto.randomUUID().slice(0, 12);
        insertQuote.run(
          id,
          q.cn,
          q.en || null,
          masterId,
          q.src || null,
          q.year || null,
          0
        );
        for (const tagShort of q.tags || []) {
          const tagId = T[tagShort];
          if (tagId) insertTag.run(id, tagId);
        }
        added++;
      }
    }
  });

  tx();

  const after = db.prepare("SELECT COUNT(*) as c FROM quotes").get().c;
  console.log(`扩充后: ${after} 条 (新增 ${added}, 跳过 ${skipped})`);

  console.log("\n各大师名言数量:");
  const stats = db
    .prepare(
      `SELECT m.name_cn, COUNT(q.id) as cnt FROM masters m LEFT JOIN quotes q ON q.master_id = m.id GROUP BY m.id ORDER BY cnt DESC`
    )
    .all();
  for (const r of stats) console.log(`  ${r.name_cn}: ${r.cnt}`);

  db.close();
}

run();
