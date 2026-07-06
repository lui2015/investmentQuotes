import { getAllQuotes, getAllTags, getAllMasters } from "@/lib/queries";
import { QuotesClient } from "@/components/QuotesClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "名言库 — 投资名言",
  description: "浏览全部投资名言、投资大师和主题分类",
};

export const dynamic = "force-dynamic";

export default function QuotesPage() {
  const quotes = getAllQuotes();
  const tags = getAllTags();
  const masters = getAllMasters();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: "var(--t-text)" }}>名言库</h1>
        <p className="text-lg" style={{ color: "var(--t-text-secondary)" }}>投资名言 · 大师智慧 · 主题分类</p>
      </div>
      <QuotesClient initialQuotes={quotes} tags={tags} masters={masters} />
    </div>
  );
}
