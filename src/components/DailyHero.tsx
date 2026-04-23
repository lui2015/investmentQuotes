"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";

interface QuoteData {
  id: string;
  content_cn: string;
  content_en: string | null;
  master_id: string;
  master_name_cn?: string;
  master_title?: string;
}

type AnimPhase = "idle" | "exit" | "wait" | "enter";

export function DailyHero({ initialQuote }: { initialQuote: QuoteData }) {
  const [displayed, setDisplayed] = useState(initialQuote);
  const [phase, setPhase] = useState<AnimPhase>("idle");
  const [animKey, setAnimKey] = useState(0);
  const pendingRef = useRef<QuoteData | null>(null);
  const busyRef = useRef(false);

  const handleRefresh = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;

    // Fetch next quote
    const res = await fetch("/api/random");
    const data = await res.json();
    if (!data?.id || data.id === displayed.id) {
      busyRef.current = false;
      return;
    }
    pendingRef.current = data;

    // Exit phase: blur + slide out
    setPhase("exit");
  }, [displayed.id]);

  useEffect(() => {
    if (phase === "exit") {
      const t = setTimeout(() => {
        // Swap to new content while invisible
        if (pendingRef.current) {
          setDisplayed(pendingRef.current);
          setAnimKey((k) => k + 1);
          pendingRef.current = null;
        }
        setPhase("enter");
      }, 480);
      return () => clearTimeout(t);
    }
    if (phase === "enter") {
      const t = setTimeout(() => {
        setPhase("idle");
        busyRef.current = false;
      }, 800);
      return () => clearTimeout(t);
    }
  }, [phase]);

  // Content wrapper classes for exit/enter transitions
  const wrapperClass = (() => {
    switch (phase) {
      case "exit":
        return "opacity-0 blur-md -translate-y-6 scale-[0.97] rotate-x-2";
      case "enter":
        return "opacity-0 translate-y-6";
      default:
        return "opacity-100 blur-0 translate-y-0 scale-100";
    }
  })();

  // Whether to render characters with staggered animation
  const showCharAnim = phase === "idle" || phase === "enter";

  return (
    <div className="text-center relative">
      {/* Decorative floating particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-amber-500/20 rounded-full"
            style={{
              left: `${15 + i * 14}%`,
              top: `${20 + (i % 3) * 25}%`,
              animation: `float ${3 + i * 0.5}s ease-in-out infinite alternate`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>

      {/* Main content with transition */}
      <div
        className={`transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${wrapperClass}`}
      >
        {/* Chinese quote with per-character animation */}
        <blockquote className="quote-text text-2xl md:text-3xl lg:text-4xl font-medium text-amber-950 dark:text-amber-50 leading-relaxed mb-6 max-w-3xl mx-auto quote-glow">
          <span className="inline-block">&ldquo;</span>
          {showCharAnim
            ? displayed.content_cn.split("").map((char, i) => (
                <span
                  key={`${animKey}-${i}`}
                  className="char-animate inline-block"
                  style={{
                    animationDelay: `${Math.min(i * 28, 900)}ms`,
                  }}
                >
                  {char === " " ? "\u00A0" : char}
                </span>
              ))
            : displayed.content_cn}
          <span className="inline-block">&rdquo;</span>
        </blockquote>

        {/* English translation - simple fade */}
        {displayed.content_en && (
          <p
            key={`en-${animKey}`}
            className="text-amber-800/60 dark:text-amber-200/60 text-sm md:text-base italic mb-8 max-w-2xl mx-auto char-animate"
            style={{ animationDelay: "400ms" }}
          >
            &ldquo;{displayed.content_en}&rdquo;
          </p>
        )}

        {/* Master info - slides in from below */}
        <div
          key={`master-${animKey}`}
          className="flex items-center justify-center gap-3 mb-8 char-animate"
          style={{ animationDelay: "500ms" }}
        >
          <div className="w-12 h-12 rounded-full bg-amber-800/20 dark:bg-amber-200/20 flex items-center justify-center text-amber-900 dark:text-amber-100 font-bold text-lg ring-2 ring-amber-600/30 dark:ring-amber-400/20 transition-all duration-500">
            {displayed.master_name_cn?.charAt(0)}
          </div>
          <div className="text-left">
            <Link
              href={`/masters/${displayed.master_id}`}
              className="font-semibold text-amber-900 dark:text-amber-100 hover:underline"
            >
              {displayed.master_name_cn}
            </Link>
            <div className="text-sm text-amber-800/60 dark:text-amber-200/60">
              {displayed.master_title}
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons - always visible, never animate out */}
      <div className="flex items-center justify-center gap-3 relative z-10">
        <button
          onClick={handleRefresh}
          disabled={phase !== "idle"}
          className="group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/90 dark:bg-stone-800/90 hover:bg-white dark:hover:bg-stone-700 text-amber-800 dark:text-amber-300 text-sm font-medium transition-all duration-300 shadow-lg shadow-amber-900/10 backdrop-blur disabled:opacity-60 hover:shadow-xl hover:shadow-amber-900/15 hover:scale-105 active:scale-95 overflow-hidden"
        >
          {/* Shimmer effect on hover */}
          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <svg
            className={`w-4 h-4 transition-transform duration-700 ${phase !== "idle" ? "animate-spin" : "group-hover:rotate-180"}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          换一条
        </button>
        <Link
          href={`/quotes/${displayed.id}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-800 dark:bg-amber-600 hover:bg-amber-900 dark:hover:bg-amber-700 text-white text-sm font-medium transition-all duration-300 shadow-lg shadow-amber-900/20 hover:shadow-xl hover:shadow-amber-900/30 hover:scale-105 active:scale-95"
        >
          查看详情 →
        </Link>
      </div>
    </div>
  );
}
