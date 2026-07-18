#!/usr/bin/env node
/**
 * gen-interpretations-llm.mjs
 * ─────────────────────────────────────────────────────────────────────────
 * 用 DeepSeek（OpenAI 兼容 Chat Completions）为「缺失解读」的名言批量生成
 * 4 段深度解读：核心解读 / 应用实操 / 生动案例 / 大师视角。
 *
 * 设计要点：
 *   - 仅处理「尚未写入 quote_interpretations」的名言，可重复运行（幂等）。
 *   - Key 仅来自环境变量 DEEPSEEK_API_KEY，不落盘、不打印到日志以外。
 *   - 并发受控（CONCURRENCY），429 / 5xx 指数退避重试。
 *   - 严格校验返回 JSON：core / story 长度、practice 恰为 4 条，
 *     不合规则重试，多次失败则跳过（不写脏数据）。
 *   - DRY_RUN=1 仅统计缺失条数与样例，不发请求、不写库。
 *
 * 用法（容器内）：
 *   DEEPSEEK_API_KEY=sk-xxx node scripts/gen-interpretations-llm.mjs
 *   DRY_RUN=1            node scripts/gen-interpretations-llm.mjs
 *
 * 可选环境变量：
 *   DB_PATH          默认 /app/data/quotes.db
 *   DEEPSEEK_BASE_URL 默认 https://api.deepseek.com
 *   DEEPSEEK_MODEL    默认 deepseek-chat
 *   CONCURRENCY       默认 3
 *   DRY_RUN           1 时只统计不生成
 */

import Database from "better-sqlite3";

// ── 配置 ──────────────────────────────────────────────────────────────────
const API_KEY = process.env.DEEPSEEK_API_KEY || "";
const BASE_URL = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
const MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";
const CONCURRENCY = Math.max(1, parseInt(process.env.CONCURRENCY || "3", 10) || 3);
const DRY_RUN = process.env.DRY_RUN === "1";
const DB_PATH = process.env.DB_PATH || "/app/data/quotes.db";

if (!DRY_RUN && !API_KEY) {
  console.error("❌ 缺少 DEEPSEEK_API_KEY 环境变量，无法调用大模型。\n" +
    "   用法：DEEPSEEK_API_KEY=sk-xxx node scripts/gen-interpretations-llm.mjs");
  process.exit(1);
}

// ── 数据库 ────────────────────────────────────────────────────────────────
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.pragma("busy_timeout = 15000");

// ── 取缺失解读的名言 ─────────────────────────────────────────────────────────
function getMissingQuotes() {
  return db.prepare(`
    SELECT q.id,
           q.content_cn,
           q.content_en,
           m.name_cn   AS master_name_cn,
           m.title     AS master_title,
           m.bio       AS master_bio,
           m.category  AS master_category
    FROM quotes q
    JOIN masters m ON q.master_id = m.id
    WHERE NOT EXISTS (
      SELECT 1 FROM quote_interpretations i WHERE i.quote_id = q.id
    )
    ORDER BY q.favorite_count DESC, q.created_at DESC
  `).all();
}

// ── DeepSeek 调用 ───────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `你是一位资深的投资者教育内容写作者，擅长把投资大师的名言改写成通俗易懂、可落地的中文解读。
要求：
1. 语言为中文，说人话，避免空洞套话与正确的废话。
2. 严格按要求的 JSON 结构返回，不要任何额外说明文字。
3. 四条内容彼此互补，不重复；长度需符合各自要求。`;

function buildUserPrompt(q) {
  const parts = [];
  parts.push(`请为下面这条投资名言生成「4 段深度解读」，以 JSON 返回。`);
  parts.push(`\n【名言原文】\n${q.content_cn}`);
  if (q.content_en) parts.push(`\n【英文原文】\n${q.content_en}`);
  parts.push(`\n【作者】${q.master_name_cn || "佚名"}`);
  if (q.master_title) parts.push(`【作者头衔】${q.master_title}`);
  if (q.master_bio) parts.push(`【作者简介】${q.master_bio}`);
  parts.push(`
