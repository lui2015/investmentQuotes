"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Quote } from "@/lib/queries";

/**
 * 基于字符串 id 的确定性伪随机（FNV-1a 变体），保证 SSR 与 CSR 渲染一致，
 * 避免繁星位置在 hydration 时跳变导致警告。返回 [0, 1)。
 */
function seeded(id: string, salt: number): number {
  let h = (2166136261 ^ salt) >>> 0;
  for (let i = 0; i < id.length; i++) {
    h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

// 繁星色板：偏冷的星光色，深空背景下清透闪亮
const STAR_COLORS = ["#a5f3e0", "#bfe3ff", "#eaf5b0", "#ffffff", "#c9b6ff", "#9fe8c4"];

// 常显名言文字的「亮星」数量（其余作为纯发光星点，悬停/轻触即可查看名言）。
// quotes 已按精华程度排序，靠前者最值得常驻展示。
const LABELED_DESKTOP = 84;
const LABELED_MOBILE = 34;

// 移动端限制交互星数量，兼顾性能与观感（点星过密在小屏会糊成一片）。
const MOBILE_STAR_LIMIT = 240;

function truncate(text: string, max = 16): string {
  if (!text) return "";
  return text.length > max ? text.slice(0, max - 1) + "…" : text;
}

export function StarrySky({ quotes, onExit }: { quotes: Quote[]; onExit: () => void }) {
  const [isMobile, setIsMobile] = useState(false);
  const [canHover, setCanHover] = useState(true);
  // 当前选中（hover / 轻触）的名言，完整内容展示在底部固定卡片中
  const [active, setActive] = useState<Quote | null>(null);

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

  // 移动端截取靠前的精华名言，桌面端用全量
  const visibleQuotes = useMemo(
    () => (isMobile ? quotes.slice(0, MOBILE_STAR_LIMIT) : quotes),
    [quotes, isMobile],
  );

  // 每条名言 -> 一颗星的布局参数（确定性）
  const stars = useMemo(
    () =>
      visibleQuotes.map((q, i) => {
        const labeled = i < labeledCount; // 亮星常显文字，点星仅发光
        const x = 1.5 + seeded(q.id, 1) * 95; // 水平位置 %
        const y = 6 + seeded(q.id, 2) * 86; // 垂直位置 %
        // 亮星字号偏大以承载文字；点星极小，仅作星点铺满夜空
        const scale = labeled
          ? 0.78 + seeded(q.id, 3) * 0.68
          : 0.42 + seeded(q.id, 3) * 0.42;
        const twk = (2.2 + seeded(q.id, 4) * 3.6).toFixed(2); // 闪烁周期 s
        const delay = (seeded(q.id, 5) * 6).toFixed(2); // 动画延迟 s
        const drift = (9 + seeded(q.id, 6) * 12).toFixed(2); // 漂浮周期 s
        const dx = ((seeded(q.id, 7) - 0.5) * 60).toFixed(1); // 漂浮水平幅度 px
        const dy = ((seeded(q.id, 8) - 0.5) * 50).toFixed(1); // 漂浮垂直幅度 px
        // 约 1/3 星点采用当前主题强调色，让星空融入页面主题；其余用冷色星光
        const useTheme = seeded(q.id, 10) < 0.36;
        const color = useTheme
          ? "var(--t-accent-light, #bfe3ff)"
          : STAR_COLORS[Math.floor(seeded(q.id, 9) * STAR_COLORS.length)];
        return { q, labeled, x, y, scale, twk, delay, drift, dx, dy, color };
      }),
    [visibleQuotes, labeledCount],
  );

  // 纯装饰性背景微星（增加"繁星"密度，不可交互）
  const dust = useMemo(() => {
    const n = isMobile ? 32 : 60;
    return Array.from({ length: n }).map((_, i) => {
      const key = `dust-${i}`;
      return {
        left: (seeded(key, 1) * 100).toFixed(2),
        top: (seeded(key, 2) * 100).toFixed(2),
        size: (0.8 + seeded(key, 3) * 2.2).toFixed(2),
        twk: (1.8 + seeded(key, 4) * 3).toFixed(2),
        delay: (seeded(key, 5) * 4).toFixed(2),
        op: (0.25 + seeded(key, 6) * 0.5).toFixed(2),
      };
    });
  }, [isMobile]);

  // 与星星交互：桌面 hover 即选中；触屏轻触选中（不直接跳转，先看完整名言）
  const pick = (q: Quote) => setActive(q);

  return (
    <div className="starry-overlay fixed inset-0 z-[60] overflow-hidden" role="dialog" aria-label="繁星模式">
      {/* 深空渐变背景 + 星云光晕（随主题着色） */}
      <div className="starry-bg" aria-hidden />

      {/* 背景微星尘 */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        {dust.map((d, i) => (
          <span
            key={i}
            className="starry-dust"
            style={{
              left: `${d.left}%`,
              top: `${d.top}%`,
              width: `${d.size}px`,
              height: `${d.size}px`,
              opacity: Number(d.op),
              animationDuration: `${d.twk}s`,
              animationDelay: `${d.delay}s`,
            }}
          />
        ))}
      </div>

      {/* 顶部标题 & 退出 */}
      <div className="absolute top-0 inset-x-0 z-[62] flex items-center justify-between px-4 sm:px-8 py-4 sm:py-5 pointer-events-none">
        <div className="pointer-events-auto select-none">
          <div className="flex items-center gap-2 text-white/90">
            <span className="text-lg">✨</span>
            <span className="text-base sm:text-lg font-bold tracking-wide">繁星模式</span>
          </div>
          <p className="mt-0.5 text-[11px] sm:text-[13px] text-white/45">
            全库 {quotes.length} 条名言如繁星闪烁 · {canHover ? "悬停" : "轻触"}星星查看名言
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

      {/* 繁星（每颗即一条名言） */}
      {stars.map((s) => (
        <button
          key={s.q.id}
          type="button"
          aria-label={s.q.content_cn}
          onMouseEnter={canHover ? () => pick(s.q) : undefined}
          onFocus={() => pick(s.q)}
          onClick={() => pick(s.q)}
          className={`starry-star${s.labeled ? " starry-star--float" : " starry-star--dot"}${
            active?.id === s.q.id ? " starry-star--active" : ""
          }`}
          style={
            {
              left: `${s.x}%`,
              top: `${s.y}%`,
              fontSize: `${s.scale}rem`,
              color: s.color,
              "--dx": `${s.dx}px`,
              "--dy": `${s.dy}px`,
              "--drift": `${s.drift}s`,
              "--twk": `${s.twk}s`,
              "--delay": `${s.delay}s`,
            } as React.CSSProperties
          }
        >
          <span className="starry-drift">
            <span className="starry-body">
              <span className="starry-dot" style={{ background: s.color }} />
              {s.labeled && <span className="starry-label">{truncate(s.q.content_cn)}</span>}
            </span>
          </span>
        </button>
      ))}

      {/* 底部固定名言卡片：完整展示当前选中名言，永不被裁剪/变形，移动端亦可用 */}
      <div className={`starry-card${active ? " is-open" : ""}`} role="status" aria-live="polite">
        {active ? (
          <>
            <button
              type="button"
              className="starry-card-close"
              aria-label="关闭"
              onClick={() => setActive(null)}
            >
              ×
            </button>
            <p className="starry-card-quote">{active.content_cn}</p>
            {active.content_en && <p className="starry-card-en">{active.content_en}</p>}
            <div className="starry-card-foot">
              <span className="starry-card-author">
                {active.master_name_cn}
                {active.master_title ? ` · ${active.master_title}` : ""}
              </span>
              <Link href={`/quotes/${active.id}`} className="starry-card-link">
                查看详情
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </>
        ) : (
          <p className="starry-card-hint">
            {canHover ? "悬停任意一颗星，名言在此浮现" : "轻触任意一颗星，名言在此浮现"}
          </p>
        )}
      </div>
    </div>
  );
}
