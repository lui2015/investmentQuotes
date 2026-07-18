"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { MasterAvatar } from "@/components/MasterAvatar";

export type DailyQuoteData = {
  id: string;
  content_cn: string;
  content_en?: string | null;
  master_name_cn?: string | null;
  master_avatar_url?: string | null;
  master_title?: string | null;
  source?: string | null;
  source_year?: number | null;
};

export default function DailyQuoteCard({
  daily,
  dateStr,
}: {
  daily: DailyQuoteData;
  dateStr: string;
}) {
  const [quote, setQuote] = useState<DailyQuoteData>(daily);
  const [loading, setLoading] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  const refresh = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      // 随机取一句，并尽量避开当前这条，做一次轻量去重
      let next: DailyQuoteData | null = null;
      for (let i = 0; i < 6; i++) {
        const res = await fetch("api/random", { cache: "no-store" });
        if (!res.ok) break;
        const data = (await res.json()) as DailyQuoteData | null;
        if (data && data.id && data.id !== quote.id) {
          next = data;
          break;
        }
      }
      if (next) {
        setQuote(next);
        setAnimKey((k) => k + 1); // 改变 key 触发入场动画重播
      }
    } catch {
      // 网络异常时静默保持当前名言，不做破坏性更新
    } finally {
      setLoading(false);
    }
  }, [loading, quote.id]);

  return (
    <section className="dq-card" aria-label="今日推荐">
      <span className="dq-corner dq-tl" aria-hidden />
      <span className="dq-corner dq-tr" aria-hidden />
      <span className="dq-corner dq-bl" aria-hidden />
      <span className="dq-corner dq-br" aria-hidden />
      <span className="dq-scan" aria-hidden />

      <div className="dq-inner">
        <div className="dq-hud">
          <span className="dq-pulse-dot" aria-hidden />
          <span className="dq-hud-title">今日推荐</span>
          <span className="dq-hud-code">DAILY SIGNAL</span>
          <span className="dq-signal" aria-hidden>
            <i style={{ height: 6, animationDelay: "0s" }} />
            <i style={{ height: 13, animationDelay: "0.15s" }} />
            <i style={{ height: 9, animationDelay: "0.3s" }} />
            <i style={{ height: 16, animationDelay: "0.45s" }} />
            <i style={{ height: 7, animationDelay: "0.6s" }} />
          </span>
          <span className="dq-date">{dateStr}</span>
        </div>

        <div className="dq-body" key={`${quote.id}-${animKey}`}>
          <span className="dq-mark" aria-hidden>
            &ldquo;
          </span>
          <p className="dq-content">{quote.content_cn}</p>
          {quote.content_en && (
            <p className="dq-content-en">&ldquo;{quote.content_en}&rdquo;</p>
          )}

          <div className="dq-meta">
            <MasterAvatar
              name={quote.master_name_cn ?? ""}
              avatarUrl={quote.master_avatar_url ?? undefined}
              className="dq-avatar"
            />
            <div className="dq-meta-text">
              <Link href={`/quotes/${quote.id}`} className="dq-author">
                {quote.master_name_cn ?? ""}
                {quote.master_title ? (
                  <span className="dq-author-title"> · {quote.master_title}</span>
                ) : null}
              </Link>
              {(quote.source || quote.source_year) && (
                <div className="dq-source">
                  {quote.source}
                  {quote.source_year ? ` · ${quote.source_year}` : ""}
                </div>
              )}
            </div>
            <Link href={`/quotes/${quote.id}`} className="dq-detail">
              查看详情
              <svg className="dq-detail-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        <div className="dq-foot">
          <button
            type="button"
            className="dq-refresh"
            onClick={refresh}
            disabled={loading}
            aria-busy={loading}
          >
            <svg
              className={`dq-refresh-icon${loading ? " is-spin" : ""}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h5M20 20v-5h-5M5.5 9a7 7 0 0111.9-2.5L20 9M18.5 15a7 7 0 01-11.9 2.5L4 15"
              />
            </svg>
            {loading ? "信号中…" : "换一句"}
          </button>
        </div>
      </div>
    </section>
  );
}