请返回如下 JSON（不要 Markdown 代码块、不要多余文字）：
{
  "core": "核心解读：用 60-120 字把这句话究竟在说什么讲清楚，结合作者的投资理念，说人话。",
  "practice": [
    "应用实操 1：给普通投资者的具体可执行动作（10-40 字）",
    "应用实操 2：...",
    "应用实操 3：...",
    "应用实操 4：..."
  ],
  "story": "生动案例：1 段真实历史故事或场景化情节，80-180 字，有画面感。",
  "master_view": "大师视角：这句话在该大师思想体系里的位置，40-80 字。"
}`);
  return parts.join("\n");
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function callDeepSeek(quote, attempt = 0) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);
  try {
    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(quote) },
        ],
        response_format: { type: "json_object" },
        temperature: 0.8,
        max_tokens: 1500,
      }),
      signal: controller.signal,
    });

    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get("retry-after") || "0", 10);
      const wait = retryAfter > 0 ? retryAfter * 1000 : Math.min(30_000, 1000 * 2 ** attempt);
      console.warn(`   ⏳ 429 限流，等待 ${Math.round(wait / 1000)}s 后重试 (attempt ${attempt + 1})`);
      await sleep(wait + Math.random() * 500);
      return callDeepSeek(quote, attempt + 1);
    }
    if (res.status >= 500 && attempt < 5) {
      await sleep(Math.min(30_000, 1000 * 2 ** attempt));
      return callDeepSeek(quote, attempt + 1);
    }
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`DeepSeek HTTP ${res.status}: ${text.slice(0, 200)}`);
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw new Error("DeepSeek 返回为空");
    return JSON.parse(content);
  } finally {
    clearTimeout(timeout);
  }
}

// ── 校验与规范化 ─────────────────────────────────────────────────────────────
function validateAndNormalize(obj) {
  if (!obj || typeof obj !== "object") return null;
  const core = typeof obj.core === "string" ? obj.core.trim() : "";
  let practice = Array.isArray(obj.practice)
    ? obj.practice.map((x) => String(x).trim()).filter(Boolean)
    : [];
  const story = typeof obj.story === "string" ? obj.story.trim() : "";
  let masterView = obj.master_view == null ? "" : String(obj.master_view).trim();

  if (practice.length > 4) practice = practice.slice(0, 4);
  if (practice.length !== 4) return null; // 必须恰好 4 条
  if (core.length < 30 || core.length > 280) return null;
  if (story.length < 50 || story.length > 340) return null;

  if (masterView.length === 0) masterView = null;
  else if (masterView.length > 160) masterView = masterView.slice(0, 160);

  return { core, practice, story, master_view: masterView };
}

// ── 写入 ──────────────────────────────────────────────────────────────────
const insertStmt = db.prepare(
  `INSERT OR IGNORE INTO quote_interpretations (quote_id, core, practice, story, master_view)
   VALUES (?, ?, ?, ?, ?)`
);

async function generateOne(quote) {
  let lastErr = null;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const raw = await callDeepSeek(quote, 0);
      const norm = validateAndNormalize(raw);
      if (!norm) {
        lastErr = "校验未通过（长度/条数不符），重试";
        continue;
      }
      const info = insertStmt.run(
        quote.id,
        norm.core,
        JSON.stringify(norm.practice),
        norm.story,
        norm.master_view
      );
      return { ok: info.changes > 0, skipped: info.changes === 0 };
    } catch (e) {
      lastErr = e.message;
      await sleep(500);
    }
  }
  return { ok: false, error: lastErr };
}

// ── 并发调度 ────────────────────────────────────────────────────────────────
async function runWithConcurrency(items, limit, worker) {
  let i = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      await worker(items[idx], idx);
    }
  });
  await Promise.all(runners);
}

// ── 主流程 ────────────────────────────────────────────────────────────────
async function main() {
  const missing = getMissingQuotes();
  console.log(`\n🔎 缺失解读的名言共 ${missing.length} 条`);

  if (DRY_RUN) {
    const byMaster = {};
    for (const q of missing) {
      const key = q.master_name_cn || "佚名";
      byMaster[key] = (byMaster[key] || 0) + 1;
    }
    console.log("── 按作者分布 ──");
    for (const [name, c] of Object.entries(byMaster).sort((a, b) => b[1] - a[1])) {
      console.log(`   ${name}: ${c}`);
    }
    console.log("\n── 样例（前 3 条）──");
    for (const q of missing.slice(0, 3)) {
      console.log(`   [${q.id}] ${q.master_name_cn}: ${q.content_cn.slice(0, 40)}...`);
    }
    console.log("\n✅ DRY_RUN 完成，未发请求、未写库。");
    return;
  }

  console.log(`🚀 开始生成（并发 ${CONCURRENCY}，模型 ${MODEL}）\n`);

  let inserted = 0;
  let failed = 0;
  let skipped = 0;
  let done = 0;
  const total = missing.length;
  const t0 = Date.now();

  await runWithConcurrency(missing, CONCURRENCY, async (quote) => {
    const r = await generateOne(quote);
    done++;
    if (r.ok) inserted++;
    else if (r.skipped) skipped++;
    else {
      failed++;
      console.warn(`   ⚠️ 失败 [${quote.id}] ${quote.master_name_cn}: ${r.error}`);
    }
    if (done % 20 === 0 || done === total) {
      const sec = ((Date.now() - t0) / 1000).toFixed(0);
      console.log(
        `   进度 ${done}/${total}  已写入 ${inserted}  失败 ${failed}  跳过 ${skipped}  (${sec}s)`
      );
    }
  });

  const remaining = db
    .prepare(
      `SELECT COUNT(*) AS c FROM quotes q
       WHERE NOT EXISTS (SELECT 1 FROM quote_interpretations i WHERE i.quote_id = q.id)`
    )
    .get().c;

  const totalInt = db.prepare(`SELECT COUNT(*) AS c FROM quote_interpretations`).get().c;

  console.log(`\n── 完成 ──`);
  console.log(`   本次新写入: ${inserted}`);
  console.log(`   失败(跳过): ${failed}`);
  console.log(`   已存在跳过: ${skipped}`);
  console.log(`   解读表总数: ${totalInt}`);
  console.log(`   仍未覆盖:   ${remaining}`);
}

main().then(() => db.close()).catch((e) => {
  console.error("❌ 运行出错:", e);
  db.close();
  process.exit(1);
});
