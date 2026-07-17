"use client";

import { useEffect, useState } from "react";
import type { Quote } from "@/lib/queries";
import { StarrySky } from "./StarrySky";

type Mode = "list" | "stars";

export function HomeModeShell({
  starQuotes,
  children,
}: {
  starQuotes: Quote[];
  children: React.ReactNode;
}) {
  const [mode, setMode] = useState<Mode>("list");

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

      {/* 繁星层 */}
      {mode === "stars" && (
        <StarrySky quotes={starQuotes} onExit={() => setMode("list")} />
      )}

      {/* 列表模式下的悬浮入口按钮 */}
      {mode === "list" && (
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
