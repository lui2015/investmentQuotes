import { notFound } from "next/navigation";
import Link from "next/link";
import { getQuoteById, getRelatedQuotes } from "@/lib/queries";
import { CopyButton } from "@/components/CopyButton";
import { QuoteCard } from "@/components/QuoteCard";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const quote = getQuoteById(id);
  if (!quote) return { title: "未找到 — 投资名言" };
  return {
    title: `${quote.content_cn.substring(0, 30)}… — ${quote.master_name_cn} | 投资名言`,
    description: `${quote.content_cn} —— ${quote.master_name_cn}`,
  };
}

export default async function QuoteDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const quote = getQuoteById(id);
  if (!quote) notFound();

  const related = getRelatedQuotes(quote.id, 4);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <nav className="mb-8 text-sm text-stone-400">
        <Link href="/" className="hover:text-amber-700">首页</Link>
        <span className="mx-2">/</span>
        <Link href="/quotes" className="hover:text-amber-700">名言库</Link>
        <span className="mx-2">/</span>
        <span className="text-stone-700 dark:text-stone-300">名言详情</span>
      </nav>

      {/* Main Quote */}
      <article className="bg-white dark:bg-stone-900 rounded-3xl p-8 md:p-12 border border-stone-200 dark:border-stone-800 mb-8">
        <div className="text-amber-500 text-5xl mb-6 leading-none">&ldquo;</div>

        <blockquote className="quote-text text-2xl md:text-3xl font-medium text-stone-800 dark:text-stone-200 leading-relaxed mb-6">
          {quote.content_cn}
        </blockquote>

        {quote.content_en && (
          <p className="text-stone-400 dark:text-stone-500 text-lg italic leading-relaxed mb-8 pl-4 border-l-2 border-amber-300 dark:border-amber-700">
            {quote.content_en}
          </p>
        )}

        <div className="border-t border-stone-100 dark:border-stone-800 pt-6 mt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <Link href={`/masters/${quote.master_id}`} className="flex items-center gap-4 group">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-xl shrink-0 shadow-lg shadow-amber-500/20">
                {quote.master_name_cn?.charAt(0)}
              </div>
              <div>
                <div className="font-bold text-lg text-stone-800 dark:text-stone-200 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                  {quote.master_name_cn}
                  <span className="text-sm text-stone-400 dark:text-stone-500 font-normal ml-2">{quote.master_name_en}</span>
                </div>
                <div className="text-sm text-stone-500 dark:text-stone-400">{quote.master_title} · {quote.master_category}</div>
              </div>
            </Link>

            <CopyButton quote={quote} />
          </div>
        </div>

        {/* Source */}
        {quote.source && (
          <div className="mt-6 flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400">
            <span>📖</span>
            <span>出自《{quote.source}》{quote.source_year ? `（${quote.source_year}）` : ""}</span>
          </div>
        )}

        {/* Tags */}
        {quote.tags && quote.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {quote.tags.map((tag) => (
              <Link
                key={tag.id}
                href={`/topics/${tag.slug}`}
                className="tag-pill bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40"
              >
                {tag.name}
              </Link>
            ))}
          </div>
        )}
      </article>

      {/* Related */}
      {related.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-stone-800 dark:text-stone-200 mb-6">
            相关名言
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {related.map((q) => (
              <QuoteCard key={q.id} quote={q} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
