import ExcelJS from "exceljs";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { initDb, getDb } from "./db";
import { normalizeText } from "./similarity";

/** 上传文件大小上限（字节）。导出全库约 2-5MB，20MB 足够容纳扩展内容。 */
export const MAX_IMPORT_BYTES = 20 * 1024 * 1024;
/** 单次导入的最大行数，防止超大文件拖垮服务。 */
export const MAX_IMPORT_ROWS = 20000;
/** 单个文本字段的最大长度。 */
const MAX_FIELD_LENGTH = 4000;

type ColumnKey =
  | "id"
  | "content_cn"
  | "content_en"
  | "master_name_cn"
  | "master_name_en"
  | "source"
  | "source_year"
  | "is_featured"
  | "favorite_count"
  | "tags"
  | "core"
  | "practice"
  | "story"
  | "master_view"
  | "created_at";

/**
 * 表头别名：第一组为「一键导出 Excel」生成的中文表头，后续为用户自建表格常见的写法。
 * 只要能识别到表头，就按列名取值，与列顺序无关。
 */
const COLUMN_ALIASES: Record<ColumnKey, string[]> = {
  id: ["id", "编号", "名言id"],
  content_cn: ["中文内容", "content_cn", "名言内容", "中文", "内容", "名言", "quote", "content"],
  content_en: ["英文内容", "content_en", "英文", "english", "contenten"],
  master_name_cn: ["大师(中文)", "大师（中文）", "master_name_cn", "大师", "作者", "人物", "投资大师", "master", "author"],
  master_name_en: ["大师(英文)", "大师（英文）", "master_name_en", "大师英文名", "masteren"],
  source: ["来源", "source", "出处", "书名"],
  source_year: ["年份", "source_year", "年", "year"],
  is_featured: ["推荐", "is_featured", "是否推荐", "精选", "featured"],
  favorite_count: ["收藏数", "favorite_count", "收藏", "点赞数"],
  tags: ["标签", "tags", "tag", "分类"],
  core: ["核心解读", "core", "解读", "核心"],
  practice: ["应用实操", "practice", "实操", "行动清单"],
  story: ["生动案例", "story", "案例"],
  master_view: ["大师视角", "master_view", "视角"],
  created_at: ["创建时间", "created_at", "时间", "日期"],
};

const COLUMN_LABELS: Record<ColumnKey, string> = {
  id: "ID",
  content_cn: "中文内容",
  content_en: "英文内容",
  master_name_cn: "大师（中文）",
  master_name_en: "大师（英文）",
  source: "来源",
  source_year: "年份",
  is_featured: "推荐",
  favorite_count: "收藏数",
  tags: "标签",
  core: "核心解读",
  practice: "应用实操",
  story: "生动案例",
  master_view: "大师视角",
  created_at: "创建时间",
};

export interface ImportIssue {
  row: number;
  message: string;
}

export interface ImportReport {
  /** 可写入的有效行数 */
  totalRows: number;
  /** 致命问题：存在任何一条则拒绝写入 */
  errors: ImportIssue[];
  /** 非致命提示 */
  warnings: string[];
  /** 识别到的列名 */
  detectedColumns: string[];
  /** 缺失的可选列 */
  missingOptionalColumns: string[];
  /** 需要在库中新建的大师 */
  newMasters: string[];
  /** 前几条预览 */
  sample: Array<{ content_cn: string; master_name_cn: string }>;
  /** 当前线上名言条数 */
  currentCount: number;
}

export interface ParsedRow {
  id: string;
  content_cn: string;
  content_en: string | null;
  master_name_cn: string;
  master_name_en: string | null;
  source: string | null;
  source_year: number | null;
  is_featured: number;
  favorite_count: number;
  created_at: string;
  tags: string[];
  interpretation: {
    core: string;
    practice: string[];
    story: string;
    master_view: string | null;
  } | null;
}

export interface ParsedWorkbook {
  rows: ParsedRow[];
  report: ImportReport;
}

