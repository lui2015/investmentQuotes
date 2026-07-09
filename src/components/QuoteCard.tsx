"use client";

import Link from "next/link";
import type { Quote } from "@/lib/queries";
import { useFavorites } from "./FavoritesProvider";
import { MasterAvatar } from "./MasterAvatar";

export function QuoteCard({ quote, showMaster = true, isNew = false }: { quote: Quote; showMaster?: boolean; isNew?: boolean }) {
  const { isFavorite, hydrated } = useFavorites();
  const favorited = hydrated && isFavorite(quote.id);

  return (
    <Link href={`/quotes/${quote.id}`} className="block">
      <div
        className="card-hover p-6 border h-full flex flex-col relative transition-colors duration-300"
        style={{
          background: "var(--t-bg-card)",
          borderColor: "var(--t-border)",
          borderRadius: "var(--t-radius)",
        }}
      >
        {isNew && (
          <span
            className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: "var(--t-accent)", color: "var(--t-bg)", letterSpacing: "0.05em" }}
          >
            NEW
          </span>
        )}
        {favorited && !isNew && (
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
          <p className="quote-text text-base leading-relaxed mb-3" style={{ color: "var(--t-text)" }}>
            {quote.content_cn}
          </p>
          {quote.content_en && (
            <p className="text-sm italic leading-relaxed mb-4" style={{ color: "var(--t-text-muted)" }}>
              {quote.content_en}
            </p>
          )}
        </div>

        <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--t-border)" }}>
          {showMaster && (
            <div className="flex items-center gap-3 mb-3">
              <MasterAvatar
                name={quote.master_name_cn || ""}
                className="w-10 h-10 rounded-full text-white font-bold text-sm"
              />
              <div>
                <div className="font-semibold text-sm" style={{ color: "var(--t-text)" }}>
                  {quote.master_name_cn}
                </div>
                <div className="text-xs" style={{ color: "var(--t-text-muted)" }}>{quote.master_title}</div>
              </div>
            </div>
          )}
          {quote.source && (
            <div className="text-xs" style={{ color: "var(--t-text-muted)" }}>
              📖 {quote.source}{quote.source_year ? ` (${quote.source_year})` : ""}
            </div>
          )}
          {quote.tags && quote.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {quote.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "var(--t-bg-tag)", color: "var(--t-tag-text)" }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
