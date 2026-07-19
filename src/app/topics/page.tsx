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

  return (
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      {/* 页头背景柔光，提升层次 */}
      <div
        className="pointer-events-none absolute -top-10 -left-10 w-72 h-72 rounded-full"
        style={{ background: "var(--t-accent-bg)", filter: "blur(10px)", opacity: 0.6 }}
        aria-hidden
      />
      {/* 页头 —— 编辑式排版，克制大气 */}
      <header className="relative mb-12 md:mb-16">
        <div
          className="inline-flex items-center gap-2 text-xs font-medium tracking-widest uppercase mb-5"
          style={{ color: "var(--t-accent)" }}
        >
          <span className="inline-block w-8 h-px" style={{ background: "var(--t-accent)" }} />
          Topics
        </div>
        <h1
          className="text-4xl md:text-5xl font-bold tracking-tight mb-4"
          style={{ color: "var(--t-text)" }}
        >
          主题分类
        </h1>
        <p className="text-base md:text-lg max-w-2xl leading-relaxed" style={{ color: "var(--t-text-secondary)" }}>
          按投资思路分类探索大师智慧，找到你最需要的投资理念。
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

      {/* 主题卡片网格 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
        {tags.map((tag, i) => (
          <Link key={tag.id} href={`/topics/${tag.slug}`} className="group block h-full">
            <article
              className="topic-card relative h-full flex flex-col overflow-hidden border p-7"
              style={{
                background: "var(--t-bg-card)",
                borderColor: "var(--t-border)",
                borderRadius: "var(--t-radius)",
              }}
            >
              {/* 幽灵序号：大号衬线数字，编辑式装饰 */}
              <span
                className="topic-index pointer-events-none absolute top-3 right-5 font-serif leading-none select-none"
                style={{ color: "var(--t-accent)" }}
                aria-hidden
              >
                {String(i + 1).padStart(2, "0")}
              </span>

              {/* 图标徽章：渐变底色 + 柔光，悬停微旋放大 */}
              <div
                className="topic-badge flex items-center justify-center w-14 h-14 mb-6 text-2xl"
                style={{ borderRadius: "calc(var(--t-radius) + 0.4rem)" }}
              >
                {tagIcons[tag.name] || "💬"}
              </div>

              <h3 className="text-xl font-bold mb-2" style={{ color: "var(--t-text)" }}>
                {tag.name}
              </h3>
              <p
                className="text-sm leading-relaxed mb-7 flex-1"
                style={{ color: "var(--t-text-secondary)" }}
              >
                {tag.description}
              </p>

              {/* 底部：条数统计 + 探索 */}
              <div
                className="flex items-center justify-between pt-4 border-t"
                style={{ borderColor: "var(--t-border)" }}
              >
                <span className="inline-flex items-baseline gap-1">
                  <span className="text-lg font-bold" style={{ color: "var(--t-accent)" }}>
                    {tag.quote_count}
                  </span>
                  <span className="text-xs" style={{ color: "var(--t-text-muted)" }}>
                    条名言
                  </span>
                </span>
                <span
                  className="topic-explore inline-flex items-center gap-1 text-sm font-semibold"
                  style={{ color: "var(--t-accent)" }}
                >
                  探索
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </div>
  );
}
