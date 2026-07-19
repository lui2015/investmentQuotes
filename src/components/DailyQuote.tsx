"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import type { Quote } from "@/lib/queries";
import { MasterAvatar } from "./MasterAvatar";

export function DailyQuote({ daily, pool }: { daily: Quote; pool: Quote[] }) {
  // 可循环的名言池：把当前每日推荐也加进来，方便来回切换
  const all = useMemo(() => {
    if (pool.some((q) => q.id === daily.id)) return pool;
    return [daily, ...pool];
  }, [daily, pool]);

  const [current, setCurrent] = useState<Quote>(daily);
  const [fading, setFading] = useState(false);

  const canSwap = all.length > 1;

  const swap = useCallback(() => {
    if (!canSwap) return;
    setFading(true);
    // 轻微淡出后换内容再淡入，过渡更顺滑
    window.setTimeout(() => {
      setCurrent((prev) => {
        const candidates = all.filter((q) => q.id !== prev.id);
        return candidates[Math.floor(Math.random() * candidates.length)] ?? prev;
      });
      setFading(false);
    }, 150);
  }, [all, canSwap]);

  return (
    <section className="mb-10 md:mb-14">
      {/* 区块标题 + 换一句按钮 + 日期 */}
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center justify-center w-7 h-7 rounded-full text-sm"
            style={{ background: "var(--t-accent)", color: "var(--t-bg)" }}
            aria-hidden
          >
            ✨
          </span>
          <h2 className="text-lg md:text-xl font-bold" style={{ color: "var(--t-text)" }}>
            今日推荐
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {canSwap && (
            <button
              type="button"
              onClick={swap}
              className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                borderColor: "var(--t-accent)",
                color: "var(--t-accent)",
                background: "transparent",
              }}
              aria-label="换一句推荐名言"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h5M20 20v-5h-5M4 9a8 8 0 0 1 14-3M20 15a8 8 0 0 1-14 3"
                />
              </svg>
              换一句
            </button>
          )}
          <span className="text-xs font-mono" style={{ color: "var(--t-text-muted)" }}>
            {(() => {
              const t = new Date();
              const wd = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
              return `${t.getFullYear()}年${String(t.getMonth() + 1).padStart(2, "0")}月${String(t.getDate()).padStart(2, "0")}日 · ${wd[t.getDay()]}`;
            })()}
          </span>
        </div>
      </div>

      <Link href={`/quotes/${current.id}`} className="block group">
        <div
          className="relative p-6 md:p-8 border-2 transition-all duration-300 group-hover:shadow-2xl"
          style={{
            background: "var(--t-accent-bg)",
            borderColor: "var(--t-accent)",
            borderRadius: "var(--t-radius)",
          }}
        >
          {/* 装饰大引号 */}
          <div
            className="absolute top-2 left-3 text-7xl md:text-8xl leading-none opacity-20 select-none pointer-events-none font-serif"
            style={{ color: "var(--t-accent)" }}
          >
            &ldquo;
          </div>

          <div
            className="transition-opacity duration-150"
            style={{ opacity: fading ? 0 : 1 }}
          >
            <p
              className="quote-text relative text-xl md:text-2xl lg:text-3xl font-medium leading-relaxed pl-2 md:pl-4 mb-5"
              style={{ color: "var(--t-text)" }}
            >
              {current.content_cn}
            </p>

            {current.content_en && (
              <p
                className="text-sm md:text-base italic leading-relaxed pl-2 md:pl-4 mb-6"
                style={{ color: "var(--t-text-muted)" }}
              >
                &ldquo;{current.content_en}&rdquo;
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pl-2 md:pl-4">
              <div className="flex items-center gap-3 min-w-0">
                <MasterAvatar
                  name={current.master_name_cn || ""}
                  avatarUrl={current.master_avatar_url}
                  className="w-11 h-11 rounded-full text-white font-bold text-base shadow-md"
                />
                <div className="min-w-0">
                  <div className="font-semibold text-sm md:text-base truncate" style={{ color: "var(--t-text)" }}>
                    {current.master_name_cn}
                  </div>
                  {current.master_title && (
                    <div className="text-xs truncate" style={{ color: "var(--t-text-secondary)" }}>
                      {current.master_title}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {current.source && (
                  <span className="text-xs hidden sm:inline" style={{ color: "var(--t-text-muted)" }}>
                    📖 {current.source}{current.source_year ? ` · ${current.source_year}` : ""}
                  </span>
                )}
                <span
                  className="inline-flex items-center gap-1 text-sm font-bold transition-transform group-hover:translate-x-0.5"
                  style={{ color: "var(--t-accent)" }}
                >
                  查看详情
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </section>
  );
}