export interface ImportResult {
  quotes: number;
  interpretations: number;
  tags: number;
  mastersCreated: number;
  favoritesKept: number;
  dailyKept: number;
  backupFile: string | null;
}

/** ExcelJS 单元格值可能是 string / number / Date / 富文本 / 公式结果等对象。 */
function cellToString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") {
    const o = value as Record<string, unknown>;
    if (Array.isArray(o.richText)) {
      return o.richText
        .map((part) => String((part as { text?: unknown })?.text ?? ""))
        .join("");
    }
    if (o.result !== undefined) return cellToString(o.result);
    if (o.text !== undefined) return String(o.text);
    if (o.hyperlink !== undefined) return String(o.text ?? "");
    return "";
  }
  return "";
}

function normHeader(value: unknown): string {
  return cellToString(value)
    .trim()
    .replace(/[（]/g, "(")
    .replace(/[）]/g, ")")
    .replace(/\s+/g, "")
    .toLowerCase();
}

/** 在前若干行中寻找表头行（容忍标题行 / 说明行）。 */
function findHeaderRow(ws: ExcelJS.Worksheet): number | null {
  const max = Math.min(ws.rowCount, 10);
  for (let r = 1; r <= max; r++) {
    const row = ws.getRow(r);
    const headers = new Set<string>();
    for (let c = 1; c <= Math.min(row.cellCount, 40); c++) {
      const h = normHeader(row.getCell(c).value);
      if (h) headers.add(h);
    }
    if (
      COLUMN_ALIASES.content_cn.some((a) => headers.has(normHeader(a))) &&
      COLUMN_ALIASES.master_name_cn.some((a) => headers.has(normHeader(a)))
    ) {
      return r;
    }
  }
  return null;
}

function buildColumnMap(ws: ExcelJS.Worksheet, headerRow: number): Partial<Record<ColumnKey, number>> {
  const row = ws.getRow(headerRow);
  const map: Partial<Record<ColumnKey, number>> = {};
  for (let c = 1; c <= Math.min(row.cellCount, 40); c++) {
    const h = normHeader(row.getCell(c).value);
    if (!h) continue;
    for (const key of Object.keys(COLUMN_ALIASES) as ColumnKey[]) {
      if (map[key] !== undefined) continue;
      if (COLUMN_ALIASES[key].some((a) => normHeader(a) === h)) {
        map[key] = c;
        break;
      }
    }
  }
  return map;
}

function parseYear(raw: string): { value: number | null; valid: boolean } {
  const s = raw.trim();
  if (!s) return { value: null, valid: true };
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0 || n > 9999) {
    return { value: null, valid: false };
  }
  return { value: Math.trunc(n), valid: true };
}

function parseTags(raw: string): string[] {
  if (!raw.trim()) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const part of raw.split(/[、,，;；|]+/)) {
    const name = part.trim().slice(0, 50);
    if (!name || seen.has(name)) continue;
    seen.add(name);
    result.push(name);
    if (result.length >= 10) break;
  }
  return result;
}

/** 「应用实操」导出格式为 "1. xxx\n2. xxx"，导入时还原成数组。 */
function parsePractice(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^\s*(?:\d+[.、)]|[-•·*])\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 10);
}

function parseFeatured(raw: string): number {
  const s = raw.trim().toLowerCase();
  return ["是", "1", "true", "y", "yes", "推荐", "✓"].includes(s) ? 1 : 0;
}

function parseFavoriteCount(raw: string): number {
  const n = Number(raw.trim());
  return Number.isFinite(n) && n >= 0 ? Math.min(2_147_483_647, Math.trunc(n)) : 0;
}

function parseCreatedAt(raw: string, fallbackIso: string): string {
  const s = raw.trim();
  if (s) {
    const ts = Date.parse(s);
    if (Number.isFinite(ts)) {
      return new Date(ts).toISOString().slice(0, 19).replace("T", " ");
    }
  }
  return fallbackIso;
}

interface ExistingMaster {
  id: string;
  name_cn: string;
  name_en: string | null;
}

