import { initDb } from "./db";
import { seedData } from "./seed";

export interface Master {
  id: string;
  name_cn: string;
  name_en: string;
  avatar_url: string | null;
  title: string;
  bio: string;
  born_year: number;
  nationality: string;
  category: string;
  quote_count?: number;
}

export interface Quote {
  id: string;
  content_cn: string;
  content_en: string | null;
  master_id: string;
  source: string | null;
  source_year: number | null;
  is_featured: number;
  favorite_count: number;
  created_at: string;
  master_name_cn?: string;
  master_name_en?: string;
  master_title?: string;
  master_category?: string;
  tags?: Tag[];
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  description: string;
  quote_count?: number;
}

function ensureDb() {
  seedData();
}

export function getDailyQuote(): Quote | null {
  ensureDb();
  const db = initDb();
  const today = new Date().toISOString().split("T")[0];

  let row = db.prepare(`
    SELECT q.*, m.name_cn as master_name_cn, m.name_en as master_name_en, m.title as master_title, m.category as master_category
    FROM daily_quotes dq
    JOIN quotes q ON dq.quote_id = q.id
    JOIN masters m ON q.master_id = m.id
    WHERE dq.display_date = ?
  `).get(today) as Quote | undefined;

  if (!row) {
    row = db.prepare(`
      SELECT q.*, m.name_cn as master_name_cn, m.name_en as master_name_en, m.title as master_title, m.category as master_category
      FROM quotes q
      JOIN masters m ON q.master_id = m.id
      WHERE q.is_featured = 1
      ORDER BY RANDOM() LIMIT 1
    `).get() as Quote | undefined;
  }

  if (row) {
    row.tags = getQuoteTags(row.id);
  }

  return row || null;
}

export function getRandomQuote(): Quote | null {
  ensureDb();
  const db = initDb();
  const row = db.prepare(`
    SELECT q.*, m.name_cn as master_name_cn, m.name_en as master_name_en, m.title as master_title, m.category as master_category
    FROM quotes q
    JOIN masters m ON q.master_id = m.id
    ORDER BY RANDOM() LIMIT 1
  `).get() as Quote | undefined;

  if (row) {
    row.tags = getQuoteTags(row.id);
  }

  return row || null;
}

export function getFeaturedQuotes(limit = 6): Quote[] {
  ensureDb();
  const db = initDb();
  const rows = db.prepare(`
    SELECT q.*, m.name_cn as master_name_cn, m.name_en as master_name_en, m.title as master_title, m.category as master_category
    FROM quotes q
    JOIN masters m ON q.master_id = m.id
    WHERE q.is_featured = 1
    ORDER BY q.favorite_count DESC
    LIMIT ?
  `).all(limit) as Quote[];

  for (const row of rows) {
    row.tags = getQuoteTags(row.id);
  }

  return rows;
}

export function getLatestQuotes(limit = 6): Quote[] {
  ensureDb();
  const db = initDb();
  const rows = db.prepare(`
    SELECT q.*, m.name_cn as master_name_cn, m.name_en as master_name_en, m.title as master_title, m.category as master_category
    FROM quotes q
    JOIN masters m ON q.master_id = m.id
    ORDER BY q.created_at DESC
    LIMIT ?
  `).all(limit) as Quote[];

  for (const row of rows) {
    row.tags = getQuoteTags(row.id);
  }

  return rows;
}

export function getPopularQuotes(limit = 6): Quote[] {
  ensureDb();
  const db = initDb();
  const rows = db.prepare(`
    SELECT q.*, m.name_cn as master_name_cn, m.name_en as master_name_en, m.title as master_title, m.category as master_category
    FROM quotes q
    JOIN masters m ON q.master_id = m.id
    ORDER BY q.favorite_count DESC, q.is_featured DESC
    LIMIT ?
  `).all(limit) as Quote[];

  for (const row of rows) {
    row.tags = getQuoteTags(row.id);
  }

  return rows;
}

export function getAllMasters(): Master[] {
  ensureDb();
  const db = initDb();
  return db.prepare(`
    SELECT m.*, (SELECT COUNT(*) FROM quotes q WHERE q.master_id = m.id) as quote_count
    FROM masters m
    ORDER BY m.category, m.name_cn
  `).all() as Master[];
}

export function getMaster(id: string): Master | null {
  ensureDb();
  const db = initDb();
  return (db.prepare(`
    SELECT m.*, (SELECT COUNT(*) FROM quotes q WHERE q.master_id = m.id) as quote_count
    FROM masters m WHERE m.id = ?
  `).get(id) as Master) || null;
}

export function getMasterQuotes(masterId: string): Quote[] {
  ensureDb();
  const db = initDb();
  const rows = db.prepare(`
    SELECT q.*, m.name_cn as master_name_cn, m.name_en as master_name_en, m.title as master_title, m.category as master_category
    FROM quotes q
    JOIN masters m ON q.master_id = m.id
    WHERE q.master_id = ?
    ORDER BY q.is_featured DESC, q.favorite_count DESC
  `).all(masterId) as Quote[];

  for (const row of rows) {
    row.tags = getQuoteTags(row.id);
  }

  return rows;
}

