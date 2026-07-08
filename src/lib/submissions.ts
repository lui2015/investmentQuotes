import { initDb } from "./db";
import { seedData } from "./seed";
import { v4 } from "./uuid";
import { combinedSimilarity, DEDUPE_THRESHOLDS, isSameMaster } from "./similarity";

export interface InterpretationInput {
  /** 核心解读：这句话究竟在说什么（3-5 句，说人话） */
  core: string;
  /** 应用实操：给普通投资者的可执行清单（4 条，行动导向） */
  practice: string[];
  /** 生动案例：一个真实故事 / 场景化情节（1-2 段） */
  story: string;
  /** 大师视角：这句话在该大师思想体系里的位置（可空） */
  master_view?: string | null;
}

export interface SubmissionInput {
  content_cn: string;
  content_en?: string;
  master_name: string;
  source?: string;
  source_year?: number;
  tags?: string[];
  submitter?: string;
  /**
   * 4 块深度解读（必填）：
   * - core: 核心解读
   * - practice: 应用实操 4 条
   * - story: 生动案例
   * - master_view: 大师视角（可空）
   */
  interpretation: InterpretationInput;
}

export interface Submission {
  id: string;
  content_cn: string;
  content_en: string | null;
  master_name: string;
  source: string | null;
  source_year: number | null;
  tags: string | null;
  submitter: string | null;
  status: "pending" | "approved" | "merged" | "rejected";
  matched_quote_id: string | null;
  matched_master_id: string | null;
  similarity_score: number | null;
  dedupe_reason: string | null;
  created_at: string;
  processed_at: string | null;
}

/** 单条即时处理结果 */
export interface InstantResult {
  status: "approved" | "rejected";
  submission_id: string;
  quote_id: string | null;
  master_id: string | null;
  similarity_score: number;
  reason: string;
  input?: { content_cn: string; master_name: string };
}

/** 输入校验 */
export function validateSubmission(input: Partial<SubmissionInput>): string | null {
  if (!input.content_cn || typeof input.content_cn !== "string") {
    return "content_cn（中文名言内容）必填";
  }
  const content = input.content_cn.trim();
  if (content.length < 4) return "content_cn 至少 4 个字符";
  if (content.length > 500) return "content_cn 最多 500 个字符";
  if (!input.master_name || typeof input.master_name !== "string") {
    return "master_name（作者姓名）必填";
  }
  if (input.master_name.trim().length > 50) return "master_name 最多 50 字符";
  if (input.content_en && input.content_en.length > 1000) return "content_en 最多 1000 字符";
  if (input.source && input.source.length > 200) return "source 最多 200 字符";
  if (input.source_year !== undefined && input.source_year !== null) {
    const y = Number(input.source_year);
    if (!Number.isFinite(y) || y < 1800 || y > new Date().getFullYear() + 1) {
      return "source_year 应在 1800 到当前年份之间";
    }
  }
  if (input.tags && (!Array.isArray(input.tags) || input.tags.length > 10)) {
    return "tags 最多 10 个";
  }
  if (input.submitter && input.submitter.length > 50) return "submitter 最多 50 字符";

  // ── 4 块深度解读 校验（必填） ──
  const ie = input.interpretation;
  if (!ie || typeof ie !== "object") {
    return "interpretation 必填，需要 4 块深度解读（core / practice / story / master_view）";
  }
  if (typeof ie.core !== "string" || ie.core.trim().length < 10) {
    return "interpretation.core 必填且至少 10 字";
  }
  if (ie.core.length > 2000) return "interpretation.core 最多 2000 字";
  if (!Array.isArray(ie.practice) || ie.practice.length !== 4) {
    return "interpretation.practice 必须是恰好 4 条的数组";
  }
  for (let i = 0; i < 4; i++) {
    const p = ie.practice[i];
    if (typeof p !== "string" || p.trim().length < 4) {
      return `interpretation.practice[${i}] 必填且至少 4 字`;
    }
    if (p.length > 500) return `interpretation.practice[${i}] 最多 500 字`;
  }
  if (typeof ie.story !== "string" || ie.story.trim().length < 20) {
    return "interpretation.story 必填且至少 20 字";
  }
  if (ie.story.length > 3000) return "interpretation.story 最多 3000 字";
  if (ie.master_view != null) {
    if (typeof ie.master_view !== "string") return "interpretation.master_view 必须是字符串或 null";
    if (ie.master_view.length > 1500) return "interpretation.master_view 最多 1500 字";
  }
  return null;
}

