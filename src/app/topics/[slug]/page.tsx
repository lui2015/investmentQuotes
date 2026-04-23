import { notFound } from "next/navigation";
import Link from "next/link";
import { getTagBySlug, getQuotesByTag, getAllTags } from "@/lib/queries";
import { QuoteCard } from "@/components/QuoteCard";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
type Params = Promise<{ slug: string }>;

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <nav className="mb-8 text-sm" style={{ color: "var(--t-text-muted)" }}>
        <Link href="/">首页</Link><span className="mx-2">/</span>
        <Link href="/topics">主题分类</Link><span className="mx-2">/</span>
        <span style={{ color: "var(--t-text)" }}>{tag.name}</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: "var(--t-text)" }}>{tag.name}</h1>
        <p className="text-lg mb-6" style={{ color: "var(--t-text-secondary)" }}>
          {tag.description} · 共 {quotes.length} 条名言
        </p>
        <div className="flex flex-wrap gap-2">
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quotes.map((quote) => (
          <QuoteCard key={quote.id} quote={quote} />
        ))}
      </div>
    </div>
  );
}
