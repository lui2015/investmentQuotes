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
  return {
    title: `${tag.name} — 投资名言`,
    description: tag.description,
  };
}

export default async function TopicDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const tag = getTagBySlug(slug);
  if (!tag) notFound();

  const quotes = getQuotesByTag(tag.id);
  const allTags = getAllTags();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <nav className="mb-8 text-sm text-stone-400">
        <Link href="/" className="hover:text-amber-700">首页</Link>
        <span className="mx-2">/</span>
        <Link href="/topics" className="hover:text-amber-700">主题分类</Link>
        <span className="mx-2">/</span>
        <span className="text-stone-700 dark:text-stone-300">{tag.name}</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-stone-800 dark:text-stone-200 mb-3">
          {tag.name}
        </h1>
        <p className="text-stone-500 dark:text-stone-400 text-lg mb-6">
          {tag.description} · 共 {quotes.length} 条名言
        </p>

        {/* Other tags */}
        <div className="flex flex-wrap gap-2">
          {allTags.map((t) => (
            <Link
              key={t.id}
              href={`/topics/${t.slug}`}
              className={`tag-pill ${
                t.id === tag.id
                  ? "bg-amber-600 text-white"
                  : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 hover:text-amber-800 dark:hover:text-amber-300"
              }`}
            >
              {t.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Quotes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quotes.map((quote) => (
          <QuoteCard key={quote.id} quote={quote} />
        ))}
      </div>
    </div>
  );
}
