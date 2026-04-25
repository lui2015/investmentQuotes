"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { Quote, Tag } from "@/lib/queries";
import { withBasePath } from "@/lib/basePath";

export function QuotesClient({ initialQuotes, tags }: { initialQuotes: Quote[]; tags: Tag[] }) {
  const [quotes, setQuotes] = useState(initialQuotes);
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  const doSearch = useCallback(async (keyword: string) => {
    if (!keyword.trim()) { setQuotes(initialQuotes); return; }
    setSearching(true);
    try {
      const res = await fetch(withBasePath(`/api/search?q=${encodeURIComponent(keyword)}`));
      setQuotes(await res.json());
    } finally { setSearching(false); }
  }, [initialQuotes]);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search, doSearch]);

  const filtered = selectedTag ? quotes.filter((q) => q.tags?.some((t) => t.id === selectedTag)) : quotes;

  return (
    <>
      <div className="mb-8">
        <div className="relative max-w-xl">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索名言、大师姓名…"
            className="w-full px-5 py-3 pl-12 border text-base focus:outline-none focus:ring-2 transition-shadow"
            style={{
              background: "var(--t-bg-input)",
              borderColor: "var(--t-border)",
              color: "var(--t-text)",
              borderRadius: "var(--t-radius)",
              // @ts-expect-error css variable
              "--tw-ring-color": "var(--t-accent)",
            }}
          />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "var(--t-text-muted)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searching && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--t-accent)", borderTopColor: "transparent" }} />
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setSelectedTag(null)}
          className="tag-pill transition-colors"
          style={{ background: !selectedTag ? "var(--t-accent)" : "var(--t-bg-tag)", color: !selectedTag ? "var(--t-bg)" : "var(--t-tag-text)" }}
        >
          全部
        </button>
        {tags.map((tag) => (
          <button
            key={tag.id}
            onClick={() => setSelectedTag(tag.id === selectedTag ? null : tag.id)}
            className="tag-pill transition-colors"
            style={{
              background: tag.id === selectedTag ? "var(--t-accent)" : "var(--t-bg-tag)",
              color: tag.id === selectedTag ? "var(--t-bg)" : "var(--t-tag-text)",
            }}
          >
            {tag.name}
          </button>
        ))}
      </div>

      <p className="text-sm mb-6" style={{ color: "var(--t-text-muted)" }}>{filtered.length} 条名言</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((quote) => (
          <Link key={quote.id} href={`/quotes/${quote.id}`} className="block">
            <div
              className="card-hover p-6 border h-full flex flex-col transition-colors duration-300"
              style={{ background: "var(--t-bg-card)", borderColor: "var(--t-border)", borderRadius: "var(--t-radius)" }}
            >
              <div className="flex-1">
                <div className="text-3xl mb-3 leading-none" style={{ color: "var(--t-accent)" }}>&ldquo;</div>
                <p className="quote-text text-base leading-relaxed mb-3" style={{ color: "var(--t-text)" }}>{quote.content_cn}</p>
                {quote.content_en && (
                  <p className="text-sm italic leading-relaxed mb-4" style={{ color: "var(--t-text-muted)" }}>{quote.content_en}</p>
                )}
              </div>
              <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--t-border)" }}>
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0"
                    style={{ background: `linear-gradient(135deg, var(--t-avatar-from), var(--t-avatar-to))` }}
                  >
                    {quote.master_name_cn?.charAt(0)}
                  </div>
                  <div className="text-sm font-medium" style={{ color: "var(--t-text)" }}>{quote.master_name_cn}</div>
                </div>
                {quote.tags && quote.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {quote.tags.map((tag) => (
                      <span key={tag.id} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--t-bg-tag)", color: "var(--t-tag-text)" }}>
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
          <p className="text-lg" style={{ color: "var(--t-text-secondary)" }}>没有找到匹配的名言</p>
          <p className="text-sm mt-2" style={{ color: "var(--t-text-muted)" }}>试试换个关键词</p>
        </div>
      )}
    </>
  );
}
