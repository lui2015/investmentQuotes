"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { Quote, Tag } from "@/lib/queries";

export function QuotesClient({ initialQuotes, tags }: { initialQuotes: Quote[]; tags: Tag[] }) {
  const [quotes, setQuotes] = useState(initialQuotes);
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  const doSearch = useCallback(async (keyword: string) => {
    if (!keyword.trim()) {
      setQuotes(initialQuotes);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(keyword)}`);
      const data = await res.json();
      setQuotes(data);
    } finally {
      setSearching(false);
    }
  }, [initialQuotes]);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search, doSearch]);

  const filtered = selectedTag
    ? quotes.filter((q) => q.tags?.some((t) => t.id === selectedTag))
    : quotes;

  return (
    <>
      {/* Search */}
      <div className="mb-8">
        <div className="relative max-w-xl">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索名言、大师姓名…"
            className="w-full px-5 py-3 pl-12 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-shadow"
          />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searching && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* Tag filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setSelectedTag(null)}
          className={`tag-pill ${!selectedTag ? "bg-amber-600 text-white" : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-amber-100 dark:hover:bg-amber-900/30"}`}
        >
          全部
        </button>
        {tags.map((tag) => (
          <button
            key={tag.id}
            onClick={() => setSelectedTag(tag.id === selectedTag ? null : tag.id)}
            className={`tag-pill ${tag.id === selectedTag ? "bg-amber-600 text-white" : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-amber-100 dark:hover:bg-amber-900/30"}`}
          >
            {tag.name}
          </button>
        ))}
      </div>

      {/* Results */}
      <p className="text-sm text-stone-400 mb-6">{filtered.length} 条名言</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((quote) => (
          <Link key={quote.id} href={`/quotes/${quote.id}`} className="block">
            <div className="card-hover bg-white dark:bg-stone-900 rounded-2xl p-6 border border-stone-200 dark:border-stone-800 h-full flex flex-col">
              <div className="flex-1">
                <div className="text-amber-500 text-3xl mb-3 leading-none">&ldquo;</div>
                <p className="quote-text text-stone-800 dark:text-stone-200 text-base leading-relaxed mb-3">
                  {quote.content_cn}
                </p>
                {quote.content_en && (
                  <p className="text-stone-400 dark:text-stone-500 text-sm italic leading-relaxed mb-4">
                    {quote.content_en}
                  </p>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-800">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                    {quote.master_name_cn?.charAt(0)}
                  </div>
                  <div className="text-sm font-medium text-stone-700 dark:text-stone-300">
                    {quote.master_name_cn}
                  </div>
                </div>
                {quote.tags && quote.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {quote.tags.map((tag) => (
                      <span key={tag.id} className="text-xs px-2 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-full">
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-stone-500 dark:text-stone-400 text-lg">没有找到匹配的名言</p>
          <p className="text-stone-400 text-sm mt-2">试试换个关键词</p>
        </div>
      )}
    </>
  );
}
