import { notFound } from "next/navigation";
import Link from "next/link";
import { getTagBySlug, getQuotesByTag, getAllTags } from "@/lib/queries";
import { QuoteCard } from "@/components/QuoteCard";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
type Params = Promise<{ slug: string }>;

const tagIcons: Record<string, string> = {
  "价值投资": "💰", "长期主义": "⏳", "风险管理": "🛡️", "逆向思维": "🔄",
  "能力圈": "🎯", "市场认知": "📊", "心态修炼": "🧘", "学习成长": "📚",
  "企业分析": "🏢", "人生哲学": "🌟",
};

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const tag = getTagBySlug(slug);
  if (!tag) return { title: "未找到 — 投资名言" };
  return { title: `${tag.name} — 投资名言`, description: tag.description };
}

export default async function TopicDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const tag = getTagBySlug(slug);
  if (!tag) notFound();
  const quotes = getQuotesByTag(tag.id);
  const allTags = getAllTags();
  const icon = tagIcons[tag.name] || "💬";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <nav className="mb-8 text-sm" style={{ color: "var(--t-text-muted)" }}>
        <Link href="/">首页</Link><span className="mx-2">/</span>
        <Link href="/topics">主题分类</Link><span className="mx-2">/</span>
        <span style={{ color: "var(--t-text)" }}>{tag.name}</span>
      </nav>

      {/* Hero：渐变徽章 + 背景柔光 + 主题筛选 */}
      <header
        className="topic-hero relative overflow-hidden border p-8 md:p-10 mb-10"
        style={{
          background: "var(--t-bg-card)",
          borderColor: "var(--t-border)",
          borderRadius: "var(--t-radius)",
        }}
      >
        <div
          className="pointer-events-none absolute -top-16 -right-10 w-56 h-56 rounded-full"
          style={{ background: "var(--t-accent-bg)", filter: "blur(8px)" }}
          aria-hidden
        />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="topic-hero-badge flex items-center justify-center w-16 h-16 text-3xl rounded-2xl shrink-0">
            {icon}
          </div>
          <div className="min-w-0">
            <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: "var(--t-text)" }}>
              {tag.name}
            </h1>
            <p className="text-base md:text-lg leading-relaxed" style={{ color: "var(--t-text-secondary)" }}>
              {tag.description}
            </p>
            <p className="mt-2 text-sm" style={{ color: "var(--t-text-muted)" }}>
              共 <span className="font-bold" style={{ color: "var(--t-accent)" }}>{quotes.length}</span> 条名言
            </p>
          </div>
        </div>

        <div
          className="relative mt-7 pt-6 border-t flex flex-wrap gap-2"
          style={{ borderColor: "var(--t-border)" }}
        >
          {allTags.map((t) => (
            <Link
              key={t.id}
              href={`/topics/${t.slug}`}
              className="tag-pill transition-colors"
              style={{
                background: t.id === tag.id ? "var(--t-accent)" : "var(--t-bg-tag)",
                color: t.id === tag.id ? "var(--t-bg)" : "var(--t-tag-text)",
              }}
            >
              {t.name}
            </Link>
          ))}
        </div>
      </header>

      {quotes.length === 0 ? (
        <div className="py-20 text-center" style={{ color: "var(--t-text-muted)" }}>
          该主题下还没有名言。
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quotes.map((quote) => (
            <QuoteCard key={quote.id} quote={quote} />
          ))}
        </div>
      )}
    </div>
  );
}
