"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useFavorites } from "@/components/FavoritesProvider";
import { withBasePath } from "@/lib/basePath";
import { MasterAvatar } from "@/components/MasterAvatar";
import type { Quote } from "@/lib/queries";

export default function FavoritesPage() {
  const { ids, hydrated, clear } = useFavorites();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(false);
  const [notFoundIds, setNotFoundIds] = useState<string[]>([]);
  const [confirmingClear, setConfirmingClear] = useState(false);

  const loadQuotes = useCallback(async (currentIds: string[]) => {
    if (currentIds.length === 0) {
      setQuotes([]);
      setNotFoundIds([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        withBasePath(`/api/quotes?ids=${encodeURIComponent(currentIds.join(","))}`),
      );
      const data: Quote[] = await res.json();
      setQuotes(data);
      const returnedIds = new Set(data.map((q) => q.id));
      setNotFoundIds(currentIds.filter((id) => !returnedIds.has(id)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hydrated) loadQuotes(ids);
  }, [ids, hydrated, loadQuotes]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
      <header className="mb-8">
        <div className="flex items-baseline justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center justify-center w-8 h-8 rounded-full text-base"
              style={{ background: "var(--t-accent)", color: "var(--t-bg)" }}
              aria-hidden
            >
              ♡
            </span>
            <h1
              className="text-2xl md:text-3xl font-bold tracking-tight"
              style={{ color: "var(--t-text)" }}
            >
              我的收藏
            </h1>
          </div>
          {hydrated && ids.length > 0 && (
            <span
              className="text-xs font-mono px-2.5 py-1 rounded-full"
              style={{ background: "var(--t-bg-tag)", color: "var(--t-tag-text)" }}
            >
              {ids.length} 条
            </span>
          )}
        </div>
        <p style={{ color: "var(--t-text-secondary)" }} className="text-sm">
          收藏会保存在当前浏览器。换浏览器或清除浏览数据会丢失。
        </p>
      </header>

      {!hydrated && <Placeholder>正在读取收藏…</Placeholder>}

      {hydrated && ids.length === 0 && <EmptyState />}

      {hydrated && ids.length > 0 && (
        <>
          <div className="flex items-center justify-end mb-6">
            {confirmingClear ? (
              <div className="flex items-center gap-2 text-sm">
                <span style={{ color: "var(--t-text-secondary)" }}>确定清空所有收藏？</span>
                <button
                  onClick={() => {
                    clear();
                    setConfirmingClear(false);
                  }}
                  className="px-3 py-1.5 rounded-md font-medium transition-colors"
                  style={{ background: "var(--t-accent)", color: "var(--t-bg)" }}
                >
                  确定
                </button>
                <button
                  onClick={() => setConfirmingClear(false)}
                  className="px-3 py-1.5 rounded-md font-medium transition-colors"
                  style={{ background: "var(--t-bg-tag)", color: "var(--t-text)" }}
                >
                  取消
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmingClear(true)}
                className="text-xs transition-colors hover:opacity-80"
                style={{ color: "var(--t-text-muted)" }}
              >
                清空收藏
              </button>
            )}
          </div>

          {loading ? (
            <Placeholder>正在加载…</Placeholder>
          ) : quotes.length === 0 ? (
            <Placeholder>收藏的名言暂不可用</Placeholder>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {quotes.map((q) => (
                <FavoriteQuoteCard key={q.id} quote={q} />
              ))}
            </div>
          )}

          {notFoundIds.length > 0 && (
            <p
              className="mt-6 text-xs px-3 py-2 rounded-md border"
              style={{
                color: "var(--t-text-muted)",
                borderColor: "var(--t-border)",
                background: "var(--t-bg-card)",
              }}
            >
              {notFoundIds.length} 条收藏的名言已不存在，已自动忽略。
            </p>
          )}
        </>
      )}
    </div>
  );
}

function FavoriteQuoteCard({ quote }: { quote: Quote }) {
  return (
    <Link href={`/quotes/${quote.id}`} className="block group">
      <div
        className="card-hover p-6 border h-full flex flex-col transition-colors duration-300 relative"
        style={{
          background: "var(--t-bg-card)",
          borderColor: "var(--t-border)",
          borderRadius: "var(--t-radius)",
        }}
      >
        <span
          className="absolute top-3 right-3 inline-flex items-center justify-center w-7 h-7 rounded-full"
          style={{ background: "var(--t-accent-bg)", color: "var(--t-accent)" }}
          aria-hidden
          title="已收藏"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
            />
          </svg>
        </span>

        <div className="flex-1">
          <div
            className="text-3xl mb-3 leading-none"
            style={{ color: "var(--t-accent)" }}
            aria-hidden
          >
            &ldquo;
          </div>
          <p
            className="quote-text text-base leading-relaxed mb-3 pr-8"
            style={{ color: "var(--t-text)" }}
          >
            {quote.content_cn}
          </p>
          {quote.content_en && (
            <p
              className="text-sm italic leading-relaxed mb-4"
              style={{ color: "var(--t-text-muted)" }}
            >
              &ldquo;{quote.content_en}&rdquo;
            </p>
          )}
        </div>

        <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--t-border)" }}>
          <div className="flex items-center gap-3">
            <MasterAvatar
              name={quote.master_name_cn || ""}
              avatarUrl={quote.master_avatar_url}
              className="w-8 h-8 rounded-full text-white font-bold text-xs"
            />
            <div className="min-w-0">
              <div
                className="text-sm font-medium truncate"
                style={{ color: "var(--t-text)" }}
              >
                {quote.master_name_cn}
              </div>
              {quote.master_title && (
                <div
                  className="text-xs truncate"
                  style={{ color: "var(--t-text-muted)" }}
                >
                  {quote.master_title}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div
      className="p-12 text-center border"
      style={{
        background: "var(--t-bg-card)",
        borderColor: "var(--t-border)",
        borderRadius: "var(--t-radius)",
      }}
    >
      <div className="text-5xl mb-4" aria-hidden>♡</div>
      <h2
        className="text-lg font-semibold mb-2"
        style={{ color: "var(--t-text)" }}
      >
        还没有收藏任何名言
      </h2>
      <p
        className="text-sm mb-6"
        style={{ color: "var(--t-text-secondary)" }}
      >
        进入任意名言详情页，点击「收藏」按钮即可加入这里。
      </p>
      <Link
        href="/quotes"
        className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium transition-all hover:scale-105"
        style={{
          background: "var(--t-accent)",
          color: "var(--t-bg)",
          borderRadius: "var(--t-radius)",
        }}
      >
        去看看名言库 →
      </Link>
    </div>
  );
}

function Placeholder({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="p-12 text-center border"
      style={{
        background: "var(--t-bg-card)",
        borderColor: "var(--t-border)",
        borderRadius: "var(--t-radius)",
        color: "var(--t-text-muted)",
      }}
    >
      {children}
    </div>
  );
}