/** 查询单条提交 */
export function getSubmission(id: string): Submission | null {
  const db = initDb();
  return (db.prepare("SELECT * FROM quote_submissions WHERE id = ?").get(id) as Submission) || null;
}

/** 分页查询提交列表 */
export function listSubmissions(opts: { status?: string; limit?: number; offset?: number } = {}): {
  total: number;
  items: Submission[];
} {
  const db = initDb();
  const limit = Math.min(Math.max(opts.limit ?? 20, 1), 100);
  const offset = Math.max(opts.offset ?? 0, 0);

  if (opts.status) {
    const total = (db.prepare("SELECT COUNT(*) AS c FROM quote_submissions WHERE status = ?").get(opts.status) as { c: number }).c;
    const items = db.prepare(`
      SELECT * FROM quote_submissions WHERE status = ?
      ORDER BY created_at DESC LIMIT ? OFFSET ?
    `).all(opts.status, limit, offset) as Submission[];
    return { total, items };
  }

  const total = (db.prepare("SELECT COUNT(*) AS c FROM quote_submissions").get() as { c: number }).c;
  const items = db.prepare(`
    SELECT * FROM quote_submissions
    ORDER BY created_at DESC LIMIT ? OFFSET ?
  `).all(limit, offset) as Submission[];
  return { total, items };
}

