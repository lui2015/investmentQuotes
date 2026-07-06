import { getDb, initDb } from "./db";

export interface RecordCallInput {
  endpoint: string;
  method: string;
  statusCode: number;
  isSuccess: boolean;
  isBatch?: boolean;
  itemCount?: number;
  approvedCount?: number;
  rejectedCount?: number;
  failedCount?: number;
  durationMs?: number;
  clientIp?: string;
  userAgent?: string;
}

/**
 * 记录一次 API 调用。写入失败绝不影响主业务，因此包 try/catch。
 */
export function recordApiCall(input: RecordCallInput): void {
  try {
    initDb();
    const db = getDb();
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    db.prepare(
      `INSERT INTO api_call_log
       (endpoint, method, status_code, is_success, is_batch, item_count,
        approved_count, rejected_count, failed_count,
        duration_ms, client_ip, user_agent, call_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      input.endpoint,
      input.method,
      input.statusCode,
      input.isSuccess ? 1 : 0,
      input.isBatch ? 1 : 0,
      input.itemCount ?? 1,
      input.approvedCount ?? 0,
      input.rejectedCount ?? 0,
      input.failedCount ?? 0,
      input.durationMs ?? null,
      input.clientIp ?? null,
      input.userAgent ?? null,
      today,
    );
  } catch (err) {
    // 记录失败不影响主流程
    console.error("[apiStats] recordApiCall failed:", err);
  }
}

export interface StatsSummary {
  total_calls: number;
  total_success: number;
  total_failed: number;
  total_items_processed: number;   // 累计名言总量（含批量）
  total_approved: number;          // 累计入库
  total_rejected: number;          // 累计去重
  today_calls: number;
  today_items: number;
  today_approved: number;
  today_rejected: number;
  avg_duration_ms: number | null;
  first_call_at: string | null;
  last_call_at: string | null;
}

export interface EndpointStat {
  endpoint: string;
  method: string;
  calls: number;
  success: number;
  failed: number;
  avg_duration_ms: number | null;
}

export interface DailyStat {
  date: string;         // YYYY-MM-DD
  calls: number;
  items: number;
  approved: number;
  rejected: number;
  success: number;
  failed: number;
}

export interface RecentCall {
  id: number;
  endpoint: string;
  method: string;
  status_code: number;
  is_success: number;
  is_batch: number;
  item_count: number;
  approved_count: number;
  rejected_count: number;
  duration_ms: number | null;
  client_ip: string | null;
  called_at: string;
}

/** 汇总统计 */
export function getStatsSummary(): StatsSummary {
  initDb();
  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);

  const total = db
    .prepare(
      `SELECT
         COUNT(*) AS total_calls,
         SUM(is_success) AS total_success,
         SUM(CASE WHEN is_success=0 THEN 1 ELSE 0 END) AS total_failed,
         SUM(item_count) AS total_items,
         SUM(approved_count) AS total_approved,
         SUM(rejected_count) AS total_rejected,
         AVG(duration_ms) AS avg_ms,
         MIN(called_at) AS first_at,
         MAX(called_at) AS last_at
       FROM api_call_log`,
    )
    .get() as {
      total_calls: number | null;
      total_success: number | null;
      total_failed: number | null;
      total_items: number | null;
      total_approved: number | null;
      total_rejected: number | null;
      avg_ms: number | null;
      first_at: string | null;
      last_at: string | null;
    };

  const todayRow = db
    .prepare(
      `SELECT
         COUNT(*) AS calls,
         SUM(item_count) AS items,
         SUM(approved_count) AS approved,
         SUM(rejected_count) AS rejected
       FROM api_call_log
       WHERE call_date = ?`,
    )
    .get(today) as {
      calls: number | null;
      items: number | null;
      approved: number | null;
      rejected: number | null;
    };

  return {
    total_calls: total.total_calls ?? 0,
    total_success: total.total_success ?? 0,
    total_failed: total.total_failed ?? 0,
    total_items_processed: total.total_items ?? 0,
    total_approved: total.total_approved ?? 0,
    total_rejected: total.total_rejected ?? 0,
    today_calls: todayRow.calls ?? 0,
    today_items: todayRow.items ?? 0,
    today_approved: todayRow.approved ?? 0,
    today_rejected: todayRow.rejected ?? 0,
    avg_duration_ms: total.avg_ms != null ? Math.round(total.avg_ms) : null,
    first_call_at: total.first_at,
    last_call_at: total.last_at,
  };
}

/** 按端点分组统计 */
export function getEndpointStats(): EndpointStat[] {
  initDb();
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT
         endpoint,
         method,
         COUNT(*) AS calls,
         SUM(is_success) AS success,
         SUM(CASE WHEN is_success=0 THEN 1 ELSE 0 END) AS failed,
         AVG(duration_ms) AS avg_ms
       FROM api_call_log
       GROUP BY endpoint, method
       ORDER BY calls DESC`,
    )
    .all() as Array<{
      endpoint: string;
      method: string;
      calls: number;
      success: number;
      failed: number;
      avg_ms: number | null;
    }>;

  return rows.map((r) => ({
    endpoint: r.endpoint,
    method: r.method,
    calls: r.calls,
    success: r.success,
    failed: r.failed,
    avg_duration_ms: r.avg_ms != null ? Math.round(r.avg_ms) : null,
  }));
}

/** 最近 N 天每天的调用统计（含今天，含无调用的日期补 0） */
export function getDailyStats(days = 7): DailyStat[] {
  initDb();
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT
         call_date AS date,
         COUNT(*) AS calls,
         SUM(item_count) AS items,
         SUM(approved_count) AS approved,
         SUM(rejected_count) AS rejected,
         SUM(is_success) AS success,
         SUM(CASE WHEN is_success=0 THEN 1 ELSE 0 END) AS failed
       FROM api_call_log
       WHERE call_date >= date('now', ?)
       GROUP BY call_date
       ORDER BY call_date ASC`,
    )
    .all(`-${days - 1} days`) as Array<{
      date: string;
      calls: number;
      items: number | null;
      approved: number | null;
      rejected: number | null;
      success: number | null;
      failed: number | null;
    }>;

  const map = new Map(rows.map((r) => [r.date, r]));
  const out: DailyStat[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const date = d.toISOString().slice(0, 10);
    const r = map.get(date);
    out.push({
      date,
      calls: r?.calls ?? 0,
      items: r?.items ?? 0,
      approved: r?.approved ?? 0,
      rejected: r?.rejected ?? 0,
      success: r?.success ?? 0,
      failed: r?.failed ?? 0,
    });
  }
  return out;
}

/** 最近 N 次调用 */
export function getRecentCalls(limit = 20): RecentCall[] {
  initDb();
  const db = getDb();
  return db
    .prepare(
      `SELECT id, endpoint, method, status_code, is_success, is_batch,
              item_count, approved_count, rejected_count,
              duration_ms, client_ip, called_at
       FROM api_call_log
       ORDER BY id DESC
       LIMIT ?`,
    )
    .all(limit) as RecentCall[];
}
