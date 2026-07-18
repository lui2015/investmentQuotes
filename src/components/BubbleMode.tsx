"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { StarQuote } from "@/lib/queries";

/**
 * 与星星模式一致的确定性伪随机（FNV-1a 变体），保证布局稳定、避免 hydration 跳变。
 * 返回 [0, 1)。
 */
function seeded(id: string, salt: number): number {
  let h = (2166136261 ^ salt) >>> 0;
  for (let i = 0; i < id.length; i++) {
    h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

// 将 #rrggbb 压暗，用于泡泡边缘渐变，营造立体玻璃感
function shade(hex: string): string {
  const m = hex.replace("#", "");
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  const f = 0.6;
  const d = (c: number) => Math.round(c * f).toString(16).padStart(2, "0");
  return `#${d(r)}${d(g)}${d(b)}`;
}

// 五颜六色泡泡色板（柔和糖果色，半透明更显梦幻）
const BUBBLE_COLORS = [
  "#ff7eb3", "#ff9a76", "#ffd166", "#8ce99a", "#63e6be",
  "#74c0fc", "#9775fa", "#f783ac", "#ffa94d", "#69db7c",
  "#4dabf7", "#da77f2", "#ffd43b", "#ff8787", "#3bc9db",
];

// 承载名言的「亮泡」数量（其余为纯装饰彩泡）
const LABELED_DESKTOP = 26;
const LABELED_MOBILE = 12;
const DECOR_DESKTOP = 46;
const DECOR_MOBILE = 22;

function truncate(text: string, max = 14): string {
  if (!text) return "";
  return text.length > max ? text.slice(0, max - 1) + "…" : text;
}

export function BubbleMode({ quotes, onExit }: { quotes: StarQuote[]; onExit: () => void }) {
  const [isMobile, setIsMobile] = useState(false);
  const [canHover, setCanHover] = useState(true);
  // 当前选中（hover / 轻触）的名言：卡片锚定到泡泡被点中处的屏幕坐标浮现
  const [active, setActive] = useState<{ q: StarQuote; x: number; y: number } | null>(null);

  useEffect(() => {
    const mqMobile = window.matchMedia("(max-width: 640px)");
    const mqHover = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => {
      setIsMobile(mqMobile.matches);
      setCanHover(mqHover.matches);
    };
    update();
    mqMobile.addEventListener("change", update);
    mqHover.addEventListener("change", update);
    return () => {
      mqMobile.removeEventListener("change", update);
      mqHover.removeEventListener("change", update);
    };
  }, []);

  const labeledCount = isMobile ? LABELED_MOBILE : LABELED_DESKTOP;

  // 名言泡泡：取靠前的精华名言，承载短句文字
  const labeled = useMemo(
    () =>
      quotes.slice(0, labeledCount).map((q) => {
        const color = BUBBLE_COLORS[Math.floor(seeded(q.id, 1) * BUBBLE_COLORS.length)];
        const size = 96 + seeded(q.id, 2) * 104; // 96 - 200 px
        const left = 3 + seeded(q.id, 3) * 90;
        const dur = (18 + seeded(q.id, 4) * 16).toFixed(1); // 上升周期 s
        const delay = (-seeded(q.id, 5) * 34).toFixed(1); // 起始错位
        const sway = (10 + seeded(q.id, 6) * 28).toFixed(1); // 水平摆幅 px
        const font = 0.72 + seeded(q.id, 8) * 0.28;
        return { q, color, size, left, dur, delay, sway, font };
      }),
    [quotes, labeledCount],
  );

  // 纯装饰彩色泡泡（不承载名言，铺满全屏营造如梦如幻感）
  const decor = useMemo(() => {
    const n = isMobile ? DECOR_MOBILE : DECOR_DESKTOP;
    return Array.from({ length: n }).map((_, i) => {
      const key = `b-${i}`;
      const color = BUBBLE_COLORS[Math.floor(seeded(key, 1) * BUBBLE_COLORS.length)];
      const size = 16 + seeded(key, 2) * 116;
      const left = seeded(key, 3) * 100;
      const dur = (14 + seeded(key, 4) * 22).toFixed(1);
      const delay = (-seeded(key, 5) * 36).toFixed(1);
      const sway = (8 + seeded(key, 6) * 30).toFixed(1);
      const op = (0.32 + seeded(key, 7) * 0.46).toFixed(2);
      return { key, color, size, left, dur, delay, sway, op };
    });
  }, [isMobile]);

  // 点中泡泡时记录其屏幕坐标，供名言卡片锚定浮现
  const pick = (q: StarQuote, e: React.MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((r.left + r.width / 2) / window.innerWidth) * 100;
    const y = ((r.top + r.height / 2) / window.innerHeight) * 100;
    setActive({ q, x, y });
  };

  return (
    <div className="bubble-overlay fixed inset-0 z-[60] overflow-hidden" role="dialog" aria-label="气泡模式">
      {/* 梦幻柔光渐变背景（随气流缓动，并模糊底下页面） */}
      <div className="bubble-bg" aria-hidden />

      {/* 装饰彩泡（不可交互） */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        {decor.map((b) => (
          <span
            key={b.key}
            className="bubble bubble--decor"
            style={
              {
                left: `${b.left}%`,
                width: `${b.size}px`,
                height: `${b.size}px`,
                opacity: Number(b.op),
                background: `radial-gradient(circle at 32% 26%, rgba(255,255,255,0.92), ${b.color} 46%, ${shade(b.color)} 100%)`,
                "--rise": `${b.dur}s`,
                "--rise-delay": `${b.delay}s`,
                "--sway": `${b.sway}px`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* 顶部标题 & 退出 */}
      <div className="absolute top-0 inset-x-0 z-[62] flex items-center justify-between px-4 sm:px-8 py-4 sm:py-5 pointer-events-none">
        <div className="pointer-events-auto select-none">
          <div className="flex items-center gap-2 text-white">
            <span className="text-lg">🫧</span>
            <span
              className="text-base sm:text-lg font-bold tracking-wide"
              style={{ textShadow: "0 1px 10px rgba(0,0,0,0.4)" }}
            >
              气泡模式
            </span>
          </div>
          <p
            className="mt-0.5 text-[11px] sm:text-[13px] text-white/75"
            style={{ textShadow: "0 1px 6px rgba(0,0,0,0.35)" }}
          >
            全库 {quotes.length} 条名言化作七彩泡泡 · {canHover ? "悬停" : "轻触"}泡泡查看名言
          </p>
        </div>
        <button
          onClick={onExit}
          className="starry-exit pointer-events-auto inline-flex items-center gap-1.5 rounded-full px-3.5 sm:px-4 py-2 text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span className="hidden sm:inline">列表模式</span>
        </button>
      </div>

      {/* 名言泡泡（每颗即一条名言） */}
      {labeled.map((b) => (
        <button
          key={b.q.id}
          type="button"
          aria-label={b.q.content_cn}
          onMouseEnter={canHover ? (e) => pick(b.q, e) : undefined}
          onClick={(e) => pick(b.q, e)}
          className={`bubble bubble--quote${active?.q.id === b.q.id ? " bubble--active" : ""}`}
          style={
            {
              left: `${b.left}%`,
              width: `${b.size}px`,
              height: `${b.size}px`,
              fontSize: `${b.font}rem`,
              background: `radial-gradient(circle at 32% 26%, rgba(255,255,255,0.95), ${b.color} 50%, ${shade(b.color)} 100%)`,
              "--rise": `${b.dur}s`,
              "--rise-delay": `${b.delay}s`,
              "--sway": `${b.sway}px`,
            } as React.CSSProperties
          }
        >
          <span className="bubble-text">{truncate(b.q.content_cn)}</span>
        </button>
      ))}

      {/* 名言卡片：锚定到选中泡泡所在屏幕坐标浮现（复用繁星卡片样式） */}
      {active && (
        <div
          className={`starry-card is-open ${active.y > 52 ? "starry-card--above" : "starry-card--below"}`}
          role="status"
          aria-live="polite"
          style={{ "--card-x": `${active.x}%`, "--card-y": `${active.y}%` } as React.CSSProperties}
        >
          <button
            type="button"
            className="starry-card-close"
            aria-label="关闭"
            onClick={() => setActive(null)}
          >
            ×
          </button>
          <p className="starry-card-quote">{active.q.content_cn}</p>
          {active.q.content_en && <p className="starry-card-en">{active.q.content_en}</p>}
          <div className="starry-card-foot">
            <span className="starry-card-author">
              {active.q.master_name_cn}
              {active.q.master_title ? ` · ${active.q.master_title}` : ""}
            </span>
            <Link href={`/quotes/${active.q.id}`} className="starry-card-link">
              查看详情
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      )}

      {/* 未选中时的引导提示 */}
      {!active && (
        <p className="starry-card-hint" role="status" aria-live="polite">
          {canHover ? "悬停任意一颗泡泡，名言在此浮现" : "轻触任意一颗泡泡，名言在此浮现"}
        </p>
      )}
    </div>
  );
}
