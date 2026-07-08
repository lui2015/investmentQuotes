import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "quotes.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");
  }
  return _db;
}

export function initDb() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS masters (
      id TEXT PRIMARY KEY,
      name_cn TEXT NOT NULL,
      name_en TEXT,
      avatar_url TEXT,
      title TEXT,
      bio TEXT,
      born_year INTEGER,
      nationality TEXT,
      category TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS quotes (
      id TEXT PRIMARY KEY,
      content_cn TEXT NOT NULL,
      content_en TEXT,
      master_id TEXT NOT NULL,
      source TEXT,
      source_year INTEGER,
      is_featured INTEGER DEFAULT 0,
      favorite_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (master_id) REFERENCES masters(id)
    );

    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS quote_tags (
      quote_id TEXT NOT NULL,
      tag_id TEXT NOT NULL,
      PRIMARY KEY (quote_id, tag_id),
      FOREIGN KEY (quote_id) REFERENCES quotes(id),
      FOREIGN KEY (tag_id) REFERENCES tags(id)
    );

    CREATE TABLE IF NOT EXISTS daily_quotes (
      id TEXT PRIMARY KEY,
      quote_id TEXT NOT NULL,
      display_date TEXT NOT NULL UNIQUE,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (quote_id) REFERENCES quotes(id)
    );

    -- 用户提交的名言（对外开放接口收集）
    -- status: pending(待处理) / approved(已入库) / merged(与现有名言合并) / rejected(重复度过高)
    CREATE TABLE IF NOT EXISTS quote_submissions (
      id TEXT PRIMARY KEY,
      content_cn TEXT NOT NULL,
      content_en TEXT,
      master_name TEXT NOT NULL,
      source TEXT,
      source_year INTEGER,
      tags TEXT,
      submitter TEXT,
      submitter_ip TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      matched_quote_id TEXT,
      matched_master_id TEXT,
      similarity_score REAL,
      dedupe_reason TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      processed_at TEXT
    );

    -- 名言 4 块深度解读（核心解读 / 应用实操 / 生动案例 / 大师视角）
    CREATE TABLE IF NOT EXISTS quote_interpretations (
      quote_id TEXT PRIMARY KEY,
      core TEXT NOT NULL,         -- 核心解读
      practice TEXT NOT NULL,     -- 应用实操（JSON 数组，4 条）
      story TEXT NOT NULL,        -- 生动案例
      master_view TEXT,           -- 大师视角（可空）
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (quote_id) REFERENCES quotes(id)
    );

    -- API 调用日志（每次调用一条）
    CREATE TABLE IF NOT EXISTS api_call_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      endpoint TEXT NOT NULL,       -- 例如 POST /api/submit
      method TEXT NOT NULL,         -- GET / POST
      status_code INTEGER NOT NULL, -- HTTP 状态码
      is_success INTEGER NOT NULL,  -- 1 成功 0 失败
      is_batch INTEGER DEFAULT 0,   -- 是否批量
      item_count INTEGER DEFAULT 1, -- 该调用涉及的名言条数
      approved_count INTEGER DEFAULT 0,
      rejected_count INTEGER DEFAULT 0,
      failed_count INTEGER DEFAULT 0,
      duration_ms INTEGER,          -- 耗时（毫秒）
      client_ip TEXT,
      user_agent TEXT,
      called_at TEXT NOT NULL DEFAULT (datetime('now')),
      call_date TEXT NOT NULL       -- YYYY-MM-DD，便于按日聚合
    );

    CREATE INDEX IF NOT EXISTS idx_quotes_master ON quotes(master_id);
    CREATE INDEX IF NOT EXISTS idx_quotes_featured ON quotes(is_featured);
    CREATE INDEX IF NOT EXISTS idx_quote_tags_tag ON quote_tags(tag_id);
    CREATE INDEX IF NOT EXISTS idx_daily_quotes_date ON daily_quotes(display_date);
    CREATE INDEX IF NOT EXISTS idx_submissions_status ON quote_submissions(status);
    CREATE INDEX IF NOT EXISTS idx_submissions_created ON quote_submissions(created_at);
    CREATE INDEX IF NOT EXISTS idx_api_log_date ON api_call_log(call_date);
    CREATE INDEX IF NOT EXISTS idx_api_log_endpoint ON api_call_log(endpoint);
    CREATE INDEX IF NOT EXISTS idx_api_log_called_at ON api_call_log(called_at);
    CREATE INDEX IF NOT EXISTS idx_interp_created ON quote_interpretations(created_at);
  `);

  return db;
}