/** 建大师名 -> id 的索引，中文名与英文名都可匹配。 */
function masterLookup(masters: ExistingMaster[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const m of masters) {
    const cn = normalizeText(m.name_cn);
    if (cn && !map.has(cn)) map.set(cn, m.id);
    const en = normalizeText(m.name_en ?? "");
    if (en && !map.has(en)) map.set(en, m.id);
  }
  return map;
}

/**
 * 解析并校验 Excel（只读，不写库）。
 * 返回的行数据可直接交给 replaceQuotesFromImport 写入。
 */
export async function parseWorkbook(data: ArrayBuffer): Promise<ParsedWorkbook> {
  const workbook = new ExcelJS.Workbook();
  // exceljs 的类型声明把 Buffer 定义为 ArrayBuffer 的空子接口，与 Node Buffer 不兼容；
  // 运行时 jszip 同时支持 ArrayBuffer 与 Uint8Array，这里传 ArrayBuffer 并做类型断言。
  await workbook.xlsx.load(
    data as unknown as Parameters<typeof workbook.xlsx.load>[0],
  );
  const ws =
    workbook.worksheets.find((s: ExcelJS.Worksheet) => s.rowCount > 0) ??
    workbook.worksheets[0];
  if (!ws) {
    throw new Error("Excel 文件中没有工作表");
  }

  const headerRow = findHeaderRow(ws);
  if (headerRow === null) {
    throw new Error(
      "未识别到表头：请至少包含「中文内容」和「大师（中文）」两列（推荐使用「一键导出 Excel」生成的模板）",
    );
  }

  const columns = buildColumnMap(ws, headerRow);
  const errors: ImportIssue[] = [];
  const warnings: string[] = [];
  const rows: ParsedRow[] = [];
  const seenIds = new Set<string>();
  const masterNames = new Set<string>();
  const baseTime = Date.now();

  const db = initDb();
  const existingMasters = db
    .prepare("SELECT id, name_cn, name_en FROM masters")
    .all() as ExistingMaster[];
  const lookup = masterLookup(existingMasters);
  const currentCount = (
    db.prepare("SELECT COUNT(*) as c FROM quotes").get() as { c: number }
  ).c;

  const get = (row: ExcelJS.Row, key: ColumnKey): string => {
    const c = columns[key];
    return c === undefined ? "" : cellToString(row.getCell(c).value);
  };

  for (let r = headerRow + 1; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const contentCn = get(row, "content_cn").trim();
    const masterNameCn = get(row, "master_name_cn").trim();
    const contentEn = get(row, "content_en").trim();
    const source = get(row, "source").trim();
    const tagsRaw = get(row, "tags");
    const core = get(row, "core").trim();
    const story = get(row, "story").trim();

    // 完全空行跳过
    if (
      !contentCn &&
      !masterNameCn &&
      !contentEn &&
      !source &&
      !tagsRaw.trim() &&
      !core &&
      !story
    ) {
      continue;
    }

    if (rows.length >= MAX_IMPORT_ROWS) {
      errors.push({ row: r, message: `行数超过上限 ${MAX_IMPORT_ROWS} 条` });
      break;
    }

    if (!contentCn) errors.push({ row: r, message: "「中文内容」为空" });
    else if (contentCn.length > MAX_FIELD_LENGTH) {
      errors.push({ row: r, message: `「中文内容」超过 ${MAX_FIELD_LENGTH} 字符` });
    }
    if (!masterNameCn) errors.push({ row: r, message: "「大师（中文）」为空" });
    else if (masterNameCn.length > 200) {
      errors.push({ row: r, message: "大师名称过长" });
    }
    if (contentEn.length > MAX_FIELD_LENGTH) {
      errors.push({ row: r, message: `「英文内容」超过 ${MAX_FIELD_LENGTH} 字符` });
    }
    if (source.length > 500) errors.push({ row: r, message: "「来源」过长" });
    if (core.length > MAX_FIELD_LENGTH || story.length > MAX_FIELD_LENGTH) {
      errors.push({ row: r, message: "解读内容过长" });
    }

    const year = parseYear(get(row, "source_year"));
    if (!year.valid) errors.push({ row: r, message: "「年份」必须是 0-9999 的数字" });

    const rawId = get(row, "id").trim();
    let id = rawId;
    if (id && id.length > 200) {
      errors.push({ row: r, message: "ID 过长" });
      id = "";
    }
    if (id && seenIds.has(id)) {
      errors.push({ row: r, message: `ID 重复：${id}` });
    }
    if (!id) id = `q-${crypto.randomUUID()}`;
    seenIds.add(id);

    if (masterNameCn && !lookup.has(normalizeText(masterNameCn))) {
      const en = get(row, "master_name_en").trim();
      if (!en || !lookup.has(normalizeText(en))) masterNames.add(masterNameCn);
    }

    const practice = parsePractice(get(row, "practice"));
    const masterView = get(row, "master_view").trim();
    const interpretation =
      core && practice.length > 0 && story
        ? { core, practice, story, master_view: masterView || null }
        : null;

    const fallbackIso = new Date(baseTime - rows.length * 1000)
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");

    rows.push({
      id,
      content_cn: contentCn,
      content_en: contentEn || null,
      master_name_cn: masterNameCn,
      master_name_en: get(row, "master_name_en").trim() || null,
      source: source || null,
      source_year: year.value,
      is_featured: parseFeatured(get(row, "is_featured")),
      favorite_count: parseFavoriteCount(get(row, "favorite_count")),
      created_at: parseCreatedAt(get(row, "created_at"), fallbackIso),
      tags: parseTags(tagsRaw),
      interpretation,
    });
  }

  if (rows.length === 0) {
    errors.push({ row: headerRow + 1, message: "没有解析到任何数据行" });
  }

  const detectedColumns = (Object.keys(columns) as ColumnKey[]).map((k) => COLUMN_LABELS[k]);
  const optionalKeys: ColumnKey[] = [
    "id",
    "content_en",
    "source",
    "source_year",
    "is_featured",
    "favorite_count",
    "tags",
    "core",
    "practice",
    "story",
    "master_view",
    "created_at",
  ];
  const missingOptionalColumns = optionalKeys
    .filter((k) => columns[k] === undefined)
    .map((k) => COLUMN_LABELS[k]);

  // 提示信息
  warnings.push(
    `将清空当前 ${currentCount} 条名言及其解读、标签，并写入 ${rows.length} 条新数据，操作不可撤销。`,
  );
  if (columns.id === undefined) {
    warnings.push("文件中没有 ID 列：现有用户收藏与每日名言将无法对应，会被清除。");
  }
  if (missingOptionalColumns.length > 0) {
    warnings.push(`以下列未提供，对应信息将留空：${missingOptionalColumns.join("、")}。`);
  }
  if (masterNames.size > 0) {
    warnings.push(`以下大师在库中不存在，将自动创建：${Array.from(masterNames).slice(0, 10).join("、")}${masterNames.size > 10 ? " 等" : ""}。`);
  }

  return {
    rows,
    report: {
      totalRows: rows.length,
      errors: errors.slice(0, 20),
      warnings,
      detectedColumns,
      missingOptionalColumns,
      newMasters: Array.from(masterNames),
      sample: rows.slice(0, 3).map((x) => ({
        content_cn: x.content_cn,
        master_name_cn: x.master_name_cn,
      })),
      currentCount,
    },
  };
}