export function getAllTags(): Tag[] {
  ensureDb();
  const db = initDb();
  return db.prepare(`
    SELECT t.*, (SELECT COUNT(*) FROM quote_tags qt WHERE qt.tag_id = t.id) as quote_count
    FROM tags t
    ORDER BY quote_count DESC
  `).all() as Tag[];
}

export function getTagBySlug(slug: string): Tag | null {
  ensureDb();
  const db = initDb();
  return (db.prepare(`
    SELECT t.*, (SELECT COUNT(*) FROM quote_tags qt WHERE qt.tag_id = t.id) as quote_count
    FROM tags t WHERE t.slug = ?
  `).get(slug) as Tag) || null;
}

export function getQuotesByTag(tagId: string): Quote[] {
  ensureDb();
  const db = initDb();
  const rows = db.prepare(`
    SELECT q.*, m.name_cn as master_name_cn, m.name_en as master_name_en, m.title as master_title, m.category as master_category
    FROM quotes q
    JOIN masters m ON q.master_id = m.id
    JOIN quote_tags qt ON qt.quote_id = q.id
    WHERE qt.tag_id = ?
    ORDER BY q.is_featured DESC, q.favorite_count DESC
  `).all(tagId) as Quote[];

  for (const row of rows) {
    row.tags = getQuoteTags(row.id);
  }

  return rows;
}

export function getQuoteTags(quoteId: string): Tag[] {
  const db = initDb();
  return db.prepare(`
    SELECT t.* FROM tags t
    JOIN quote_tags qt ON qt.tag_id = t.id
    WHERE qt.quote_id = ?
  `).all(quoteId) as Tag[];
}

export function getQuoteById(id: string): Quote | null {
  ensureDb();
  const db = initDb();
  const row = db.prepare(`
    SELECT q.*, m.name_cn as master_name_cn, m.name_en as master_name_en, m.title as master_title, m.category as master_category
    FROM quotes q
    JOIN masters m ON q.master_id = m.id
    WHERE q.id = ?
  `).get(id) as Quote | undefined;

  if (row) {
    row.tags = getQuoteTags(row.id);
  }

  return row || null;
}

export function searchQuotes(keyword: string): Quote[] {
  ensureDb();
  const db = initDb();
  const like = `%${keyword}%`;
  const rows = db.prepare(`
    SELECT q.*, m.name_cn as master_name_cn, m.name_en as master_name_en, m.title as master_title, m.category as master_category
    FROM quotes q
    JOIN masters m ON q.master_id = m.id
    WHERE q.content_cn LIKE ? OR q.content_en LIKE ? OR m.name_cn LIKE ? OR m.name_en LIKE ?
    ORDER BY q.is_featured DESC, q.favorite_count DESC
    LIMIT 50
  `).all(like, like, like, like) as Quote[];

  for (const row of rows) {
    row.tags = getQuoteTags(row.id);
  }

  return rows;
}

export function getRelatedQuotes(quoteId: string, limit = 4): Quote[] {
  ensureDb();
  const db = initDb();
  const rows = db.prepare(`
    SELECT DISTINCT q.*, m.name_cn as master_name_cn, m.name_en as master_name_en, m.title as master_title, m.category as master_category
    FROM quotes q
    JOIN masters m ON q.master_id = m.id
    JOIN quote_tags qt ON qt.quote_id = q.id
    WHERE qt.tag_id IN (SELECT tag_id FROM quote_tags WHERE quote_id = ?)
    AND q.id != ?
    ORDER BY RANDOM()
    LIMIT ?
  `).all(quoteId, quoteId, limit) as Quote[];

  for (const row of rows) {
    row.tags = getQuoteTags(row.id);
  }

  return rows;
}

export function getDailyHistory(days = 30): Array<{ display_date: string; quote: Quote }> {
  ensureDb();
  const db = initDb();
  const rows = db.prepare(`
    SELECT dq.display_date, q.*, m.name_cn as master_name_cn, m.name_en as master_name_en, m.title as master_title, m.category as master_category
    FROM daily_quotes dq
    JOIN quotes q ON dq.quote_id = q.id
    JOIN masters m ON q.master_id = m.id
    ORDER BY dq.display_date DESC
    LIMIT ?
  `).all(days) as Array<Quote & { display_date: string }>;

  return rows.map((row) => {
    const { display_date, ...quote } = row;
    quote.tags = getQuoteTags(quote.id);
    return { display_date, quote };
  });
}

export function getAllQuotes(): Quote[] {
  ensureDb();
  const db = initDb();
  const rows = db.prepare(`
    SELECT q.*, m.name_cn as master_name_cn, m.name_en as master_name_en, m.title as master_title, m.category as master_category
    FROM quotes q
    JOIN masters m ON q.master_id = m.id
    ORDER BY q.is_featured DESC, q.favorite_count DESC
  `).all() as Quote[];

  for (const row of rows) {
    row.tags = getQuoteTags(row.id);
  }

  return rows;
}
