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
  return {
    title: `${master.name_cn}的投资名言 — 投资名言`,
    description: master.bio,
  };
}

export default async function MasterDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const master = getMaster(id);
  if (!master) notFound();

  const quotes = getMasterQuotes(master.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <nav className="mb-8 text-sm text-stone-400">
        <Link href="/" className="hover:text-amber-700">首页</Link>
        <span className="mx-2">/</span>
        <Link href="/masters" className="hover:text-amber-700">投资大师</Link>
        <span className="mx-2">/</span>
        <span className="text-stone-700 dark:text-stone-300">{master.name_cn}</span>
      </nav>

      {/* Master Info */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl p-8 md:p-12 border border-stone-200 dark:border-stone-800 mb-12">
        <div className="flex flex-col md:flex-row items-start gap-8">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-4xl shrink-0 shadow-xl shadow-amber-500/20">
            {master.name_cn.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-bold text-stone-800 dark:text-stone-200">
                {master.name_cn}
              </h1>
              <span className="text-lg text-stone-400">{master.name_en}</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="tag-pill bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300">
                {master.title}
              </span>
              <span className="tag-pill bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                {master.category}
              </span>
              <span className="tag-pill bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                {master.nationality} · {master.born_year}年生
              </span>
            </div>
            <p className="text-stone-600 dark:text-stone-400 leading-relaxed text-base">
              {master.bio}
            </p>
          </div>
        </div>
      </div>

      {/* Quotes */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-200 mb-2">
          经典名言
        </h2>
        <p className="text-stone-500 dark:text-stone-400">
          共 {quotes.length} 条名言
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quotes.map((quote) => (
          <QuoteCard key={quote.id} quote={quote} showMaster={false} />
        ))}
      </div>
    </div>
  );
}