/** 导入前把当前数据留一份 JSON 快照，便于误操作时人工恢复。 */
function backupCurrentData(): string | null {
  try {
    const db = getDb();
    const quotes = db
      .prepare(
        `SELECT q.*, m.name_cn AS master_name_cn, m.name_en AS master_name_en
         FROM quotes q LEFT JOIN masters m ON m.id = q.master_id`,
      )
      .all();
    const interpretations = db.prepare("SELECT * FROM quote_interpretations").all();
    const quoteTags = db
      .prepare(
        `SELECT qt.quote_id, t.name AS tag_name FROM quote_tags qt LEFT JOIN tags t ON t.id = qt.tag_id`,
      )
      .all();
    const tags = db.prepare("SELECT * FROM tags").all();

    const dir = path.join(process.cwd(), "data", "backups");
    fs.mkdirSync(dir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
    const file = path.join(dir, `quotes_before_import_${stamp}.json`);
    fs.writeFileSync(
      file,
      JSON.stringify({ exportedAt: new Date().toISOString(), quotes, interpretations, quoteTags, tags }, null, 2),
      "utf8",
    );

    // 只保留最近 5 份，避免占满服务器磁盘
    const files = fs
      .readdirSync(dir)
      .filter((f) => f.startsWith("quotes_before_import_") && f.endsWith(".json"))
      .sort();
    for (const old of files.slice(0, Math.max(0, files.length - 5))) {
      fs.rmSync(path.join(dir, old), { force: true });
    }
    return file;
  } catch (err) {
    console.error("[import] 备份失败（不影响导入）", err);
    return null;
  }
}

/**
 * 事务替换线上名言数据。
 * - 保留 masters 资料（头像 / 简介），按名称匹配；缺失的大师自动创建
 * - 保留仍可对应的用户收藏与每日名言
 * - 写入 data_source=import 标记，阻止 seed 自愈逻辑重新插入种子名言
 */
export function replaceQuotesFromImport(rows: ParsedRow[]): ImportResult {
  const db = initDb();
  const backupFile = backupCurrentData();

  const savedFavorites = db
    .prepare("SELECT user_id, quote_id, created_at FROM user_favorites")
    .all() as Array<{ user_id: string; quote_id: string; created_at: string }>;
  const savedDaily = db
    .prepare("SELECT id, quote_id, display_date, created_at FROM daily_quotes")
    .all() as Array<{
      id: string;
      quote_id: string;
      display_date: string;
      created_at: string;
    }>;

  const existingMasters = db
    .prepare("SELECT id, name_cn, name_en FROM masters")
    .all() as ExistingMaster[];
  const lookup = masterLookup(existingMasters);
  const existingTags = db
    .prepare("SELECT id, name, slug, description FROM tags")
    .all() as Array<{
      id: string;
      name: string;
      slug: string;
      description: string | null;
    }>;
  const tagByName = new Map(existingTags.map((t) => [t.name, t]));

  // 预先算好要新建的大师与标签，保证事务内只做写入
  const masterIdByName = new Map<string, string>();
  const newMasters: Array<{
    id: string;
    name_cn: string;
    name_en: string | null;
  }> = [];
  for (const row of rows) {
    const cnKey = normalizeText(row.master_name_cn);
    if (masterIdByName.has(cnKey)) {
      const knownId = masterIdByName.get(cnKey)!;
      if (row.master_name_en && !lookup.has(normalizeText(row.master_name_en))) {
        lookup.set(normalizeText(row.master_name_en), knownId);
      }
      continue;
    }
    let id = lookup.get(cnKey);
    if (!id && row.master_name_en) {
      id = lookup.get(normalizeText(row.master_name_en));
    }
    if (!id) {
      id = `m-import-${crypto.randomUUID()}`;
      newMasters.push({
        id,
        name_cn: row.master_name_cn,
        name_en: row.master_name_en,
      });
      lookup.set(cnKey, id);
      if (row.master_name_en) lookup.set(normalizeText(row.master_name_en), id);
    }
    masterIdByName.set(cnKey, id);
  }

  const neededTags: Array<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
  }> = [];
  const tagIdByName = new Map<string, string>();
  for (const row of rows) {
    for (const name of row.tags) {
      if (tagIdByName.has(name)) continue;
      const existing = tagByName.get(name);
      if (existing) {
        tagIdByName.set(name, existing.id);
        neededTags.push(existing);
      } else {
        const id = `t-import-${crypto.randomUUID()}`;
        const slug = `import-${crypto.randomUUID().slice(0, 8)}`;
        tagIdByName.set(name, id);
        neededTags.push({ id, name, slug, description: null });
      }
    }
  }

  const newIds = new Set(rows.map((r) => r.id));
  let interpretations = 0;

  const tx = db.transaction(() => {
    // 先清掉有外键指向 quotes 的表
    db.exec(`
      DELETE FROM user_favorites;
      DELETE FROM daily_quotes;
      DELETE FROM quote_interpretations;
      DELETE FROM quote_tags;
      DELETE FROM quotes;
      DELETE FROM tags;
    `);

    const insertMaster = db.prepare(
      `INSERT INTO masters (id, name_cn, name_en, title, bio, category)
       VALUES (?, ?, ?, '', '', 'imported')`,
    );
    for (const m of newMasters) {
      insertMaster.run(m.id, m.name_cn, m.name_en);
    }

    const insertTag = db.prepare(
      `INSERT INTO tags (id, name, slug, description) VALUES (?, ?, ?, ?)`,
    );
    for (const t of neededTags) {
      insertTag.run(t.id, t.name, t.slug, t.description);
    }

    const insertQuote = db.prepare(
      `INSERT INTO quotes
         (id, content_cn, content_en, master_id, source, source_year, is_featured, favorite_count, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    const insertQuoteTag = db.prepare(
      `INSERT OR IGNORE INTO quote_tags (quote_id, tag_id) VALUES (?, ?)`,
    );
    const insertInterp = db.prepare(
      `INSERT INTO quote_interpretations (quote_id, core, practice, story, master_view)
       VALUES (?, ?, ?, ?, ?)`,
    );

    for (const row of rows) {
      const masterId = masterIdByName.get(normalizeText(row.master_name_cn))!;
      insertQuote.run(
        row.id,
        row.content_cn,
        row.content_en,
        masterId,
        row.source,
        row.source_year,
        row.is_featured,
        row.favorite_count,
        row.created_at,
      );
      for (const name of row.tags) {
        const tagId = tagIdByName.get(name);
        if (tagId) insertQuoteTag.run(row.id, tagId);
      }
      if (row.interpretation) {
        insertInterp.run(
          row.id,
          row.interpretation.core,
          JSON.stringify(row.interpretation.practice),
          row.interpretation.story,
          row.interpretation.master_view,
        );
        interpretations++;
      }
    }

    // 恢复仍然有效的收藏 / 每日名言（导出再导入时 ID 会保留）
    const insertFavorite = db.prepare(
      `INSERT OR IGNORE INTO user_favorites (user_id, quote_id, created_at) VALUES (?, ?, ?)`,
    );
    let favoritesKept = 0;
    for (const f of savedFavorites) {
      if (!newIds.has(f.quote_id)) continue;
      insertFavorite.run(f.user_id, f.quote_id, f.created_at);
      favoritesKept++;
    }
    const insertDaily = db.prepare(
      `INSERT OR IGNORE INTO daily_quotes (id, quote_id, display_date, created_at)
       VALUES (?, ?, ?, ?)`,
    );
    let dailyKept = 0;
    for (const d of savedDaily) {
      if (!newIds.has(d.quote_id)) continue;
      insertDaily.run(d.id, d.quote_id, d.display_date, d.created_at);
      dailyKept++;
    }

    // 阻止 seed 自愈重新插入种子名言，保证导入结果不被污染
    db.prepare(
      `INSERT INTO app_settings (key, value, updated_at)
       VALUES ('data_source', 'import', datetime('now'))
       ON CONFLICT(key) DO UPDATE SET value = 'import', updated_at = datetime('now')`,
    ).run();

    return { favoritesKept, dailyKept };
  });

  const kept = tx();

  return {
    quotes: rows.length,
    interpretations,
    tags: neededTags.length,
    mastersCreated: newMasters.length,
    favoritesKept: kept.favoritesKept,
    dailyKept: kept.dailyKept,
    backupFile,
  };
}
