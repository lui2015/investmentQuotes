"use client";

import { useCallback, useEffect, useState } from "react";

interface StatsSummary {
  total_calls: number;
  total_success: number;
  total_failed: number;
  total_items_processed: number;
  total_approved: number;
  total_rejected: number;
  today_calls: number;
  today_items: number;
  today_approved: number;
  today_rejected: number;
  avg_duration_ms: number | null;
  first_call_at: string | null;
  last_call_at: string | null;
}
interface EndpointStat {
  endpoint: string;
  method: string;
  calls: number;
  success: number;
  failed: number;
  avg_duration_ms: number | null;
}
interface DailyStat {
  date: string;
  calls: number;
  items: number;
  approved: number;
  rejected: number;
  success: number;
  failed: number;
}
interface RecentCall {
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
interface StatsData {
  summary: StatsSummary;
  endpoints: EndpointStat[];
  daily: DailyStat[];
  recent: RecentCall[];
  server_time: string;
}

export default function ApiDocsPage() {
  const [mode, setMode] = useState<"single" | "batch">("single");
  const [form, setForm] = useState({
    content_cn: "",
    content_en: "",
    master_name: "",
    source: "",
    source_year: "",
    tags: "",
    submitter: "",
    ie_core: "",
    ie_p1: "",
    ie_p2: "",
    ie_p3: "",
    ie_p4: "",
    ie_story: "",
    ie_master_view: "",
  });
  const [batchJson, setBatchJson] = useState(
    JSON.stringify(
      [
        {
          content_cn: "耐心是投资最稀缺的资产。",
          master_name: "沃伦·巴菲特",
          tags: ["长期主义"],
          interpretation: {
            core: "投资中**耐心**远比聪明重要——等待'好机会'的能力就是最大的护城河。",
            practice: [
              "为每笔投资设定'至少持有 5 年'的心智锚",
              "把市场波动视为'机会菜单'，不是'威胁'",
              "建立'无聊持仓'的舒适区——不被热点牵着走",
              "记录'等待期'里学到的——把它写成日记",
            ],
            story: "巴菲特持有可口可乐 30 多年，浮盈 100 倍+——他最经典的动作就是'什么都不做'。",
            master_view: "巴菲特：'**我们最喜欢的持有期是永远。**'",
          },
        },
        {
          content_cn: "反过来想，总是反过来想。",
          master_name: "查理·芒格",
          interpretation: {
            core: "芒格的核心方法论——研究'失败'比研究'成功'更有价值。",
            practice: [
              "列出每笔投资'亏钱的方式'，先解决它",
              "为每个决策写一份'反向清单'",
              "问自己：'一年后我会后悔吗？'",
              "复盘失败案例比复盘成功案例多 3 倍",
            ],
            story: "芒格在 Daily Journal 年会中反复强调——他读过的失败案例比成功案例多 100 倍。",
            master_view: "芒格：'**反过来想，总是反过来想。**'",
          },
        },
      ],
      null,
      2,
    ),
  );
  const [result, setResult] = useState<{ ok: boolean; message: string; data?: unknown } | null>(null);
  const [loading, setLoading] = useState(false);

  // ── 调用统计 ──
  const [stats, setStats] = useState<StatsData | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch("/investmentQuotes/api/stats?days=7&recent=15", { cache: "no-store" });
      const json = await res.json();
      if (json.code === 0 && json.data) setStats(json.data as StatsData);
    } catch {
      // 静默失败
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    // 用微任务包一层，避免在 effect body 里同步 setState
    const run = () => {
      void fetchStats();
    };
    const initTimer = setTimeout(run, 0);
    const interval = setInterval(run, 30000);
    return () => {
      clearTimeout(initTimer);
      clearInterval(interval);
    };
  }, [fetchStats]);

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const payload: Record<string, unknown> = {
        content_cn: form.content_cn.trim(),
        master_name: form.master_name.trim(),
        interpretation: {
          core: form.ie_core.trim(),
          practice: [form.ie_p1.trim(), form.ie_p2.trim(), form.ie_p3.trim(), form.ie_p4.trim()],
          story: form.ie_story.trim(),
          master_view: form.ie_master_view.trim() || null,
        },
      };
      if (form.content_en.trim()) payload.content_en = form.content_en.trim();
      if (form.source.trim()) payload.source = form.source.trim();
      if (form.source_year.trim()) payload.source_year = parseInt(form.source_year, 10);
      if (form.tags.trim())
        payload.tags = form.tags.split(",").map((t) => t.trim()).filter(Boolean);
      if (form.submitter.trim()) payload.submitter = form.submitter.trim();

      const res = await fetch("/investmentQuotes/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setResult({
        ok: res.ok,
        message: data.message || (res.ok ? "提交成功" : "提交失败"),
        data: data.data,
      });
      if (res.ok) {
        setForm({
          content_cn: "", content_en: "", master_name: "", source: "", source_year: "", tags: "", submitter: "",
          ie_core: "", ie_p1: "", ie_p2: "", ie_p3: "", ie_p4: "", ie_story: "", ie_master_view: "",
        });
      }
      fetchStats();
    } catch (err) {
      setResult({ ok: false, message: (err as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const parsed = JSON.parse(batchJson);
      const res = await fetch("/investmentQuotes/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      const data = await res.json();
      setResult({
        ok: res.ok,
        message: data.message || (res.ok ? "批量提交成功" : "批量提交失败"),
        data: data.data,
      });
      fetchStats();
    } catch (err) {
      setResult({ ok: false, message: "JSON 解析错误：" + (err as Error).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: "var(--t-text)" }}>
          开放 API — 贡献投资名言
        </h1>
        <p className="text-lg" style={{ color: "var(--t-text-secondary)" }}>
          即时入库、无速率限制、支持批量。提交成功后前台立即可见。
        </p>
      </div>

      {/* ── 统计面板 ── */}
      <StatsPanel stats={stats} loading={statsLoading} onRefresh={fetchStats} />

      {/* Tab 切换 */}
      <div className="mb-6 flex gap-2">
        <TabBtn active={mode === "single"} onClick={() => setMode("single")}>
          单条提交
        </TabBtn>
        <TabBtn active={mode === "batch"} onClick={() => setMode("batch")}>
          批量提交 (JSON)
        </TabBtn>
      </div>

      {/* 表单区 */}
      <section
        className="border p-8 mb-12"
        style={{ background: "var(--t-bg-card)", borderColor: "var(--t-border)", borderRadius: "var(--t-radius)" }}
      >
        {mode === "single" ? (
          <form onSubmit={handleSingleSubmit} className="space-y-5">
            <Field label="名言内容（中文）*" hint="4~500 字符">
              <textarea
                required
                value={form.content_cn}
                onChange={(e) => setForm({ ...form, content_cn: e.target.value })}
                rows={3}
                placeholder="例：投资的第一条规则是不要亏钱。"
                className="w-full px-4 py-3 border focus:outline-none focus:ring-2"
                style={inputStyle}
              />
            </Field>

            <Field label="名言原文（英文，可选）">
              <textarea
                value={form.content_en}
                onChange={(e) => setForm({ ...form, content_en: e.target.value })}
                rows={2}
                placeholder="Rule No.1: Never lose money."
                className="w-full px-4 py-3 border focus:outline-none focus:ring-2"
                style={inputStyle}
              />
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="作者 / 大师 *" hint="库内没有会自动创建">
                <input
                  required
                  value={form.master_name}
                  onChange={(e) => setForm({ ...form, master_name: e.target.value })}
                  placeholder="沃伦·巴菲特"
                  className="w-full px-4 py-3 border focus:outline-none focus:ring-2"
                  style={inputStyle}
                />
              </Field>
              <Field label="标签（可选）" hint="用逗号分隔">
                <input
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="价值投资, 风险管理"
                  className="w-full px-4 py-3 border focus:outline-none focus:ring-2"
                  style={inputStyle}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <Field label="出处（可选）">
                <input
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                  placeholder="致股东的信"
                  className="w-full px-4 py-3 border focus:outline-none focus:ring-2"
                  style={inputStyle}
                />
              </Field>
              <Field label="年份（可选）">
                <input
                  type="number"
                  value={form.source_year}
                  onChange={(e) => setForm({ ...form, source_year: e.target.value })}
                  placeholder="2008"
                  className="w-full px-4 py-3 border focus:outline-none focus:ring-2"
                  style={inputStyle}
                />
              </Field>
              <Field label="你的昵称（可选）">
                <input
                  value={form.submitter}
                  onChange={(e) => setForm({ ...form, submitter: e.target.value })}
                  placeholder="匿名"
                  className="w-full px-4 py-3 border focus:outline-none focus:ring-2"
                  style={inputStyle}
                />
              </Field>
            </div>

            {/* 4 块深度解读（必填） */}
            <div
              className="border p-5 mt-2"
              style={{
                background: "var(--t-bg-input)",
                borderColor: "var(--t-accent)",
                borderRadius: "var(--t-radius)",
              }}
            >
              <div className="mb-3 text-sm font-semibold" style={{ color: "var(--t-accent)" }}>
                4 块深度解读（必填）
              </div>
              <div className="space-y-4">
                <Field label="① 核心解读 *" hint="3-5 句人话版，200-800 字最佳">
                  <textarea
                    required
                    value={form.ie_core}
                    onChange={(e) => setForm({ ...form, ie_core: e.target.value })}
                    rows={3}
                    placeholder="例：**价格是你付出的，价值是你得到的**——巴菲特对'价格 vs 价值'的核心区分。**多数人只懂'价格'——不懂'价值'。**"
                    className="w-full px-4 py-3 border focus:outline-none focus:ring-2"
                    style={inputStyle}
                  />
                </Field>

                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--t-text)" }}>
                    ② 应用实操 *（恰好 4 条行动清单）
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {([
                      ["ie_p1", "行动 1", "例：买入前先问'5 年后它能赚多少？'"],
                      ["ie_p2", "行动 2", "例：用'内在价值'做决策锚——不是'价格'"],
                      ["ie_p3", "行动 3", "例：把'看不懂的标的'列入'不买清单'"],
                      ["ie_p4", "行动 4", "例：建立交易日志记录每笔决策的逻辑"],
                    ] as const).map(([k, label, ph], i) => (
                      <input
                        key={k}
                        required
                        value={(form as unknown as Record<string, string>)[k]}
                        onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                        placeholder={`${label} — ${ph}`}
                        className="w-full px-3 py-2 border text-sm focus:outline-none focus:ring-2"
                        style={inputStyle}
                      />
                    ))}
                  </div>
                </div>

                <Field label="③ 生动案例 *" hint="真实故事/场景化情节，80-300 字最佳">
                  <textarea
                    required
                    value={form.ie_story}
                    onChange={(e) => setForm({ ...form, ie_story: e.target.value })}
                    rows={3}
                    placeholder="例：巴菲特 1988 年开始买入可口可乐——当时 PE 15 倍——市场嘲笑他'追高'——持有到 2010 年回报 12 倍——成为他最经典的'长期持有'案例。"
                    className="w-full px-4 py-3 border focus:outline-none focus:ring-2"
                    style={inputStyle}
                  />
                </Field>

                <Field label="④ 大师视角（可选）" hint="该名言在大师思想体系中的位置 + 引用">
                  <textarea
                    value={form.ie_master_view}
                    onChange={(e) => setForm({ ...form, ie_master_view: e.target.value })}
                    rows={2}
                    placeholder="例：巴菲特说：'**我们最喜欢的持有期是永远。**' 芒格说：'**好机会是稀缺的——需要耐心等待。**'"
                    className="w-full px-4 py-3 border focus:outline-none focus:ring-2"
                    style={inputStyle}
                  />
                </Field>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 font-bold transition-all hover:scale-105 disabled:opacity-60"
              style={{ background: "var(--t-accent)", color: "var(--t-bg)", borderRadius: "var(--t-radius)" }}
            >
              {loading ? "提交中…" : "立即提交入库"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleBatchSubmit} className="space-y-5">
            <Field label="批量数据（JSON 数组或 { items: [] } 对象）" hint="最多 200 条">
              <textarea
                required
                value={batchJson}
                onChange={(e) => setBatchJson(e.target.value)}
                rows={14}
                spellCheck={false}
                className="w-full px-4 py-3 border font-mono text-xs focus:outline-none focus:ring-2"
                style={inputStyle}
              />
            </Field>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 font-bold transition-all hover:scale-105 disabled:opacity-60"
              style={{ background: "var(--t-accent)", color: "var(--t-bg)", borderRadius: "var(--t-radius)" }}
            >
              {loading ? "批量导入中…" : "批量导入入库"}
            </button>
          </form>
        )}

        {result && (
          <div
            className="mt-6 p-4 border"
            style={{
              background: result.ok ? "var(--t-accent-bg)" : "rgba(239,68,68,0.1)",
              borderColor: result.ok ? "var(--t-accent)" : "#ef4444",
              color: "var(--t-text)",
              borderRadius: "var(--t-radius)",
            }}
          >
            <div className="font-semibold mb-2">
              {result.ok ? "✅ " : "⚠️ "}
              {result.message}
            </div>
            {!!result.data && (
              <pre
                className="text-xs overflow-auto mt-2 max-h-96"
                style={{ color: "var(--t-text-secondary)" }}
              >
                {JSON.stringify(result.data, null, 2)}
              </pre>
            )}
          </div>
        )}
      </section>

      {/* API 文档 */}
      <section
        className="border p-8 mb-8"
        style={{ background: "var(--t-bg-card)", borderColor: "var(--t-border)", borderRadius: "var(--t-radius)" }}
      >
        <h2 className="text-xl font-bold mb-6" style={{ color: "var(--t-text)" }}>
          API 文档
        </h2>

        <ApiEndpoint
          method="POST"
          path="/api/submit"
          desc="提交名言（对外开放，无速率限制，即时入库并前台可见）"
        >
          <SubTitle>单条提交（4 块解读必填）</SubTitle>
          <CodeBlock>{`{
  "content_cn": "投资的第一条规则是不要亏钱。",   // 必填，4~500 字
  "master_name": "沃伦·巴菲特",                  // 必填，库中不存在会自动创建
  "content_en": "Rule No.1: Never lose money.", // 可选
  "source": "致股东的信",                         // 可选
  "source_year": 2008,                            // 可选
  "tags": ["风险管理", "价值投资"],               // 可选，最多 10 个
  "submitter": "投资爱好者",                      // 可选

  "interpretation": {                             // 必填
    "core": "**'不亏钱'是数学上必然盈利的策略**——…",  // 必填，10~2000 字
    "practice": [                                     // 必填，恰好 4 条
      "把'不亏钱'作为第一原则",
      "用'安全边际'为错误留出缓冲",
      "评估最坏情况下的下行空间",
      "对'高赔率'诱惑保持警惕"
    ],
    "story": "巴菲特 50 多年最大单年回撤 -51%（2008）…",  // 必填，20~3000 字
    "master_view": "巴菲特：'**投资的第一条规则是不要亏钱。**'"  // 可空
  }
}`}</CodeBlock>

          <SubTitle>批量提交（形式一：JSON 数组）</SubTitle>
          <CodeBlock>{`[
  {
    "content_cn": "耐心是投资最稀缺的资产。",
    "master_name": "沃伦·巴菲特",
    "interpretation": { "core": "…", "practice": ["…","…","…","…"], "story": "…", "master_view": null }
  },
  {
    "content_cn": "反过来想，总是反过来想。",
    "master_name": "查理·芒格",
    "interpretation": { "core": "…", "practice": ["…","…","…","…"], "story": "…", "master_view": null }
  }
]`}</CodeBlock>

          <SubTitle>批量提交（形式二：对象包装）</SubTitle>
          <CodeBlock>{`{
  "items": [
    { "content_cn": "…", "master_name": "…" },
    { "content_cn": "…", "master_name": "…" }
  ]
}`}</CodeBlock>

          <SubTitle>响应</SubTitle>
          <CodeBlock>{`// 单条成功 201
{
  "code": 0,
  "message": "名言已成功入库，前台立即可见",
  "data": {
    "status": "approved",
    "submission_id": "sub-xxx",
    "quote_id": "uq-xxx",
    "master_id": "m-xxx",
    "similarity_score": 0.12,
    "reason": "已入库（与已有名言最高相似度 12.0%）"
  }
}

// 批量结果 201
{
  "code": 0,
  "message": "批量处理完成：新增 3 条，去重 1 条，失败 0 条",
  "data": {
    "total": 4, "approved": 3, "rejected": 1, "failed": 0,
    "results": [ ... ]
  }
}`}</CodeBlock>
        </ApiEndpoint>

        <ApiEndpoint
          method="GET"
          path="/api/submit?status=approved&limit=20&offset=0"
          desc="分页查询提交历史（可选按状态过滤）"
        >
          <p className="text-sm" style={{ color: "var(--t-text-secondary)" }}>
            <b>status</b>：<code>approved</code> / <code>rejected</code> / <code>pending</code>（可选）<br />
            <b>limit</b>：1~100，默认 20 &nbsp;·&nbsp; <b>offset</b>：默认 0
          </p>
        </ApiEndpoint>

        <ApiEndpoint
          method="GET"
          path="/api/submit/{id}"
          desc="查询单条提交详情及入库结果"
        />

        <ApiEndpoint
          method="GET"
          path="/api/stats?days=7&recent=20"
          desc="查询接口调用统计（总量 / 今日 / 端点 / 每日趋势 / 最近调用）"
        >
          <CodeBlock>{`{
  "code": 0,
  "data": {
    "summary": {
      "total_calls": 128, "total_success": 120, "total_failed": 8,
      "total_items_processed": 542, "total_approved": 480, "total_rejected": 62,
      "today_calls": 15, "today_items": 42,
      "avg_duration_ms": 23,
      "first_call_at": "...", "last_call_at": "..."
    },
    "endpoints": [
      { "endpoint": "/api/submit", "method": "POST", "calls": 100, ... }
    ],
    "daily": [
      { "date": "2026-06-25", "calls": 12, "items": 30, "approved": 25, "rejected": 5, ... }
    ],
    "recent": [
      { "id": 128, "endpoint": "/api/submit", "method": "POST", "status_code": 201, ... }
    ]
  }
}`}</CodeBlock>
        </ApiEndpoint>
      </section>

      {/* 去重算法说明 */}
      <section
        className="border p-8"
        style={{ background: "var(--t-bg-card)", borderColor: "var(--t-border)", borderRadius: "var(--t-radius)" }}
      >
        <h2 className="text-xl font-bold mb-4" style={{ color: "var(--t-text)" }}>
          即时处理流程
        </h2>
        <div className="space-y-3 text-sm" style={{ color: "var(--t-text-secondary)" }}>
          <p>
            1. <b>字段校验</b>：内容 4~500 字，作者不超过 50 字，年份合法，<b>4 块解读必填</b>（core 10~2000 字 / practice 恰好 4 条 / story 20~3000 字 / master_view 可空）
          </p>
          <p>
            2. <b>大师匹配</b>：模糊匹配已有大师；库中不存在则自动创建（分类=user-submitted）
          </p>
          <p>
            3. <b>相似度计算</b>：Bigram Jaccard + 同大师加权 + 长度差惩罚 + 包含关系加分
          </p>
          <p>
            4. <b>去重决策</b>：
            <br />
            &nbsp;&nbsp;• 相似度 <b>≥ 85%</b> → 拒绝入库（rejected），返回匹配的已有名言 ID
            <br />
            &nbsp;&nbsp;• 相似度 <b>&lt; 85%</b> → 立即入库为正式名言（approved）
          </p>
          <p>
            5. <b>批量事务</b>：单次批量所有操作在同一数据库事务内，出现严重错误整体回滚
          </p>
          <p>
            6. <b>即时生效</b>：入库后前台名言库/大师页立即可见（无需等待）
          </p>
          <p>
            7. <b>调用统计</b>：每次调用（含失败）都会异步记录到 <code>api_call_log</code>，可通过 <code>/api/stats</code> 或本页顶部面板查询
          </p>
        </div>
      </section>
    </div>
  );
}

// ═══════════ 统计面板 ═══════════
function StatsPanel({
  stats,
  loading,
  onRefresh,
}: {
  stats: StatsData | null;
  loading: boolean;
  onRefresh: () => void;
}) {
  const s = stats?.summary;
  const successRate =
    s && s.total_calls > 0 ? ((s.total_success / s.total_calls) * 100).toFixed(1) : "—";
  const rejectRate =
    s && s.total_items_processed > 0
      ? ((s.total_rejected / s.total_items_processed) * 100).toFixed(1)
      : "—";

  const maxDaily = stats?.daily.length
    ? Math.max(1, ...stats.daily.map((d) => d.calls))
    : 1;

  return (
    <section
      className="border p-6 mb-8"
      style={{
        background: "var(--t-bg-card)",
        borderColor: "var(--t-border)",
        borderRadius: "var(--t-radius)",
      }}
    >
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold" style={{ color: "var(--t-text)" }}>
            接口调用统计
          </h2>
          <span
            className="text-xs px-2 py-0.5"
            style={{
              background: "var(--t-bg-tag)",
              color: "var(--t-text-secondary)",
              borderRadius: "999px",
            }}
          >
            {loading ? "刷新中…" : "每 30 秒自动刷新"}
          </span>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="text-xs px-3 py-1 transition-opacity hover:opacity-80 disabled:opacity-60"
          style={{
            background: "var(--t-bg-tag)",
            color: "var(--t-text)",
            border: "1px solid var(--t-border)",
            borderRadius: "var(--t-radius)",
          }}
        >
          手动刷新
        </button>
      </div>

      {!stats ? (
        <div className="text-sm" style={{ color: "var(--t-text-muted)" }}>
          正在加载统计数据…
        </div>
      ) : (
        <>
          {/* 顶部核心指标 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <MetricCard
              label="累计调用"
              value={s!.total_calls.toLocaleString()}
              sub={`成功率 ${successRate}%`}
              accent
            />
            <MetricCard
              label="今日调用"
              value={s!.today_calls.toLocaleString()}
              sub={`今日入库 ${s!.today_approved} / 去重 ${s!.today_rejected}`}
            />
            <MetricCard
              label="累计入库 / 去重"
              value={`${s!.total_approved.toLocaleString()} / ${s!.total_rejected.toLocaleString()}`}
              sub={`去重率 ${rejectRate}%`}
            />
            <MetricCard
              label="平均响应"
              value={s!.avg_duration_ms != null ? `${s!.avg_duration_ms} ms` : "—"}
              sub={
                s!.last_call_at
                  ? `最近：${new Date(s!.last_call_at + "Z").toLocaleString("zh-CN", {
                      hour12: false,
                    })}`
                  : "尚未有调用"
              }
            />
          </div>

          {/* 每日趋势迷你柱状图 */}
          <div className="mb-6">
            <div
              className="text-xs mb-2 font-semibold"
              style={{ color: "var(--t-text-secondary)" }}
            >
              近 {stats.daily.length} 天每日调用量
            </div>
            <div className="flex items-end gap-1.5 h-24">
              {stats.daily.map((d) => {
                const h = (d.calls / maxDaily) * 100;
                return (
                  <div
                    key={d.date}
                    className="flex-1 flex flex-col items-center gap-1 group relative"
                    title={`${d.date}\n调用 ${d.calls} 次 · 名言 ${d.items} 条\n入库 ${d.approved} · 去重 ${d.rejected}`}
                  >
                    <div
                      className="w-full transition-all"
                      style={{
                        height: `${Math.max(4, h)}%`,
                        background:
                          d.calls > 0 ? "var(--t-accent)" : "var(--t-border)",
                        borderRadius: "2px 2px 0 0",
                        opacity: d.calls > 0 ? 0.85 : 0.35,
                      }}
                    />
                    <div
                      className="text-[10px] leading-none"
                      style={{ color: "var(--t-text-muted)" }}
                    >
                      {d.date.slice(5)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 端点分组 + 最近调用 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 端点分组 */}
            <div>
              <div
                className="text-xs mb-2 font-semibold"
                style={{ color: "var(--t-text-secondary)" }}
              >
                各端点调用分布
              </div>
              <div className="space-y-1.5">
                {stats.endpoints.length === 0 && (
                  <div className="text-sm" style={{ color: "var(--t-text-muted)" }}>
                    暂无调用记录
                  </div>
                )}
                {stats.endpoints.map((ep) => (
                  <div
                    key={ep.method + ep.endpoint}
                    className="flex items-center justify-between gap-2 py-2 px-3 text-xs"
                    style={{
                      background: "var(--t-bg-input)",
                      border: "1px solid var(--t-border)",
                      borderRadius: "var(--t-radius)",
                      color: "var(--t-text)",
                    }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <MethodBadge method={ep.method} />
                      <code className="truncate" style={{ color: "var(--t-text)" }}>
                        {ep.endpoint}
                      </code>
                    </div>
                    <div
                      className="flex items-center gap-3 text-xs whitespace-nowrap"
                      style={{ color: "var(--t-text-secondary)" }}
                    >
                      <span>
                        <b style={{ color: "var(--t-accent)" }}>{ep.calls}</b> 次
                      </span>
                      {ep.failed > 0 && (
                        <span style={{ color: "#ef4444" }}>失败 {ep.failed}</span>
                      )}
                      {ep.avg_duration_ms != null && <span>{ep.avg_duration_ms}ms</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 最近调用 */}
            <div>
              <div
                className="text-xs mb-2 font-semibold"
                style={{ color: "var(--t-text-secondary)" }}
              >
                最近调用
              </div>
              <div
                className="space-y-1 max-h-64 overflow-y-auto pr-1"
                style={{ color: "var(--t-text)" }}
              >
                {stats.recent.length === 0 && (
                  <div className="text-sm" style={{ color: "var(--t-text-muted)" }}>
                    暂无调用记录
                  </div>
                )}
                {stats.recent.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center gap-2 py-1.5 px-2 text-[11px]"
                    style={{
                      background: "var(--t-bg-input)",
                      border: "1px solid var(--t-border)",
                      borderRadius: "var(--t-radius)",
                    }}
                  >
                    <span
                      className="w-11 text-center font-mono"
                      style={{
                        color: r.is_success ? "var(--t-accent)" : "#ef4444",
                      }}
                    >
                      {r.status_code}
                    </span>
                    <MethodBadge method={r.method} />
                    <code className="truncate flex-1" style={{ color: "var(--t-text)" }}>
                      {r.endpoint}
                    </code>
                    {r.is_batch === 1 && (
                      <span
                        className="px-1.5 py-0.5 text-[10px]"
                        style={{
                          background: "var(--t-bg-tag)",
                          color: "var(--t-text-secondary)",
                          borderRadius: "3px",
                        }}
                      >
                        批量×{r.item_count}
                      </span>
                    )}
                    {r.duration_ms != null && (
                      <span
                        className="whitespace-nowrap"
                        style={{ color: "var(--t-text-muted)" }}
                      >
                        {r.duration_ms}ms
                      </span>
                    )}
                    <span
                      className="whitespace-nowrap"
                      style={{ color: "var(--t-text-muted)" }}
                    >
                      {new Date(r.called_at + "Z").toLocaleTimeString("zh-CN", {
                        hour12: false,
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function MetricCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className="p-4"
      style={{
        background: accent ? "var(--t-accent-bg)" : "var(--t-bg-input)",
        border: `1px solid ${accent ? "var(--t-accent)" : "var(--t-border)"}`,
        borderRadius: "var(--t-radius)",
      }}
    >
      <div
        className="text-[11px] uppercase tracking-wider mb-1"
        style={{ color: "var(--t-text-muted)" }}
      >
        {label}
      </div>
      <div
        className="text-2xl font-bold"
        style={{ color: accent ? "var(--t-accent)" : "var(--t-text)" }}
      >
        {value}
      </div>
      {sub && (
        <div className="text-[11px] mt-1" style={{ color: "var(--t-text-secondary)" }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = { GET: "#0ea5e9", POST: "#10b981" };
  return (
    <span
      className="px-1.5 py-0.5 text-[10px] font-bold text-white"
      style={{ background: colors[method] || "var(--t-accent)", borderRadius: "3px" }}
    >
      {method}
    </span>
  );
}

const inputStyle: React.CSSProperties = {
  background: "var(--t-bg-input)",
  borderColor: "var(--t-border)",
  color: "var(--t-text)",
  borderRadius: "var(--t-radius)",
};

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-5 py-2 text-sm font-medium transition-all"
      style={{
        background: active ? "var(--t-accent)" : "var(--t-bg-tag)",
        color: active ? "var(--t-bg)" : "var(--t-text-secondary)",
        borderRadius: "var(--t-radius)",
      }}
    >
      {children}
    </button>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--t-text)" }}>
        {label}
        {hint && (
          <span className="ml-2 text-xs font-normal" style={{ color: "var(--t-text-muted)" }}>
            {hint}
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

function ApiEndpoint({
  method,
  path,
  desc,
  children,
}: {
  method: string;
  path: string;
  desc: string;
  children?: React.ReactNode;
}) {
  const colors: Record<string, string> = { GET: "#0ea5e9", POST: "#10b981" };
  return (
    <div className="mb-8 pb-8 border-b last:border-b-0 last:mb-0 last:pb-0" style={{ borderColor: "var(--t-border)" }}>
      <div className="flex items-center gap-3 mb-2 flex-wrap">
        <span className="px-2 py-0.5 text-xs font-bold text-white rounded" style={{ background: colors[method] || "var(--t-accent)" }}>
          {method}
        </span>
        <code className="text-sm px-2 py-0.5" style={{ background: "var(--t-bg-tag)", color: "var(--t-text)", borderRadius: "0.25rem" }}>
          {path}
        </code>
      </div>
      <p className="text-sm mb-4" style={{ color: "var(--t-text-secondary)" }}>
        {desc}
      </p>
      {children}
    </div>
  );
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-sm font-semibold mt-4 mb-2" style={{ color: "var(--t-text)" }}>
      {children}
    </h4>
  );
}

function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <pre
      className="text-xs p-3 overflow-x-auto"
      style={{
        background: "var(--t-bg-input)",
        color: "var(--t-text)",
        borderRadius: "var(--t-radius)",
        border: "1px solid var(--t-border)",
      }}
    >
      {children}
    </pre>
  );
}
