"use client";

import { useState } from "react";
import { useFavorites } from "./FavoritesProvider";
import { useAuth } from "./AuthProvider";

type Variant = "primary" | "compact";

export function FavoriteButton({
  quoteId,
  variant = "primary",
}: {
  quoteId: string;
  variant?: Variant;
}) {
  const { isFavorite, toggleFavorite, hydrated } = useFavorites();
  const { isLoggedIn, openAuth } = useAuth();
  // 收藏状态直接由上下文派生（ids 更新即同步反映），无需额外 effect
  const active = hydrated ? isFavorite(quoteId) : false;
  const [pulse, setPulse] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // 未登录：拦截并提示先登录，不触发收藏动画
    if (!isLoggedIn) {
      openAuth();
      return;
    }
    toggleFavorite(quoteId);
    setPulse(true);
    setTimeout(() => setPulse(false), 400);
  };

  const isCompact = variant === "compact";

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={active}
      aria-label={active ? "取消收藏" : "收藏"}
      title={active ? "已收藏 · 点击取消" : "收藏"}
      className={
        isCompact
          ? "inline-flex items-center justify-center w-9 h-9 transition-all hover:scale-110"
          : "inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium whitespace-nowrap shrink-0 transition-all hover:scale-105"
      }
      style={{
        background: active ? "var(--t-accent-bg)" : "var(--t-bg-tag)",
        color: active ? "var(--t-accent)" : "var(--t-text)",
        borderRadius: "var(--t-radius)",
        border: active ? "1px solid var(--t-accent)" : "1px solid transparent",
      }}
    >
      <svg
        className={isCompact ? "w-5 h-5" : "w-4 h-4"}
        viewBox="0 0 24 24"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={2}
        style={{
          transition: "transform 0.3s ease",
          transform: pulse ? "scale(1.3)" : "scale(1)",
        }}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
        />
      </svg>
      {!isCompact && (
        <span>{active ? "已收藏" : "收藏"}</span>
      )}
    </button>
  );
}
