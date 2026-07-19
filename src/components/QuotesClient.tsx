"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import type { Quote, Tag, Master } from "@/lib/queries";
import { withBasePath } from "@/lib/basePath";
import { useFavorites } from "./FavoritesProvider";
import { MasterAvatar } from "./MasterAvatar";

const tagIcons: Record<string, string> = {
  "价值投资": "💰", "长期主义": "⏳", "风险管理": "🛡️", "逆向思维": "🔄",
  "能力圈": "🎯", "市场认知": "📊", "心态修炼": "🧘", "学习成长": "📚",
  "企业分析": "🏢", "人生哲学": "🌟",
};

type TabKey = "quotes" | "masters" | "topics";

export function QuotesClient({
  initialQuotes,
  tags,
  masters,
}: {
  initialQuotes: Quote[];
  tags: Tag[];
  masters: Master[];
}) {
  const [tab, setTab] = useState<TabKey>("quotes");
  const { isFavorite, hydrated } = useFavorites();

  // ── 名言搜索 ──
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

  const filteredQuotes = selectedTag ? quotes.filter((q) => q.tags?.some((t) => t.id === selectedTag)) : quotes;

  // ── 分页 ──
  const PAGE_SIZE = 12;
  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [search, selectedTag, quotes]);
  const totalPages = Math.max(1, Math.ceil(filteredQuotes.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedQuotes = filteredQuotes.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const pageNumbers = useMemo(() => {
    const pages: (number | "…")[] = [];
    const push = (n: number | "…") => pages.push(n);
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) push(i);
    } else {
      push(1);
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      if (start > 2) push("…");
      for (let i = start; i <= end; i++) push(i);
      if (end < totalPages - 1) push("…");
      push(totalPages);
    }
    return pages;
  }, [totalPages, currentPage]);

  const goToPage = (p: number) => {
    const next = Math.min(Math.max(1, p), totalPages);
    setPage(next);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── 大师搜索 ──
  const [masterSearch, setMasterSearch] = useState("");
  const filteredMasters = useMemo(() => {
    const kw = masterSearch.trim().toLowerCase();
    if (!kw) return masters;
    return masters.filter((m) => {
      const fields = [m.name_cn, m.name_en, m.title, m.bio, m.category, m.nationality];
      return fields.some((f) => f && f.toLowerCase().includes(kw));
    });
  }, [masters, masterSearch]);

  const groupedMasters = useMemo(() => {
    return filteredMasters.reduce((acc, m) => {
      const cat = m.category || "其他";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(m);
      return acc;
    }, {} as Record<string, Master[]>);
  }, [filteredMasters]);

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: "quotes", label: "名言列表", icon: "💬" },
    { key: "masters", label: "投资大师", icon: "👤" },
    { key: "topics", label: "主题分类", icon: "🏷️" },
  ];

  return (
    <>
      {/* Tab 栏 */}
      <div className="flex gap-1 mb-8 md:mb-10 p-1 rounded-xl w-full sm:w-fit" style={{ background: "var(--t-bg-tag)" }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex-1 sm:flex-none px-2 sm:px-5 py-2.5 rounded-lg font-medium text-sm whitespace-nowrap transition-all duration-200"
            style={{
              background: tab === t.key ? "var(--t-accent)" : "transparent",
              color: tab === t.key ? "var(--t-bg)" : "var(--t-text-secondary)",
            }}
          >
            <span className="mr-1 sm:mr-1.5">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── 名言列表 ── */}
      {tab === "quotes" && (
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

          <p className="text-sm mb-6" style={{ color: "var(--t-text-muted)" }}>{filteredQuotes.length} 条名言</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pagedQuotes.map((quote) => {
              const favorited = hydrated && isFavorite(quote.id);
              return (
                <Link key={quote.id} href={`/quotes/${quote.id}`} className="block">
                  <div
                    className="card-hover p-6 border h-full flex flex-col transition-colors duration-300 relative"
                    style={{ background: "var(--t-bg-card)", borderColor: "var(--t-border)", borderRadius: "var(--t-radius)" }}
                  >
                    {favorited && (
                      <span
                        className="absolute top-3 right-3 inline-flex items-center justify-center w-6 h-6 rounded-full"
                        style={{ background: "var(--t-accent-bg)", color: "var(--t-accent)" }}
                        aria-label="已收藏"
                        title="已收藏"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth={2}>
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                          />
                        </svg>
                      </span>
                    )}
                    <div className="flex-1">
                      <div className="text-3xl mb-3 leading-none" style={{ color: "var(--t-accent)" }}>&ldquo;</div>
                      <p className="quote-text text-base leading-relaxed mb-3" style={{ color: "var(--t-text)" }}>{quote.content_cn}</p>
                      {quote.content_en && (
                        <p className="text-sm italic leading-relaxed mb-4" style={{ color: "var(--t-text-muted)" }}>{quote.content_en}</p>
                      )}
                    </div>
                    <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--t-border)" }}>
                      <div className="flex items-center gap-3 mb-2">
                        <MasterAvatar
                          name={quote.master_name_cn || ""}
                          avatarUrl={quote.master_avatar_url}
                          className="w-8 h-8 rounded-full text-white font-bold text-xs"
                        />
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
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center flex-wrap gap-2 mt-10">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "var(--t-bg-tag)", color: "var(--t-tag-text)" }}
                aria-label="上一页"
              >
                ‹ 上一页
              </button>

              {pageNumbers.map((p, i) =>
                p === "…" ? (
                  <span key={`ellipsis-${i}`} className="px-2 text-sm" style={{ color: "var(--t-text-muted)" }}>…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => goToPage(p)}
                    className="min-w-[2.5rem] px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                    style={{
                      background: p === currentPage ? "var(--t-accent)" : "var(--t-bg-tag)",
                      color: p === currentPage ? "var(--t-bg)" : "var(--t-tag-text)",
                    }}
                    aria-current={p === currentPage ? "page" : undefined}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "var(--t-bg-tag)", color: "var(--t-tag-text)" }}
                aria-label="下一页"
              >
                下一页 ›
              </button>
            </div>
          )}

          {filteredQuotes.length === 0 && (
            <div className="text-center py-16">
              <div className="text-4xl mb-4">🔍</div>
              <p className="text-lg" style={{ color: "var(--t-text-secondary)" }}>没有找到匹配的名言</p>
              <p className="text-sm mt-2" style={{ color: "var(--t-text-muted)" }}>试试换个关键词</p>
            </div>
          )}
        </>
      )}

      {/* ── 投资大师 ── */}
      {tab === "masters" && (
        <>
          <div className="mb-10">
            <div className="relative max-w-xl">
              <input
                type="text"
                value={masterSearch}
                onChange={(e) => setMasterSearch(e.target.value)}
                placeholder="搜索大师姓名、流派、关键词…"
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
              {masterSearch && (
                <button onClick={() => setMasterSearch("")} aria-label="清空搜索" className="absolute right-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: "var(--t-text-muted)" }}>
                  ✕
                </button>
              )}
            </div>
            <p className="text-sm mt-3" style={{ color: "var(--t-text-muted)" }}>共 {filteredMasters.length} 位大师</p>
          </div>

          {Object.entries(groupedMasters).map(([category, categoryMasters]) => (
            <div key={category} className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-xl font-bold" style={{ color: "var(--t-text)" }}>{category}</h2>
                <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: "var(--t-bg-tag)", color: "var(--t-tag-text)" }}>
                  {categoryMasters.length} 位大师
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {categoryMasters.map((master) => (
                  <Link key={master.id} href={`/masters/${master.id}`} className="block">
                    <div
                      className="card-hover p-6 border h-full transition-colors duration-300 flex flex-col"
                      style={{ background: "var(--t-bg-card)", borderColor: "var(--t-border)", borderRadius: "var(--t-radius)" }}
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <MasterAvatar
                          name={master.name_cn}
                          avatarUrl={master.avatar_url}
                          className="w-14 h-14 rounded-full text-white font-bold text-xl shadow-lg"
                        />
                        <div className="min-w-0">
                          <h3 className="font-bold truncate" style={{ color: "var(--t-text)" }}>{master.name_cn}</h3>
                          {master.name_en && (
                            <p className="text-sm truncate" style={{ color: "var(--t-text-muted)" }}>{master.name_en}</p>
                          )}
                        </div>
                      </div>
                      {master.title && (
                        <div className="mb-3">
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "var(--t-bg-tag)", color: "var(--t-tag-text)" }}>
                            {master.title}
                          </span>
                        </div>
                      )}
                      {master.bio && (
                        <p className="text-sm line-clamp-2 leading-relaxed mb-4" style={{ color: "var(--t-text-secondary)" }}>{master.bio}</p>
                      )}
                      <div
                        className="flex items-center justify-between text-xs mt-auto pt-3"
                        style={{
                          color: "var(--t-text-muted)",
                          borderTop: master.title || master.bio ? "1px solid var(--t-border)" : "none",
                        }}
                      >
                        <span className="truncate">
                          {[
                            master.nationality,
                            master.born_year ? `${master.born_year}年生` : null,
                          ]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </span>
                        <span className="font-medium flex-shrink-0 ml-2" style={{ color: "var(--t-accent)" }}>
                          {master.quote_count} 条名言
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}

          {filteredMasters.length === 0 && (
            <div className="text-center py-16">
              <div className="text-4xl mb-4">🔍</div>
              <p className="text-lg" style={{ color: "var(--t-text-secondary)" }}>没有找到匹配的大师</p>
              <p className="text-sm mt-2" style={{ color: "var(--t-text-muted)" }}>试试换个关键词</p>
            </div>
          )}
        </>
      )}

      {/* ── 主题分类 ── */}
      {tab === "topics" &&
        (() => {
          const sorted = [...tags].sort((a, b) => (b.quote_count || 0) - (a.quote_count || 0));
          const [featured, ...rest] = sorted;
          return (
            <div>
              {/* 精选头条：名言最多的主题 */}
              {featured && (
                <Link href={`/topics/${featured.slug}`} className="topic-feature group block mb-6">
                  <article
                    className="relative flex flex-col sm:flex-row sm:items-center gap-6 p-7 border"
                    style={{ background: "var(--t-bg-card)", borderColor: "var(--t-border)", borderRadius: "var(--t-radius)" }}
                  >
                    <div className="feature-glow" aria-hidden />
                    <div className="topic-badge flex items-center justify-center w-20 h-20 text-4xl rounded-3xl shrink-0" aria-hidden>
                      {tagIcons[featured.name] || "💬"}
                    </div>
                    <div className="relative flex-1 min-w-0">
                      <div className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--t-accent)" }}>
                        热门主题
                      </div>
                      <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--t-text)" }}>{featured.name}</h2>
                      <p className="text-sm leading-relaxed mb-3 line-clamp-2" style={{ color: "var(--t-text-secondary)" }}>
                        {featured.description}
                      </p>
                      <span className="inline-flex items-baseline gap-1 text-sm" style={{ color: "var(--t-text-muted)" }}>
                        <span className="text-base font-bold" style={{ color: "var(--t-accent)" }}>{featured.quote_count}</span>
                        条名言
                      </span>
                    </div>
                    <span className="topic-arrow inline-flex items-center gap-1.5 text-sm font-semibold shrink-0" style={{ color: "var(--t-accent)" }}>
                      进入主题
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </article>
                </Link>
              )}

              {/* 其余主题网格 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {rest.map((tag) => (
                  <Link key={tag.id} href={`/topics/${tag.slug}`} className="group block h-full">
                    <article
                      className="topic-card relative h-full flex flex-col p-6 border"
                      style={{ background: "var(--t-bg-card)", borderColor: "var(--t-border)", borderRadius: "var(--t-radius)" }}
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className="topic-badge flex items-center justify-center w-12 h-12 text-2xl rounded-2xl shrink-0" aria-hidden>
                          {tagIcons[tag.name] || "💬"}
                        </div>
                        <h3 className="text-lg font-bold truncate" style={{ color: "var(--t-text)" }}>{tag.name}</h3>
                      </div>
                      <p className="text-sm leading-relaxed mb-5 flex-1 line-clamp-2" style={{ color: "var(--t-text-secondary)" }}>
                        {tag.description}
                      </p>
                      <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: "var(--t-border)" }}>
                        <span className="inline-flex items-baseline gap-1 text-xs" style={{ color: "var(--t-text-muted)" }}>
                          <span className="text-base font-bold" style={{ color: "var(--t-accent)" }}>{tag.quote_count}</span>
                          条名言
                        </span>
                        <span className="topic-arrow text-lg" style={{ color: "var(--t-accent)" }} aria-hidden>→</span>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </div>
          );
        })()}
    </>
  );
}