/** 内部：在事务内处理单条名言（校验 → 查重 → 入库 → 记录 submission） */
function processOneInTransaction(
  db: ReturnType<typeof initDb>,
  input: SubmissionInput,
  submitterIp: string | null,
): InstantResult {
  const now = new Date().toISOString();
  const subId = "sub-" + v4();

  // 1. 匹配或创建大师
  const masters = db.prepare("SELECT id, name_cn, name_en FROM masters").all() as Array<{
    id: string;
    name_cn: string;
    name_en: string;
  }>;
  let matchedMaster = masters.find(
    (m) => isSameMaster(m.name_cn, input.master_name) || isSameMaster(m.name_en, input.master_name),
  );
  if (!matchedMaster) {
    // 自动创建新大师（允许用户为库外作者提交）
    const newMasterId = "um-" + v4();
    db.prepare(
      `INSERT INTO masters (id, name_cn, category) VALUES (?, ?, 'user-submitted')`,
    ).run(newMasterId, input.master_name.trim());
    matchedMaster = { id: newMasterId, name_cn: input.master_name.trim(), name_en: "" };
  }

  // 2. 与库内名言查重（同大师优先）
  const candidates = db
    .prepare(
      `SELECT q.id, q.content_cn, q.master_id, m.name_cn AS master_name_cn
       FROM quotes q JOIN masters m ON q.master_id = m.id
       WHERE q.master_id = ?`,
    )
    .all(matchedMaster.id) as Array<{
    id: string;
    content_cn: string;
    master_id: string;
    master_name_cn: string;
  }>;

  let bestScore = 0;
  let bestQuoteId: string | null = null;
  for (const c of candidates) {
    const { score } = combinedSimilarity(
      input.content_cn,
      input.master_name,
      c.content_cn,
      c.master_name_cn,
    );
    if (score > bestScore) {
      bestScore = score;
      bestQuoteId = c.id;
      if (score >= 1) break;
    }
  }

  const tagsJson = input.tags && input.tags.length > 0 ? JSON.stringify(input.tags) : null;

  // 3. 若相似度过高 → 拒绝
  if (bestScore >= DEDUPE_THRESHOLDS.DUPLICATE) {
    const reason = `与已有名言相似度 ${(bestScore * 100).toFixed(1)}% 超过阈值，自动去重`;
    db.prepare(
      `INSERT INTO quote_submissions
       (id, content_cn, content_en, master_name, source, source_year, tags, submitter, submitter_ip,
        status, matched_quote_id, matched_master_id, similarity_score, dedupe_reason, created_at, processed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'rejected', ?, ?, ?, ?, ?, ?)`,
    ).run(
      subId,
      input.content_cn.trim(),
      input.content_en?.trim() || null,
      input.master_name.trim(),
      input.source?.trim() || null,
      input.source_year ?? null,
      tagsJson,
      input.submitter?.trim() || null,
      submitterIp,
      bestQuoteId,
      matchedMaster.id,
      bestScore,
      reason,
      now,
      now,
    );
    return {
      status: "rejected",
      submission_id: subId,
      quote_id: bestQuoteId,
      master_id: matchedMaster.id,
      similarity_score: bestScore,
      reason,
    };
  }

  // 4. 相似度合格 → 立即入库
  const newQuoteId = "uq-" + v4();
  db.prepare(
    `INSERT INTO quotes (id, content_cn, content_en, master_id, source, source_year, is_featured)
     VALUES (?, ?, ?, ?, ?, ?, 0)`,
  ).run(
    newQuoteId,
    input.content_cn.trim(),
    input.content_en?.trim() || null,
    matchedMaster.id,
    input.source?.trim() || null,
    input.source_year ?? null,
  );

  // 5. 关联标签
  if (input.tags && input.tags.length > 0) {
    const getTagStmt = db.prepare("SELECT id FROM tags WHERE name = ?");
    const insertTagRelStmt = db.prepare(
      "INSERT OR IGNORE INTO quote_tags (quote_id, tag_id) VALUES (?, ?)",
    );
    for (const tagName of input.tags) {
      const tag = getTagStmt.get(tagName) as { id: string } | undefined;
      if (tag) insertTagRelStmt.run(newQuoteId, tag.id);
    }
  }

  // 5.5 写入 4 块深度解读（必填，提交时已校验）
  const ie = input.interpretation;
  db.prepare(
    `INSERT OR REPLACE INTO quote_interpretations
     (quote_id, core, practice, story, master_view)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(
    newQuoteId,
    ie.core.trim(),
    JSON.stringify(ie.practice.map((s) => String(s).trim())),
    ie.story.trim(),
    ie.master_view ? ie.master_view.trim() : null,
  );

  // 6. 记录 submission（approved）
  const approvedReason =
    bestScore > 0
      ? `已入库（与已有名言最高相似度 ${(bestScore * 100).toFixed(1)}%）`
      : "已入库（无相似名言）";
  db.prepare(
    `INSERT INTO quote_submissions
     (id, content_cn, content_en, master_name, source, source_year, tags, submitter, submitter_ip,
      status, matched_quote_id, matched_master_id, similarity_score, dedupe_reason, created_at, processed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', ?, ?, ?, ?, ?, ?)`,
  ).run(
    subId,
    input.content_cn.trim(),
    input.content_en?.trim() || null,
    input.master_name.trim(),
    input.source?.trim() || null,
    input.source_year ?? null,
    tagsJson,
    input.submitter?.trim() || null,
    submitterIp,
    newQuoteId,
    matchedMaster.id,
    bestScore,
    approvedReason,
    now,
    now,
  );

  return {
    status: "approved",
    submission_id: subId,
    quote_id: newQuoteId,
    master_id: matchedMaster.id,
    similarity_score: bestScore,
    reason: approvedReason,
  };
}

/**
 * 即时处理单条提交（校验+查重+入库一步到位，立即生效）
 */
export function processSubmissionInstantly(
  input: SubmissionInput,
  submitterIp?: string,
): InstantResult {
  seedData();
  const db = initDb();
  const txn = db.transaction(() => processOneInTransaction(db, input, submitterIp || null));
  return txn();
}

/**
 * 批量即时处理（原子事务：整个批次要么全成功要么全回滚）
 * 但内部单条失败会记录到 errors 中，不影响其它条目入库
 */
export interface BatchResult {
  total: number;
  approved: number;
  rejected: number;
  failed: number;
  results: Array<
    | ({ index: number; ok: true } & InstantResult)
    | { index: number; ok: false; error: string; input?: { content_cn?: string; master_name?: string } }
  >;
}

export function processBatchInstantly(
  inputs: Array<Partial<SubmissionInput>>,
  submitterIp?: string,
): BatchResult {
  seedData();
  const db = initDb();
  const ip = submitterIp || null;

  const result: BatchResult = {
    total: inputs.length,
    approved: 0,
    rejected: 0,
    failed: 0,
    results: [],
  };

  const txn = db.transaction(() => {
    for (let i = 0; i < inputs.length; i++) {
      const raw = inputs[i];
      const err = validateSubmission(raw);
      if (err) {
        result.failed++;
        result.results.push({
          index: i,
          ok: false,
          error: err,
          input: { content_cn: raw.content_cn, master_name: raw.master_name },
        });
        continue;
      }
      try {
        const one = processOneInTransaction(db, raw as SubmissionInput, ip);
        if (one.status === "approved") result.approved++;
        else result.rejected++;
        result.results.push({
          index: i,
          ok: true,
          ...one,
          input: { content_cn: raw.content_cn!, master_name: raw.master_name! },
        });
      } catch (e) {
        result.failed++;
        result.results.push({
          index: i,
          ok: false,
          error: (e as Error).message,
          input: { content_cn: raw.content_cn, master_name: raw.master_name },
        });
      }
    }
  });

  txn();
  return result;
}

/**
 * （保留）后台定时任务：处理历史遗留的 pending 提交
 * 现在提交是即时生效的，此函数主要用于清理旧版本产生的 pending 数据
 */
export interface DedupeResult {
  processed: number;
  approved: number;
  rejected: number;
  skipped: number;
  details: Array<{
    id: string;
    action: "approved" | "rejected" | "skipped";
    score?: number;
    reason: string;
    matchedQuoteId?: string | null;
  }>;
}

export function runDedupeJob(): DedupeResult {
  seedData();
  const db = initDb();

  const pending = db.prepare(`
    SELECT * FROM quote_submissions WHERE status = 'pending' ORDER BY created_at ASC LIMIT 500
  `).all() as Submission[];

  const result: DedupeResult = {
    processed: pending.length,
    approved: 0,
    rejected: 0,
    skipped: 0,
    details: [],
  };

  const masters = db.prepare("SELECT id, name_cn, name_en FROM masters").all() as Array<{
    id: string;
    name_cn: string;
    name_en: string;
  }>;

  const updateStmt = db.prepare(`
    UPDATE quote_submissions
    SET status = ?, matched_quote_id = ?, matched_master_id = ?,
        similarity_score = ?, dedupe_reason = ?, processed_at = datetime('now')
    WHERE id = ?
  `);

  const insertQuoteStmt = db.prepare(`
    INSERT INTO quotes (id, content_cn, content_en, master_id, source, source_year, is_featured)
    VALUES (?, ?, ?, ?, ?, ?, 0)
  `);

  const insertTagRelStmt = db.prepare(`
    INSERT OR IGNORE INTO quote_tags (quote_id, tag_id) VALUES (?, ?)
  `);

  const getTagStmt = db.prepare("SELECT id FROM tags WHERE name = ?");

  const transaction = db.transaction(() => {
    for (const sub of pending) {
      const matchedMaster = masters.find((m) =>
        isSameMaster(m.name_cn, sub.master_name) || isSameMaster(m.name_en, sub.master_name),
      );

      let candidates: Array<{ id: string; content_cn: string; master_id: string; master_name_cn: string }> = [];
      if (matchedMaster) {
        candidates = db.prepare(`
          SELECT q.id, q.content_cn, q.master_id, m.name_cn AS master_name_cn
          FROM quotes q JOIN masters m ON q.master_id = m.id
          WHERE q.master_id = ?
        `).all(matchedMaster.id) as typeof candidates;
      } else {
        candidates = db.prepare(`
          SELECT q.id, q.content_cn, q.master_id, m.name_cn AS master_name_cn
          FROM quotes q JOIN masters m ON q.master_id = m.id
        `).all() as typeof candidates;
      }

      let bestScore = 0;
      let bestQuoteId: string | null = null;
      let bestMasterId: string | null = null;

      for (const c of candidates) {
        const { score } = combinedSimilarity(
          sub.content_cn,
          sub.master_name,
          c.content_cn,
          c.master_name_cn,
        );
        if (score > bestScore) {
          bestScore = score;
          bestQuoteId = c.id;
          bestMasterId = c.master_id;
        }
      }

      if (bestScore >= DEDUPE_THRESHOLDS.DUPLICATE) {
        updateStmt.run(
          "rejected",
          bestQuoteId,
          bestMasterId,
          bestScore,
          `与已有名言相似度 ${(bestScore * 100).toFixed(1)}% 超过阈值，自动去重`,
          sub.id,
        );
        result.rejected++;
        result.details.push({
          id: sub.id,
          action: "rejected",
          score: bestScore,
          reason: "duplicate",
          matchedQuoteId: bestQuoteId,
        });
        continue;
      }

      if (!matchedMaster) {
        // 自动创建新大师（与即时处理保持一致）
        const newMasterId = "um-" + v4();
        db.prepare(
          `INSERT INTO masters (id, name_cn, category) VALUES (?, ?, 'user-submitted')`,
        ).run(newMasterId, sub.master_name);
        const newMaster = { id: newMasterId, name_cn: sub.master_name, name_en: "" };
        masters.push(newMaster);

        const newQuoteId = "uq-" + v4();
        insertQuoteStmt.run(
          newQuoteId,
          sub.content_cn,
          sub.content_en,
          newMasterId,
          sub.source,
          sub.source_year,
        );
        if (sub.tags) {
          try {
            const tagNames = JSON.parse(sub.tags) as string[];
            for (const tagName of tagNames) {
              const tag = getTagStmt.get(tagName) as { id: string } | undefined;
              if (tag) insertTagRelStmt.run(newQuoteId, tag.id);
            }
          } catch {}
        }
        updateStmt.run(
          "approved",
          newQuoteId,
          newMasterId,
          bestScore,
          `新建大师并入库`,
          sub.id,
        );
        result.approved++;
        result.details.push({
          id: sub.id,
          action: "approved",
          score: bestScore,
          reason: "ok",
          matchedQuoteId: newQuoteId,
        });
        continue;
      }

      const newQuoteId = "uq-" + v4();
      insertQuoteStmt.run(
        newQuoteId,
        sub.content_cn,
        sub.content_en,
        matchedMaster.id,
        sub.source,
        sub.source_year,
      );

      if (sub.tags) {
        try {
          const tagNames = JSON.parse(sub.tags) as string[];
          for (const tagName of tagNames) {
            const tag = getTagStmt.get(tagName) as { id: string } | undefined;
            if (tag) insertTagRelStmt.run(newQuoteId, tag.id);
          }
        } catch {}
      }

      updateStmt.run(
        "approved",
        newQuoteId,
        matchedMaster.id,
        bestScore,
        bestScore > 0 ? `已入库（最高相似度 ${(bestScore * 100).toFixed(1)}%）` : "已入库",
        sub.id,
      );
      result.approved++;
      result.details.push({
        id: sub.id,
        action: "approved",
        score: bestScore,
        reason: "ok",
        matchedQuoteId: newQuoteId,
      });
    }
  });

  transaction();
  return result;
}
