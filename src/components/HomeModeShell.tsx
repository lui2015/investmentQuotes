"use client";

import { useEffect, useState } from "react";
import type { Quote } from "@/lib/queries";
import { StarrySky } from "./StarrySky";

type Mode = "list" | "stars";

export function HomeModeShell({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>("list");
  // 繁星模式仅在电脑浏览器（宽视口 + 精确指针/鼠标）下提供入口，
  // 手机与触屏平板不显示按钮
  const [isDesktop, setIsDesktop] = useState(false);
  // 繁星数据按需加载：进入繁星模式才向 /api/stars 拉取，避免拖慢首屏
  const [starQuotes, setStarQuotes] = useState<Quote[] | null>(null);
  const [loadingStars, setLoadingStars] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px) and (pointer: fine)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // 进入繁星模式且尚未加载时，按需拉取全部名言
  useEffect(() => {
    if (mode === "stars" && starQuotes === null && !loadingStars) {
      setLoadingStars(true);
      fetch("api/stars")
        .then((r) => r.json())
        .then((d) => setStarQuotes(d.quotes || []))
        .catch(() => setStarQuotes([]))
        .finally(() => setLoadingStars(false));
    }
  }, [mode, starQuotes, loadingStars]);

  // 繁星模式时锁定 body 滚动，营造沉浸式全屏体验
  useEffect(() => {
    if (mode === "stars") {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [mode]);

  return (
    <>
      {/* 列表内容（繁星模式下隐藏） */}
      <div style={{ display: mode === "stars" ? "none" : undefined }}>{children}</div>

      {/* 繁星层（按需加载） */}
      {mode === "stars" &&
        (loadingStars || starQuotes === null ? (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center"
            style={{ background: "var(--t-bg)" }}
          >
            <span
              className="text-sm font-medium animate-pulse"
              style={{ color: "var(--t-text)" }}
            >
              正在点亮繁星…
            </span>
          </div>
        ) : (
          <StarrySky quotes={starQuotes} onExit={() => setMode("list")} />
        ))}

      {/* 列表模式下的悬浮入口按钮（仅电脑浏览器显示） */}
      {mode === "list" && isDesktop && (
        <button
          onClick={() => setMode("stars")}
          className="fixed bottom-6 right-6 z-50 group inline-flex items-center gap-2 rounded-full pl-4 pr-5 py-3 font-semibold text-sm shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
          style={{
            background: "var(--t-accent)",
            color: "var(--t-bg)",
            boxShadow: "0 10px 30px -8px var(--t-glow)",
          }}
          aria-label="切换到繁星模式"
          title="繁星模式"
        >
          <span className="text-base transition-transform duration-500 group-hover:rotate-[18deg]">✨</span>
          繁星模式
        </button>
      )}
    </>
  );
}
