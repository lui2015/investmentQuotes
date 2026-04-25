import { notFound } from "next/navigation";
import Link from "next/link";
import { getQuoteById, getRelatedQuotes } from "@/lib/queries";
import { getInterpretation } from "@/lib/interpretations";
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
  const interp = getInterpretation(quote);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <nav className="mb-8 text-sm" style={{ color: "var(--t-text-muted)" }}>
        <Link href="/">首页</Link><span className="mx-2">/</span>
        <Link href="/quotes">名言库</Link><span className="mx-2">/</span>
        <span style={{ color: "var(--t-text)" }}>名言详情</span>
      </nav>

      <article
        className="p-8 md:p-12 border mb-8 transition-colors duration-300"
        style={{ background: "var(--t-bg-card)", borderColor: "var(--t-border)", borderRadius: "calc(var(--t-radius) * 1.5)" }}
      >
        <div className="text-5xl mb-6 leading-none" style={{ color: "var(--t-accent)" }}>&ldquo;</div>

        <blockquote className="quote-text text-2xl md:text-3xl font-medium leading-relaxed mb-6" style={{ color: "var(--t-text)" }}>
          {quote.content_cn}
        </blockquote>

        {quote.content_en && (
          <p
            className="text-lg italic leading-relaxed mb-8 pl-4 border-l-2"
            style={{ color: "var(--t-text-muted)", borderColor: "var(--t-accent)" }}
          >
            {quote.content_en}
          </p>
        )}

        <div className="border-t pt-6 mt-6" style={{ borderColor: "var(--t-border)" }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <Link href={`/masters/${quote.master_id}`} className="flex items-center gap-4 group">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl shrink-0 shadow-lg"
                style={{ background: `linear-gradient(135deg, var(--t-avatar-from), var(--t-avatar-to))` }}
              >
                {quote.master_name_cn?.charAt(0)}
              </div>
              <div>
                <div className="font-bold text-lg group-hover:underline" style={{ color: "var(--t-text)" }}>
                  {quote.master_name_cn}
                  <span className="text-sm font-normal ml-2" style={{ color: "var(--t-text-muted)" }}>{quote.master_name_en}</span>
                </div>
                <div className="text-sm" style={{ color: "var(--t-text-secondary)" }}>{quote.master_title} · {quote.master_category}</div>
              </div>
            </Link>
            <CopyButton quote={quote} />
          </div>
        </div>

        {quote.source && (
          <div className="mt-6 flex items-center gap-2 text-sm" style={{ color: "var(--t-text-secondary)" }}>
            <span>📖</span>
            <span>出自《{quote.source}》{quote.source_year ? `（${quote.source_year}）` : ""}</span>
          </div>
        )}

        {quote.tags && quote.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {quote.tags.map((tag) => (
              <Link
                key={tag.id}
                href={`/topics/${tag.slug}`}
                className="tag-pill transition-colors"
                style={{ background: "var(--t-bg-tag)", color: "var(--t-tag-text)" }}
              >
                {tag.name}
              </Link>
            ))}
          </div>
        )}
      </article>

      {/* —— 深度解读板块 —— */}
      <section className="space-y-6 mb-10">
        {/* 1. 核心解读 */}
        <div
          className="p-6 md:p-8 border transition-colors duration-300"
          style={{
            background: "var(--t-bg-card)",
            borderColor: "var(--t-border)",
            borderRadius: "calc(var(--t-radius) * 1.5)",
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <span
              className="w-9 h-9 rounded-full flex items-center justify-center text-lg"
              style={{ background: "var(--t-accent-bg)", color: "var(--t-accent)" }}
              aria-hidden
            >
              🧭
            </span>
            <h2 className="text-xl font-bold" style={{ color: "var(--t-text)" }}>
              核心解读
            </h2>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: "var(--t-accent-bg)", color: "var(--t-accent-text)" }}
            >
              这句话到底在讲什么
            </span>
          </div>
          <p
            className="leading-loose text-base md:text-lg"
            style={{ color: "var(--t-text-secondary)" }}
          >
            {interp.core}
          </p>
        </div>

        {/* 2. 应用实操 */}
        <div
          className="p-6 md:p-8 border transition-colors duration-300"
          style={{
            background: "var(--t-bg-card)",
            borderColor: "var(--t-border)",
            borderRadius: "calc(var(--t-radius) * 1.5)",
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <span
              className="w-9 h-9 rounded-full flex items-center justify-center text-lg"
              style={{ background: "var(--t-accent-bg)", color: "var(--t-accent)" }}
              aria-hidden
            >
              🛠
            </span>
            <h2 className="text-xl font-bold" style={{ color: "var(--t-text)" }}>
              应用实操
            </h2>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: "var(--t-accent-bg)", color: "var(--t-accent-text)" }}
            >
              落地到你的投资
            </span>
          </div>
          <ul className="space-y-3">
            {interp.practice.map((item, i) => (
              <li key={i} className="flex gap-3 leading-relaxed">
                <span
                  className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                  style={{
                    background: "var(--t-accent)",
                    color: "var(--t-bg-card)",
                  }}
                  aria-hidden
                >
                  {i + 1}
                </span>
                <span style={{ color: "var(--t-text-secondary)" }}>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 3. 生动案例 */}
        <div
          className="p-6 md:p-8 border transition-colors duration-300"
          style={{
            background: "var(--t-bg-card)",
            borderColor: "var(--t-border)",
            borderRadius: "calc(var(--t-radius) * 1.5)",
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <span
              className="w-9 h-9 rounded-full flex items-center justify-center text-lg"
              style={{ background: "var(--t-accent-bg)", color: "var(--t-accent)" }}
              aria-hidden
            >
              📚
            </span>
            <h2 className="text-xl font-bold" style={{ color: "var(--t-text)" }}>
              生动案例
            </h2>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: "var(--t-accent-bg)", color: "var(--t-accent-text)" }}
            >
              真实故事里的这句话
            </span>
          </div>
          <p
            className="leading-loose text-base md:text-lg pl-4 border-l-2"
            style={{
              color: "var(--t-text-secondary)",
              borderColor: "var(--t-accent)",
            }}
          >
            {interp.story}
          </p>
        </div>

        {/* 4. 大师视角（可选） */}
        {interp.masterView && (
          <div
            className="p-6 md:p-8 border transition-colors duration-300"
            style={{
              background: "var(--t-bg-card)",
              borderColor: "var(--t-border)",
              borderRadius: "calc(var(--t-radius) * 1.5)",
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <span
                className="w-9 h-9 rounded-full flex items-center justify-center text-lg"
                style={{ background: "var(--t-accent-bg)", color: "var(--t-accent)" }}
                aria-hidden
              >
                💭
              </span>
              <h2 className="text-xl font-bold" style={{ color: "var(--t-text)" }}>
                {quote.master_name_cn} 的视角
              </h2>
            </div>
            <p
              className="leading-relaxed italic"
              style={{ color: "var(--t-text-muted)" }}
            >
              {interp.masterView}
            </p>
            <div className="mt-4">
              <Link
                href={`/masters/${quote.master_id}`}
                className="text-sm inline-flex items-center gap-1 transition-colors"
                style={{ color: "var(--t-accent)" }}
              >
                了解 {quote.master_name_cn} 的更多思想 →
              </Link>
            </div>
          </div>
        )}
      </section>

      {related.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-6" style={{ color: "var(--t-text)" }}>相关名言</h2>
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
