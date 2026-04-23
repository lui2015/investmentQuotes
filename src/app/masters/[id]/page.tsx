import { notFound } from "next/navigation";
import Link from "next/link";
import { getMaster, getMasterQuotes } from "@/lib/queries";
import { QuoteCard } from "@/components/QuoteCard";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const master = getMaster(id);
  if (!master) return { title: "未找到 — 投资名言" };
  return { title: `${master.name_cn}的投资名言 — 投资名言`, description: master.bio };
}

export default async function MasterDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const master = getMaster(id);
  if (!master) notFound();
  const quotes = getMasterQuotes(master.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <nav className="mb-8 text-sm" style={{ color: "var(--t-text-muted)" }}>
        <Link href="/" style={{ color: "var(--t-text-muted)" }}>首页</Link>
        <span className="mx-2">/</span>
        <Link href="/masters" style={{ color: "var(--t-text-muted)" }}>投资大师</Link>
        <span className="mx-2">/</span>
        <span style={{ color: "var(--t-text)" }}>{master.name_cn}</span>
      </nav>

      <div
        className="p-8 md:p-12 border mb-12 transition-colors duration-300"
        style={{ background: "var(--t-bg-card)", borderColor: "var(--t-border)", borderRadius: "calc(var(--t-radius) * 1.5)" }}
      >
        <div className="flex flex-col md:flex-row items-start gap-8">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-4xl shrink-0 shadow-xl"
            style={{ background: `linear-gradient(135deg, var(--t-avatar-from), var(--t-avatar-to))` }}
          >
            {master.name_cn.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-bold" style={{ color: "var(--t-text)" }}>{master.name_cn}</h1>
              <span className="text-lg" style={{ color: "var(--t-text-muted)" }}>{master.name_en}</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {[master.title, master.category, `${master.nationality} · ${master.born_year}年生`].map((label) => (
                <span key={label} className="tag-pill" style={{ background: "var(--t-bg-tag)", color: "var(--t-tag-text)" }}>
                  {label}
                </span>
              ))}
            </div>
            <p className="leading-relaxed" style={{ color: "var(--t-text-secondary)" }}>{master.bio}</p>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--t-text)" }}>经典名言</h2>
        <p style={{ color: "var(--t-text-secondary)" }}>共 {quotes.length} 条名言</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quotes.map((quote) => (
          <QuoteCard key={quote.id} quote={quote} showMaster={false} />
        ))}
      </div>
    </div>
  );
}
