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
  is_machine_translated?: number | null;
  created_at: string;
  master_name_cn?: string;
  master_name_en?: string;
  master_title?: string;
  master_category?: string;
  master_avatar_url?: string | null;
  tags?: Tag[];
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  description: string;
  quote_count?: number;
}

export interface Interpretation {
  /** 核心解读：这句话究竟在说什么（3-5 句，说人话） */
  core: string;
  /** 应用实操：给普通投资者的可执行清单（4-5 条，行动导向） */
  practice: string[];
  /** 生动案例：一个真实故事 / 场景化情节（1-2 段） */
  story: string;
  /** 大师视角：这句话在该大师思想体系里的位置 */
  master_view: string | null;
}

function ensureDb() {
  seedData();
}

export function getDailyQuote(): Quote | null {
  ensureDb();
  const db = initDb();
  const today = new Date().toISOString().split("T")[0];

  let row = db.prepare(`
    SELECT q.*, m.name_cn as master_name_cn, m.name_en as master_name_en, m.title as master_title, m.category as master_category, m.avatar_url as master_avatar_url
    FROM daily_quotes dq
    JOIN quotes q ON dq.quote_id = q.id
    JOIN masters m ON q.master_id = m.id
    WHERE dq.display_date = ?
  `).get(today) as Quote | undefined;

  if (!row) {
    row = db.prepare(`
      SELECT q.*, m.name_cn as master_name_cn, m.name_en as master_name_en, m.title as master_title, m.category as master_category, m.avatar_url as master_avatar_url
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
    SELECT q.*, m.name_cn as master_name_cn, m.name_en as master_name_en, m.title as master_title, m.category as master_category, m.avatar_url as master_avatar_url
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
    SELECT q.*, m.name_cn as master_name_cn, m.name_en as master_name_en, m.title as master_title, m.category as master_category, m.avatar_url as master_avatar_url
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
    SELECT q.*, m.name_cn as master_name_cn, m.name_en as master_name_en, m.title as master_title, m.category as master_category, m.avatar_url as master_avatar_url
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
    SELECT q.*, m.name_cn as master_name_cn, m.name_en as master_name_en, m.title as master_title, m.category as master_category, m.avatar_url as master_avatar_url
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
    SELECT q.*, m.name_cn as master_name_cn, m.name_en as master_name_en, m.title as master_title, m.category as master_category, m.avatar_url as master_avatar_url
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
    SELECT q.*, m.name_cn as master_name_cn, m.name_en as master_name_en, m.title as master_title, m.category as master_category, m.avatar_url as master_avatar_url
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
    SELECT q.*, m.name_cn as master_name_cn, m.name_en as master_name_en, m.title as master_title, m.category as master_category, m.avatar_url as master_avatar_url
    FROM quotes q
    JOIN masters m ON q.master_id = m.id
    WHERE q.id = ?
  `).get(id) as Quote | undefined;

  if (row) {
    row.tags = getQuoteTags(row.id);
  }

  return row || null;
}

export function getQuoteInterpretation(quoteId: string): Interpretation | null {
  ensureDb();
  const db = initDb();
  const row = db.prepare(`
    SELECT quote_id, core, practice, story, master_view
    FROM quote_interpretations
    WHERE quote_id = ?
  `).get(quoteId) as
    | {
        quote_id: string;
        core: string;
        practice: string;
        story: string;
        master_view: string | null;
      }
    | undefined;

  if (!row) return null;

  let practice: string[] = [];
  try {
    const parsed = JSON.parse(row.practice);
    if (Array.isArray(parsed)) practice = parsed.map((v) => String(v));
  } catch {
    practice = row.practice ? [row.practice] : [];
  }

  return {
    core: row.core,
    practice,
    story: row.story,
    master_view: row.master_view ?? null,
  };
}

export function searchQuotes(keyword: string): Quote[] {
  ensureDb();
  const db = initDb();
  const like = `%${keyword}%`;
  const rows = db.prepare(`
    SELECT q.*, m.name_cn as master_name_cn, m.name_en as master_name_en, m.title as master_title, m.category as master_category, m.avatar_url as master_avatar_url
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
    SELECT DISTINCT q.*, m.name_cn as master_name_cn, m.name_en as master_name_en, m.title as master_title, m.category as master_category, m.avatar_url as master_avatar_url
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
    SELECT dq.display_date, q.*, m.name_cn as master_name_cn, m.name_en as master_name_en, m.title as master_title, m.category as master_category, m.avatar_url as master_avatar_url
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
    SELECT q.*, m.name_cn as master_name_cn, m.name_en as master_name_en, m.title as master_title, m.category as master_category, m.avatar_url as master_avatar_url
    FROM quotes q
    JOIN masters m ON q.master_id = m.id
    ORDER BY q.is_featured DESC, q.favorite_count DESC
  `).all() as Quote[];

  for (const row of rows) {
    row.tags = getQuoteTags(row.id);
  }

  return rows;
}

// ──────────────────────────────────────────────────────────────────────
// 管理后台：分页 / 搜索 / 更新 / 删除
// ──────────────────────────────────────────────────────────────────────

export interface ListQuotesParams {
  search?: string;
  masterId?: string;
  page: number;
  pageSize: number;
}

export interface ListQuotesResult {
  items: Quote[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function listQuotesAdmin({
  search,
  masterId,
  page,
  pageSize,
}: ListQuotesParams): ListQuotesResult {
  ensureDb();
  const db = initDb();

  const where: string[] = [];
  const params: unknown[] = [];

  if (search && search.trim()) {
    const like = `%${search.trim()}%`;
    where.push("(q.content_cn LIKE ? OR q.content_en LIKE ? OR m.name_cn LIKE ?)");
    params.push(like, like, like);
  }
  if (masterId) {
    where.push("q.master_id = ?");
    params.push(masterId);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const totalRow = db
    .prepare(`SELECT COUNT(*) as c FROM quotes q JOIN masters m ON q.master_id = m.id ${whereSql}`)
    .get(...params) as { c: number };
  const total = totalRow.c;

  const offset = (page - 1) * pageSize;
  const rows = db
    .prepare(
      `SELECT q.*, m.name_cn as master_name_cn, m.name_en as master_name_en, m.title as master_title, m.category as master_category, m.avatar_url as master_avatar_url
       FROM quotes q
       JOIN masters m ON q.master_id = m.id
       ${whereSql}
       ORDER BY q.created_at DESC, q.id DESC
       LIMIT ? OFFSET ?`,
    )
    .all(...params, pageSize, offset) as Quote[];

  for (const row of rows) {
    row.tags = getQuoteTags(row.id);
  }

  return {
    items: rows,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export interface UpdateQuotePatch {
  content_cn?: string;
  content_en?: string | null;
  master_id?: string;
  source?: string | null;
  source_year?: number | null;
  is_featured?: number;
}

export function updateQuote(id: string, patch: UpdateQuotePatch): Quote | null {
  ensureDb();
  const db = initDb();

  const fields: string[] = [];
  const values: unknown[] = [];

  if (patch.content_cn !== undefined) {
    fields.push("content_cn = ?");
    values.push(patch.content_cn);
  }
  if (patch.content_en !== undefined) {
    fields.push("content_en = ?");
    values.push(patch.content_en);
  }
  if (patch.master_id !== undefined) {
    fields.push("master_id = ?");
    values.push(patch.master_id);
  }
  if (patch.source !== undefined) {
    fields.push("source = ?");
    values.push(patch.source);
  }
  if (patch.source_year !== undefined) {
    fields.push("source_year = ?");
    values.push(patch.source_year);
  }
  if (patch.is_featured !== undefined) {
    fields.push("is_featured = ?");
    values.push(patch.is_featured);
  }

  if (fields.length === 0) return getQuoteById(id);

  values.push(id);
  const res = db
    .prepare(`UPDATE quotes SET ${fields.join(", ")} WHERE id = ?`)
    .run(...values);
  if (res.changes === 0) return null;

  return getQuoteById(id);
}

export function deleteQuote(id: string): boolean {
  ensureDb();
  const db = initDb();
  const tx = db.transaction((quoteId: string) => {
    db.prepare("DELETE FROM quote_tags WHERE quote_id = ?").run(quoteId);
    const res = db.prepare("DELETE FROM quotes WHERE id = ?").run(quoteId);
    return res.changes > 0;
  });
  return tx(id);
}
