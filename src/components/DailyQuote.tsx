"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Quote } from "@/lib/queries";
import { MasterAvatar } from "./MasterAvatar";

type Phase = "idle" | "out" | "in";

export function DailyQuote({ daily, pool }: { daily: Quote; pool: Quote[] }) {
  // 可循环的名言池：把当前每日推荐也加进来，方便来回切换
  const all = useMemo(() => {
    if (pool.some((q) => q.id === daily.id)) return pool;
    return [daily, ...pool];
  }, [daily, pool]);

  const canSwap = all.length > 1;

  // 当前展示的名言 + 动画阶段 + 触发计数
  const [shown, setShown] = useState<Quote>(daily);
  const [phase, setPhase] = useState<Phase>("idle");
  const [spinning, setSpinning] = useState(false);
  const [sweepKey, setSweepKey] = useState(0);
  const busy = useRef(false);

  const swap = useCallback(() => {
    if (!canSwap || busy.current) return;
    busy.current = true;

    // 1) 旧内容上移淡出 + 高光扫过 + 按钮旋转 + 卡片辉光
    setSpinning(true);
    setSweepKey((k) => k + 1);
    setPhase("out");

    // 2) 淡出结束后换内容并进入
    window.setTimeout(() => {
      setShown((prev) => {
        const candidates = all.filter((q) => q.id !== prev.id);
        return candidates[Math.floor(Math.random() * candidates.length)] ?? prev;
      });
      setPhase("in");

      // 3) 进入动画结束后复位
      window.setTimeout(() => {
        setPhase("idle");
        setSpinning(false);
        busy.current = false;
      }, 460);
    }, 260);
  }, [all, canSwap]);

  const animClass =
    phase === "out" ? "dq-swap-out" : phase === "in" ? "dq-swap-in" : "";

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
              disabled={phase !== "idle"}
              className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-70"
              style={{
                borderColor: "var(--t-accent)",
                color: "var(--t-accent)",
                background: "transparent",
              }}
              aria-label="换一句推荐名言"
            >
              <svg
                className={spinning ? "dq-btn-spin" : ""}
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                style={{ transformOrigin: "center" }}
              >
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

      <Link href={`/quotes/${shown.id}`} className="block group">
        <div
          className={`relative p-6 md:p-8 border-2 transition-all duration-300 group-hover:shadow-2xl overflow-hidden ${
            phase !== "idle" ? "dq-card-pulse" : ""
          }`}
          style={{
            background: "var(--t-accent-bg)",
            borderColor: "var(--t-accent)",
            borderRadius: "var(--t-radius)",
          }}
        >
          {/* 切换时高光斜扫（每次点击换 key 重新触发） */}
          {phase !== "idle" && (
            <span key={sweepKey} className="dq-sweep" aria-hidden />
          )}

          {/* 装饰大引号 */}
          <div
            className="absolute top-2 left-3 text-7xl md:text-8xl leading-none opacity-20 select-none pointer-events-none font-serif"
            style={{ color: "var(--t-accent)" }}
          >
            &ldquo;
          </div>

          {/* 内容：key 随当前名言变化，进入阶段重放动画 */}
          <div key={shown.id} className={animClass}>
            <p
              className="quote-text relative text-xl md:text-2xl lg:text-3xl font-medium leading-relaxed pl-2 md:pl-4 mb-5"
              style={{ color: "var(--t-text)" }}
            >
              {shown.content_cn}
            </p>

            {shown.content_en && (
              <p
                className="text-sm md:text-base italic leading-relaxed pl-2 md:pl-4 mb-6"
                style={{ color: "var(--t-text-muted)" }}
              >
                &ldquo;{shown.content_en}&rdquo;
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pl-2 md:pl-4">
              <div className="flex items-center gap-3 min-w-0">
                <MasterAvatar
                  name={shown.master_name_cn || ""}
                  avatarUrl={shown.master_avatar_url}
                  className="w-11 h-11 rounded-full text-white font-bold text-base shadow-md"
                />
                <div className="min-w-0">
                  <div className="font-semibold text-sm md:text-base truncate" style={{ color: "var(--t-text)" }}>
                    {shown.master_name_cn}
                  </div>
                  {shown.master_title && (
                    <div className="text-xs truncate" style={{ color: "var(--t-text-secondary)" }}>
                      {shown.master_title}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {shown.source && (
                  <span className="text-xs hidden sm:inline" style={{ color: "var(--t-text-muted)" }}>
                    📖 {shown.source}{shown.source_year ? ` · ${shown.source_year}` : ""}
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
