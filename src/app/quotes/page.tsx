import { getAllQuotes, getAllTags } from "@/lib/queries";
import { QuotesClient } from "@/components/QuotesClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "名言库 — 投资名言",
  description: "浏览全部投资名言，支持搜索和主题标签筛选",
};

export const dynamic = "force-dynamic";

export default function QuotesPage() {
  const quotes = getAllQuotes();
  const tags = getAllTags();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-stone-800 dark:text-stone-200 mb-4">
          名言库
        </h1>
        <p className="text-stone-500 dark:text-stone-400 text-lg">
          全部投资名言，支持搜索和标签筛选
        </p>
      </div>

      <QuotesClient initialQuotes={quotes} tags={tags} />
    </div>
  );
}
