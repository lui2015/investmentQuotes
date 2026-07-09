import { notFound } from "next/navigation";
import Link from "next/link";
import { getQuoteById, getQuoteInterpretation, getRelatedQuotes } from "@/lib/queries";
import { CopyButton } from "@/components/CopyButton";
import { ExportImageButton } from "@/components/ExportImageButton";
import { FavoriteButton } from "@/components/FavoriteButton";
import { QuoteCard } from "@/components/QuoteCard";
import { MasterAvatar } from "@/components/MasterAvatar";
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
  const interp = getQuoteInterpretation(quote.id);

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
              <MasterAvatar
                name={quote.master_name_cn || ""}
                className="w-14 h-14 rounded-full text-white font-bold text-xl shadow-lg"
              />
              <div>
                <div className="font-bold text-lg group-hover:underline" style={{ color: "var(--t-text)" }}>
                  {quote.master_name_cn}
                  <span className="text-sm font-normal ml-2" style={{ color: "var(--t-text-muted)" }}>{quote.master_name_en}</span>
                </div>
                <div className="text-sm" style={{ color: "var(--t-text-secondary)" }}>{quote.master_title} · {quote.master_category}</div>
              </div>
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <FavoriteButton quoteId={quote.id} />
              <ExportImageButton quote={quote} interp={interp} />
              <CopyButton quote={quote} />
            </div>
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

      {interp && (
        <section className="mb-8 space-y-6">
          <Section icon="💡" title="核心解读" subtitle="这句话究竟在说什么">
            <p className="text-base leading-loose" style={{ color: "var(--t-text)" }}>{interp.core}</p>
          </Section>

          <Section icon="✅" title="应用实操" subtitle="给普通投资者的可执行清单">
            <ol className="space-y-3">
              {interp.practice.map((item, i) => (
                <li
                  key={i}
                  className="flex gap-3 p-3 rounded-lg border"
                  style={{ background: "var(--t-bg-card)", borderColor: "var(--t-border)" }}
                >
                  <span
                    className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: "var(--t-accent)" }}
                  >
                    {i + 1}
                  </span>
                  <span className="text-sm leading-relaxed" style={{ color: "var(--t-text)" }}>{item}</span>
                </li>
              ))}
            </ol>
          </Section>

          <Section icon="📖" title="生动案例" subtitle="一个真实故事 / 场景化情节">
            <p className="text-base leading-loose whitespace-pre-line" style={{ color: "var(--t-text-secondary)" }}>{interp.story}</p>
          </Section>

          {interp.master_view && (
            <Section icon="🧭" title="大师视角" subtitle="这句话在该大师思想体系里的位置">
              <p className="text-base leading-loose italic" style={{ color: "var(--t-text-secondary)" }}>{interp.master_view}</p>
            </Section>
          )}
        </section>
      )}

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

function Section({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="p-6 md:p-8 border"
      style={{ background: "var(--t-bg-card)", borderColor: "var(--t-border)", borderRadius: "calc(var(--t-radius) * 1.5)" }}
    >
      <div className="mb-4">
        <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: "var(--t-text)" }}>
          <span className="text-xl">{icon}</span>
          {title}
        </h3>
        <p className="text-xs mt-1" style={{ color: "var(--t-text-muted)" }}>{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
