import Link from "next/link";
import { getAllTags } from "@/lib/queries";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "主题分类 — 投资名言",
  description: "按投资思路分类浏览名言：价值投资、长期主义、风险管理、逆向思维等",
};

export const dynamic = "force-dynamic";

const tagIcons: Record<string, string> = {
  "价值投资": "💰", "长期主义": "⏳", "风险管理": "🛡️", "逆向思维": "🔄",
  "能力圈": "🎯", "市场认知": "📊", "心态修炼": "🧘", "学习成长": "📚",
  "企业分析": "🏢", "人生哲学": "🌟",
};

export default function TopicsPage() {
  const tags = getAllTags();
  const totalQuotes = tags.reduce((sum, t) => sum + (t.quote_count || 0), 0);
  const [featured, ...rest] = tags;

  return (
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      {/* 页头背景柔光 */}
      <div
        className="pointer-events-none absolute -top-10 -left-10 w-72 h-72 rounded-full"
        style={{ background: "var(--t-accent-bg)", filter: "blur(10px)", opacity: 0.6 }}
        aria-hidden
      />

      {/* 页头 */}
      <header className="relative mb-10 md:mb-14">
        <div
          className="inline-flex items-center gap-2 text-xs font-medium tracking-widest uppercase mb-4"
          style={{ color: "var(--t-accent)" }}
        >
          <span className="inline-block w-8 h-px" style={{ background: "var(--t-accent)" }} />
          主题分类 · Topics
        </div>
        <h1
          className="text-3xl md:text-5xl font-bold tracking-tight mb-4"
          style={{ color: "var(--t-text)" }}
        >
          按主题，读懂大师的投资思想
        </h1>
        <p className="text-base md:text-lg max-w-2xl leading-relaxed" style={{ color: "var(--t-text-secondary)" }}>
          把零散的金句，按投资思路重新归类。挑一个你最想修炼的方向，开始阅读。
        </p>
        <div
          className="mt-6 flex items-center gap-2 text-sm"
          style={{ color: "var(--t-text-muted)" }}
        >
          <span style={{ color: "var(--t-text-secondary)" }}>
            <span className="font-bold" style={{ color: "var(--t-text)" }}>{tags.length}</span> 个主题
          </span>
          <span className="opacity-40">·</span>
          <span style={{ color: "var(--t-text-secondary)" }}>
            <span className="font-bold" style={{ color: "var(--t-text)" }}>{totalQuotes}</span> 条名言
          </span>
        </div>
      </header>

      {/* 精选头条：名言最多的主题 */}
      {featured && (
        <Link href={`/topics/${featured.slug}`} className="topic-feature group block mb-8">
          <article
            className="relative flex flex-col sm:flex-row sm:items-center gap-6 p-7 md:p-9 border"
            style={{
              background: "var(--t-bg-card)",
              borderColor: "var(--t-border)",
              borderRadius: "var(--t-radius)",
            }}
          >
            <div className="feature-glow" aria-hidden />
            <div
              className="topic-badge flex items-center justify-center w-20 h-20 text-4xl rounded-3xl shrink-0"
              aria-hidden
            >
              {tagIcons[featured.name] || "💬"}
            </div>
            <div className="relative flex-1 min-w-0">
              <div
                className="text-xs font-semibold tracking-widest uppercase mb-2"
                style={{ color: "var(--t-accent)" }}
              >
                热门主题
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: "var(--t-text)" }}>
                {featured.name}
              </h2>
              <p
                className="text-sm md:text-base leading-relaxed mb-3 line-clamp-2"
                style={{ color: "var(--t-text-secondary)" }}
              >
                {featured.description}
              </p>
              <span className="inline-flex items-baseline gap-1 text-sm" style={{ color: "var(--t-text-muted)" }}>
                <span className="text-base font-bold" style={{ color: "var(--t-accent)" }}>
                  {featured.quote_count}
                </span>
                条名言
              </span>
            </div>
            <span
              className="topic-arrow inline-flex items-center gap-1.5 text-sm font-semibold shrink-0"
              style={{ color: "var(--t-accent)" }}
            >
              进入主题
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </article>
        </Link>
      )}

      {/* 其余主题网格 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {rest.map((tag) => (
          <Link key={tag.id} href={`/topics/${tag.slug}`} className="group block h-full">
            <article
              className="topic-card relative h-full flex flex-col p-6 border"
              style={{
                background: "var(--t-bg-card)",
                borderColor: "var(--t-border)",
                borderRadius: "var(--t-radius)",
              }}
            >
              <div className="flex items-center gap-4 mb-4">
                <div
                  className="topic-badge flex items-center justify-center w-12 h-12 text-2xl rounded-2xl shrink-0"
                  aria-hidden
                >
                  {tagIcons[tag.name] || "💬"}
                </div>
                <h3 className="text-lg font-bold truncate" style={{ color: "var(--t-text)" }}>
                  {tag.name}
                </h3>
              </div>
              <p
                className="text-sm leading-relaxed mb-5 flex-1 line-clamp-2"
                style={{ color: "var(--t-text-secondary)" }}
              >
                {tag.description}
              </p>
              <div
                className="flex items-center justify-between pt-4 border-t"
                style={{ borderColor: "var(--t-border)" }}
              >
                <span className="inline-flex items-baseline gap-1 text-xs" style={{ color: "var(--t-text-muted)" }}>
                  <span className="text-base font-bold" style={{ color: "var(--t-accent)" }}>
                    {tag.quote_count}
                  </span>
                  条名言
                </span>
                <span className="topic-arrow text-lg" style={{ color: "var(--t-accent)" }} aria-hidden>
                  →
                </span>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </div>
  );
}
