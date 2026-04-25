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

    CREATE INDEX IF NOT EXISTS idx_quotes_master ON quotes(master_id);
    CREATE INDEX IF NOT EXISTS idx_quotes_featured ON quotes(is_featured);
    CREATE INDEX IF NOT EXISTS idx_quote_tags_tag ON quote_tags(tag_id);
    CREATE INDEX IF NOT EXISTS idx_daily_quotes_date ON daily_quotes(display_date);
  `);

  return db;
}
