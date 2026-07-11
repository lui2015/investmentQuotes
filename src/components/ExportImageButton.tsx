"use client";

import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import type { Quote, Interpretation } from "@/lib/queries";

interface Props {
  quote: Quote;
  interp: Interpretation | null;
}

type Status = "idle" | "rendering" | "done" | "error";

/* ----------------------------------------------------------------------
   主题 → 海报配色映射
   从 <html data-theme> 的 CSS 变量里读取，让海报跟随站点主题
   ---------------------------------------------------------------------- */
interface Palette {
  // 整体背景（hero 渐变）
  bgFrom: string;
  bgVia: string;
  bgTo: string;
  bgDeep: string; // 边缘最深处
  // 卡片 / 浅色面板
  cardBg: string;
  cardBorder: string;
  // 文字
  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string; // 副标题/链接下方的反色
  // 主题色
  accent: string;
  accentSoft: string; // 半透明底
  accentBorder: string; // 半透明描边
  accentText: string; // 标签/小元素
  accentTextStrong: string; // 强调文字
  // 头像
  avatarFrom: string;
  avatarTo: string;
  // hero 文字
  heroText: string;
  heroSub: string;
  // 装饰
  particle: string;
  // 主题名（用于顶部 LOGO 副标）
  themeBadge: string;
  // 是否浅色主题（影响水印/二维码按钮样式）
  isLight: boolean;
  // 字体族
  fontFamily: string;
}

function hexToRgba(hex: string, alpha: number): string {
  const m = hex.replace("#", "").trim();
  if (m.length !== 6) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function mix(hex: string, targetHex: string, weight: number): string {
  const a = hex.replace("#", "");
  const b = targetHex.replace("#", "");
  const ar = parseInt(a.slice(0, 2), 16), ag = parseInt(a.slice(2, 4), 16), ab = parseInt(a.slice(4, 6), 16);
  const br = parseInt(b.slice(0, 2), 16), bg = parseInt(b.slice(2, 4), 16), bb = parseInt(b.slice(4, 6), 16);
  const r = Math.round(ar + (br - ar) * weight);
  const g = Math.round(ag + (bg - ag) * weight);
  const bl = Math.round(ab + (bb - ab) * weight);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${bl.toString(16).padStart(2, "0")}`;
}

function readPalette(): Palette {
  const root = document.documentElement;
  const cs = getComputedStyle(root);
  const v = (name: string) => cs.getPropertyValue(name).trim();

  const themeId = (root.getAttribute("data-theme") || "cyberpunk").trim();

  const accent = v("--t-accent") || "#b45309";
  const bg = v("--t-bg") || "#ffffff";
  const bgCard = v("--t-bg-card") || "#ffffff";
  const text = v("--t-text") || "#1c1917";
  const textSecondary = v("--t-text-secondary") || "#78716c";
  const textMuted = v("--t-text-muted") || "#a8a29e";
  const heroFrom = v("--t-hero-from") || "#fef3c7";
  const heroVia = v("--t-hero-via") || "#fde68a";
  const heroTo = v("--t-hero-to") || "#f59e0b";
  const avatarFrom = v("--t-avatar-from") || "#fbbf24";
  const avatarTo = v("--t-avatar-to") || "#d97706";
  const heroText = v("--t-hero-text") || text;
  const heroSub = v("--t-hero-sub") || textSecondary;
  const particle = v("--t-particle") || hexToRgba(accent, 0.2);
  const fontQuote = v("--t-font-quote") || "system-ui, sans-serif";

  // 判断是浅色还是深色主题
  // 把背景色拆成 RGB 算亮度
  const bgRgb = bg.replace("#", "");
  const br = parseInt(bgRgb.slice(0, 2), 16) || 255;
  const bg2 = parseInt(bgRgb.slice(2, 4), 16) || 255;
  const bb = parseInt(bgRgb.slice(4, 6), 16) || 255;
  const luminance = (0.299 * br + 0.587 * bg2 + 0.114 * bb) / 255;
  const isLight = luminance > 0.55;

  // 给主色算一个 12% 透明底（用于标签/卡片背景）
  const accentSoft = hexToRgba(accent, 0.12);
  // 30% 透明描边
  const accentBorder = hexToRgba(accent, 0.32);

  // 渐变背景的最深处：拿背景色向暗/向亮推 5%
  const bgDeep = isLight ? mix(bg, "#000000", 0.18) : mix(bg, "#000000", 0.45);

  // 反色文字（深色主题用白、浅色用深）
  const textInverse = isLight ? "#ffffff" : "#0a0a14";

  // 主题徽章文字：经典金/水墨这种浅色主题用棕金色；深色主题用主题色
  const themeBadge = isLight ? mix(accent, "#000000", 0.25) : accent;

  const nameMap: Record<string, string> = {
    classic: "经典金 · CLASSIC",
    cyberpunk: "赛博朋克 · CYBERPUNK",
    ink: "水墨丹青 · INK",
    minimal: "极简主义 · MINIMAL",
    purple: "暗夜星辰 · NEBULA",
  };

  return {
    bgFrom: heroFrom,
    bgVia: heroVia,
    bgTo: heroTo,
    bgDeep,
    cardBg: bgCard,
    cardBorder: hexToRgba(accent, isLight ? 0.2 : 0.18),
    text,
    textSecondary,
    textMuted,
    textInverse,
    accent,
    accentSoft,
    accentBorder,
    accentText: accent,
    accentTextStrong: isLight ? mix(accent, "#000000", 0.2) : accent,
    avatarFrom,
    avatarTo,
    heroText,
    heroSub,
    particle,
    themeBadge: nameMap[themeId] || themeId.toUpperCase(),
    isLight,
    fontFamily: `${fontQuote}, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", "Source Han Sans SC", system-ui, sans-serif`,
  };
}

