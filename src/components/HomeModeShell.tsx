"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { StarQuote } from "@/lib/queries";

// 沉浸模式组件体积较大且首屏不需要，按需懒加载（进入对应模式时才下载对应 chunk）
const StarrySky = dynamic(() => import("./StarrySky").then((m) => m.StarrySky));
const BubbleMode = dynamic(() => import("./BubbleMode").then((m) => m.BubbleMode));

type Mode = "list" | "stars" | "bubbles";

export function HomeModeShell({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>("list");
  // 沉浸模式仅在电脑浏览器（宽视口 + 精确指针/鼠标）下提供入口，
  // 手机与触屏平板不显示按钮
  const [isDesktop, setIsDesktop] = useState(false);
  // 沉浸模式（繁星/气泡）数据按需加载：进入时才向 /api/stars 拉取，避免拖慢首屏
  const [starQuotes, setStarQuotes] = useState<StarQuote[] | null>(null);
  const [loadingStars, setLoadingStars] = useState(false);
  // 悬浮「+」按钮展开的模式选择菜单
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px) and (pointer: fine)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // 进入沉浸模式（繁星/气泡）且尚未加载时，按需拉取全部名言
  useEffect(() => {
    if ((mode === "stars" || mode === "bubbles") && starQuotes === null && !loadingStars) {
      setLoadingStars(true);
      // 该组件仅用于首页，首页路径即部署前缀 basePath（如 /investmentQuotes）；
      // 据此拼接 API 绝对路径，避免相对路径在带前缀部署时解析到根路径导致 404
      const basePath = window.location.pathname.replace(/\/$/, "");
      fetch(`${basePath}/api/stars`)
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

  // 菜单打开时按 Esc 关闭
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <>
      {/* 列表内容（沉浸模式下隐藏，避免与背景层叠） */}
      <div style={{ display: mode !== "list" ? "none" : undefined }}>{children}</div>

      {/* 沉浸层（繁星 / 气泡，按需加载） */}
      {(mode === "stars" || mode === "bubbles") &&
        (loadingStars || starQuotes === null ? (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center"
            style={{ background: "var(--t-bg)" }}
          >
            <span
              className="text-sm font-medium animate-pulse"
              style={{ color: "var(--t-text)" }}
            >
              {mode === "stars" ? "正在点亮繁星…" : "正在吹起泡泡…"}
            </span>
          </div>
        ) : mode === "stars" ? (
          <StarrySky quotes={starQuotes} onExit={() => setMode("list")} />
        ) : (
          <BubbleMode quotes={starQuotes} onExit={() => setMode("list")} />
        ))}

      {/* 列表模式下的悬浮入口：单一「+」按钮，点开选择沉浸模式（仅电脑浏览器显示） */}
      {mode === "list" && isDesktop && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
          {/* 展开的模式菜单 */}
          {menuOpen && (
            <>
              {/* 点击空白处关闭 */}
              <div
                className="fixed inset-0"
                onClick={() => setMenuOpen(false)}
                aria-hidden
              />
              <div className="relative z-10 flex flex-col items-end gap-3 mb-3">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setMode("stars");
                  }}
                  className="mode-menu-item group inline-flex items-center gap-2 rounded-full pl-4 pr-5 py-3 font-semibold text-sm shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
                  style={{
                    background: "var(--t-accent)",
                    color: "var(--t-bg)",
                    boxShadow: "0 10px 30px -8px var(--t-glow)",
                  }}
                  aria-label="切换到繁星模式"
                >
                  <span className="text-base transition-transform duration-500 group-hover:rotate-[18deg]">✨</span>
                  繁星模式
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setMode("bubbles");
                  }}
                  className="mode-menu-item group inline-flex items-center gap-2 rounded-full pl-4 pr-5 py-3 font-semibold text-sm shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
                  style={{
                    background: "linear-gradient(120deg, #ff7eb3, #9775fa, #74c0fc)",
                    color: "#ffffff",
                    boxShadow: "0 10px 30px -8px rgba(151,117,250,0.5)",
                  }}
                  aria-label="切换到气泡模式"
                >
                  <span className="text-base transition-transform duration-500 group-hover:translate-y-[-2px]">🫧</span>
                  气泡模式
                </button>
              </div>
            </>
          )}

          {/* 「+」悬浮按钮：展开/收起菜单，图标旋转为 × */}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="relative z-10 inline-flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
            style={{
              background: "var(--t-accent)",
              color: "var(--t-bg)",
              boxShadow: "0 12px 30px -8px var(--t-glow)",
            }}
            aria-label="选择沉浸模式"
            aria-expanded={menuOpen}
            title="沉浸模式"
          >
            <span
              className={`text-3xl leading-none font-light transition-transform duration-300 ${
                menuOpen ? "rotate-45" : ""
              }`}
            >
              +
            </span>
          </button>
        </div>
      )}
    </>
  );
}
