"use client";

import Link from "next/link";
import type { Quote } from "@/lib/queries";
import { useFavorites } from "./FavoritesProvider";
import { MasterAvatar } from "./MasterAvatar";

function formatRelativeTime(createdAt: string): string {
  const ts = new Date(createdAt.replace(" ", "T") + "Z").getTime();
  if (!Number.isFinite(ts)) return "";
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "刚刚";
  if (min < 60) return `${min} 分钟前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} 小时前`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day} 天前`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo} 个月前`;
  return `${Math.floor(mo / 12)} 年前`;
}

export function FeedQuoteCard({ quote, isNew = false }: { quote: Quote; isNew?: boolean }) {
  const rel = formatRelativeTime(quote.created_at);
  const { isFavorite, hydrated } = useFavorites();
  const favorited = hydrated && isFavorite(quote.id);

  return (
    <Link href={`/quotes/${quote.id}`} className="block">
      <div
        className="card-hover p-5 md:p-6 border transition-all duration-300 hover:shadow-lg"
        style={{
          background: "var(--t-bg-card)",
          borderColor: "var(--t-border)",
          borderRadius: "var(--t-radius)",
        }}
      >
        {/* 作者行 */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <MasterAvatar
              name={quote.master_name_cn || ""}
              className="w-10 h-10 rounded-full text-white font-bold text-sm"
            />
            <div className="min-w-0">
              <div className="font-semibold text-sm truncate" style={{ color: "var(--t-text)" }}>
                {quote.master_name_cn}
              </div>
              {quote.master_title && (
                <div className="text-xs truncate" style={{ color: "var(--t-text-muted)" }}>
                  {quote.master_title}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {favorited && (
              <span
                className="inline-flex items-center justify-center w-6 h-6 rounded-full"
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
            {isNew && (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: "var(--t-accent)", color: "var(--t-bg)", letterSpacing: "0.05em" }}
              >
                NEW
              </span>
            )}
            <span className="text-xs" style={{ color: "var(--t-text-muted)" }}>
              {rel}
            </span>
          </div>
        </div>

        {/* 名言内容 */}
        <div className="relative">
          <div
            className="absolute -left-1 -top-1 text-4xl leading-none opacity-30 select-none pointer-events-none font-serif"
            style={{ color: "var(--t-accent)" }}
          >
            &ldquo;
          </div>
          <p
            className="quote-text text-base md:text-lg leading-relaxed pl-6 pr-2"
            style={{ color: "var(--t-text)" }}
          >
            {quote.content_cn}
          </p>
        </div>

        {quote.content_en && (
          <p
            className="text-sm italic leading-relaxed mt-3 pl-6"
            style={{ color: "var(--t-text-muted)" }}
          >
            &ldquo;{quote.content_en}&rdquo;
          </p>
        )}

        {/* 底部信息 */}
        <div className="mt-4 pt-4 border-t flex flex-wrap items-center gap-x-4 gap-y-2" style={{ borderColor: "var(--t-border)" }}>
          {quote.source && (
            <div className="text-xs flex items-center gap-1" style={{ color: "var(--t-text-muted)" }}>
              <span>📖</span>
              <span>{quote.source}{quote.source_year ? ` · ${quote.source_year}` : ""}</span>
            </div>
          )}
          {quote.tags && quote.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {quote.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag.id}
                  className="text-[11px] px-2 py-0.5 rounded-full"
                  style={{ background: "var(--t-bg-tag)", color: "var(--t-tag-text)" }}
                >
                  #{tag.name}
                </span>
              ))}
            </div>
          )}
          {typeof quote.favorite_count === "number" && quote.favorite_count > 0 && (
            <div className="text-xs flex items-center gap-1 ml-auto" style={{ color: "var(--t-text-muted)" }}>
              <span>♡</span>
              <span>{quote.favorite_count}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