/* ----------------------------------------------------------------------
   按钮
   ---------------------------------------------------------------------- */
export function ExportImageButton({ quote, interp }: Props) {
  const posterRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errMsg, setErrMsg] = useState<string>("");
  // 海报主题色：state 驱动 DOM 渲染；ref 保存最新值，供 handleExport 同步使用
  const paletteRef = useRef<Palette | null>(null);
  const [palette, setPalette] = useState<Palette | null>(null);
  useEffect(() => {
    const p = readPalette();
    paletteRef.current = p;
    setPalette(p);
  }, []);

  useEffect(() => {
    if (status !== "error") return;
    const t = setTimeout(() => setStatus("idle"), 2400);
    return () => clearTimeout(t);
  }, [status]);

  const handleExport = async () => {
    if (!posterRef.current) return;
    if (status === "rendering") return;
    setStatus("rendering");
    setErrMsg("");

    try {
      // 重新读一次主题色（用户可能切了主题），立即同步到 ref + state
      const livePalette = readPalette();
      paletteRef.current = livePalette;
      setPalette(livePalette);

      // 等离屏 DOM 拿到新 palette 后再截图
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      await document.fonts.ready;

      const dataUrl = await toPng(posterRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        // 浅色主题补白边，深色主题用最深处
        backgroundColor: livePalette.isLight ? livePalette.bgFrom : livePalette.bgDeep,
        width: 1080,
        height: 1440,
        style: {
          width: "1080px",
          height: "1440px",
          left: "0",
          top: "0",
          transform: "none",
        },
      });

      const safeName =
        (quote.master_name_cn || "quote").replace(/[\\/:*?"<>|]/g, "_") +
        "_" +
        quote.id.slice(0, 8) +
        ".png";
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = safeName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setStatus("done");
      setTimeout(() => setStatus("idle"), 1800);
    } catch (e) {
      console.error("[ExportImage] failed:", e);
      setErrMsg((e as Error).message || "导出失败");
      setStatus("error");
    }
  };

  return (
    <>
      <button
        onClick={handleExport}
        disabled={status === "rendering"}
        title="导出为精美图片，适合发抖音 / 小红书"
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed"
        style={{
          background: "var(--t-bg-tag)",
          color: "var(--t-text)",
          borderRadius: "var(--t-radius)",
        }}
      >
        {status === "rendering" ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            生成中…
          </>
        ) : status === "done" ? (
          <>
            <svg className="w-4 h-4" style={{ color: "var(--t-accent)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            已导出
          </>
        ) : status === "error" ? (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            {errMsg ? "导出失败" : "重试"}
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
            </svg>
            导出为图片
          </>
        )}
      </button>

      {/* 离屏海报（1080x1440，3:4） */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          left: "-100000px",
          top: 0,
          width: "1080px",
          height: "1440px",
          pointerEvents: "none",
          zIndex: -1,
        }}
      >
        {palette && <QuotePoster ref={posterRef} quote={quote} interp={interp} palette={palette} />}
      </div>
    </>
  );
}

/* ----------------------------------------------------------------------
   海报本体：1080×1440，flex 纵向布局（不再使用绝对定位，避免内容溢出重叠）
   ---------------------------------------------------------------------- */
const QuotePoster = forwardRef<
  HTMLDivElement,
  { quote: Quote; interp: Interpretation | null; palette: Palette }
>(function QuotePoster({ quote, interp, palette }, ref) {
  const P = palette;
  const initial = (quote.master_name_cn || "?").charAt(0);
  const tags = (quote.tags ?? []).slice(0, 3);
  const [avatarOk, setAvatarOk] = useState(true);
  const hasAvatar = Boolean(quote.master_avatar_url) && avatarOk;

  // 主引文 + 英文 引文裁剪：
  // 中文按字数裁剪，英文按行数裁剪
  const cnLen = (quote.content_cn || "").length;
  const cnFontSize = cnLen > 60 ? 56 : cnLen > 40 ? 64 : 72;

  const en = quote.content_en || "";
  const enLineClamp = en.length > 220 ? 3 : en.length > 120 ? 3 : 2;
  const enFontSize = en.length > 220 ? 26 : 30;

  // 核心解读裁剪到 4 行
  const coreText = interp?.core || "";
  const coreLineClamp = coreText.length > 140 ? 4 : 3;
  const coreFontSize = coreText.length > 100 ? 26 : 28;

  return (
    <div
      ref={ref}
      style={{
        width: "1080px",
        height: "1440px",
        position: "relative",
        overflow: "hidden",
        fontFamily: P.fontFamily,
        color: P.text,
        // 整体渐变背景
        background: `linear-gradient(160deg, ${P.bgFrom} 0%, ${P.bgVia} 45%, ${P.bgTo} 78%, ${P.bgDeep} 100%)`,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* 装饰光晕 1：右上 */}
      <div
        style={{
          position: "absolute",
          top: "-260px",
          right: "-260px",
          width: "780px",
          height: "780px",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${hexToRgba(P.accent, 0.35)} 0%, transparent 65%)`,
          filter: "blur(50px)",
          pointerEvents: "none",
        }}
      />
      {/* 装饰光晕 2：左下 */}
      <div
        style={{
          position: "absolute",
          bottom: "-260px",
          left: "-200px",
          width: "700px",
          height: "700px",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${hexToRgba(P.avatarFrom, 0.28)} 0%, transparent 65%)`,
          filter: "blur(50px)",
          pointerEvents: "none",
        }}
      />
      {/* 主题风格水印大字（淡淡的衬底） */}
      <div
        style={{
          position: "absolute",
          bottom: "40px",
          right: "30px",
          fontSize: "260px",
          fontWeight: 900,
          color: P.particle,
          letterSpacing: "-10px",
          lineHeight: 0.85,
          pointerEvents: "none",
          fontFamily: "Georgia, serif",
        }}
      >
        ””
      </div>

      {/* ============== 顶部品牌栏 ============== */}
      <div
        style={{
          flex: "0 0 auto",
          padding: "54px 72px 0 72px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span
            style={{
              display: "inline-block",
              width: "14px",
              height: "14px",
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${P.accent}, ${P.avatarFrom})`,
              boxShadow: `0 0 16px ${hexToRgba(P.accent, 0.7)}`,
            }}
          />
          <span style={{ fontSize: "26px", fontWeight: 700, color: P.heroText, letterSpacing: "3px" }}>
            投资名言
          </span>
        </div>
      </div>

      {/* ============== 作者区 ============== */}
      <div
        style={{
          flex: "0 0 auto",
          marginTop: "44px",
          padding: "0 72px",
          display: "flex",
          alignItems: "center",
          gap: "32px",
        }}
      >
        <div
          style={{
            width: "130px",
            height: "130px",
            borderRadius: "50%",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "60px",
            fontWeight: 800,
            color: "#ffffff",
            background: `linear-gradient(135deg, ${P.avatarFrom} 0%, ${P.avatarTo} 100%)`,
            boxShadow: `0 10px 32px ${hexToRgba(P.accent, 0.45)}`,
            flexShrink: 0,
          }}
        >
          {hasAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={quote.master_avatar_url!}
              alt={quote.master_name_cn || ""}
              crossOrigin="anonymous"
              onError={() => setAvatarOk(false)}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          ) : (
            <span>{initial}</span>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: "50px",
              fontWeight: 700,
              lineHeight: 1.1,
              color: P.heroText,
              letterSpacing: "1px",
            }}
          >
            {quote.master_name_cn}
          </div>
          {quote.master_name_en && (
            <div
              style={{
                fontSize: "24px",
                color: P.heroSub,
                marginTop: "8px",
                letterSpacing: "1.5px",
                fontStyle: "italic",
              }}
            >
              {quote.master_name_en}
            </div>
          )}
          {quote.master_title && (
            <div
              style={{
                fontSize: "22px",
                color: P.textSecondary,
                marginTop: "12px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: P.accent,
                }}
              />
              <span>
                {quote.master_title}
                {quote.master_category ? ` · ${quote.master_category}` : ""}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ============== 引文区（自适应高度，垂直居中，均分留白） ============== */}
      <div
        style={{
          flex: "1 1 auto",
          padding: "36px 72px 32px 72px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center", // 关键：短名言时上下均分留白，避免底部大空洞
          minHeight: 0, // 关键：允许内部内容收缩
        }}
      >
        {/* 装饰巨型引号 */}
        <div
          style={{
            fontSize: "150px",
            lineHeight: 0.55,
            color: hexToRgba(P.accent, 0.55),
            fontFamily: "Georgia, serif",
            fontWeight: 700,
            marginBottom: "6px",
            height: "82px",
            flex: "0 0 auto",
          }}
        >
          “
        </div>

        {/* 中文主引文 */}
        <div
          style={{
            fontSize: `${cnFontSize}px`,
            fontWeight: 700,
            lineHeight: 1.35,
            color: P.text,
            letterSpacing: "1.5px",
            wordBreak: "break-word",
            flex: "0 1 auto",
          }}
        >
          {quote.content_cn}
        </div>

        {/* 英文引文 */}
        {en && (
          <div
            style={{
              marginTop: "28px",
              paddingLeft: "26px",
              borderLeft: `4px solid ${P.accent}`,
              fontSize: `${enFontSize}px`,
              fontStyle: "italic",
              lineHeight: 1.5,
              color: P.textSecondary,
              wordBreak: "break-word",
              display: "-webkit-box",
              WebkitLineClamp: enLineClamp,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              flex: "0 1 auto",
            }}
          >
            {en}
          </div>
        )}
      </div>

      {/* ============== 标签条 ============== */}
      {tags.length > 0 && (
        <div
          style={{
            flex: "0 0 auto",
            padding: "0 72px 28px 72px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            flexWrap: "wrap",
          }}
        >
          {tags.map((t) => (
            <span
              key={t.id}
              style={{
                fontSize: "24px",
                padding: "10px 24px",
                borderRadius: "999px",
                background: P.accentSoft,
                border: `1.5px solid ${P.accentBorder}`,
                color: P.accentTextStrong,
                fontWeight: 600,
                letterSpacing: "1px",
              }}
            >
              # {t.name}
            </span>
          ))}
        </div>
      )}

      {/* ============== 核心解读卡片 ============== */}
      {interp?.core && (
        <div
          style={{
            flex: "0 0 auto",
            margin: "0 72px 28px 72px",
            padding: "26px 30px",
            borderRadius: "22px",
            background: P.cardBg,
            border: `1.5px solid ${P.cardBorder}`,
            position: "relative",
            boxShadow: `0 8px 24px ${hexToRgba(P.accent, 0.12)}`,
          }}
        >
          <div
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: P.accentTextStrong,
              marginBottom: "12px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              letterSpacing: "1px",
            }}
          >
            <span style={{ fontSize: "28px" }}>💡</span>
            <span>核心解读</span>
          </div>
          <div
            style={{
              fontSize: `${coreFontSize}px`,
              lineHeight: 1.6,
              color: P.text,
              display: "-webkit-box",
              WebkitLineClamp: coreLineClamp,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              wordBreak: "break-word",
            }}
          >
            {coreText}
          </div>
        </div>
      )}

      {/* ============== 底部：出处 ============== */}
      <div
        style={{
          flex: "0 0 auto",
          padding: "0 72px 50px 72px",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "flex-start",
          gap: "24px",
        }}
      >
        {quote.source && (
          <div
            style={{
              fontSize: "24px",
              color: P.textSecondary,
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: "26px" }}>📖</span>
            <span>
              出自《{quote.source}》
              {quote.source_year ? `（${quote.source_year}）` : ""}
            </span>
          </div>
        )}
      </div>
    </div>
  );
});
