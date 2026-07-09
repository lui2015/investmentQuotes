"use client";

import Link from "next/link";
import { useState } from "react";
import { useFavorites } from "./FavoritesProvider";
import { ThemeSwitcher } from "./ThemeSwitcher";

const NAV_LINKS = [
  { href: "/", label: "首页" },
  { href: "/quotes", label: "名言库" },
  { href: "/api-docs", label: "贡献名言" },
  { href: "/favorites", label: "我的收藏" },
  { href: "/admin/quotes", label: "名言管理" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { count, hydrated } = useFavorites();

  return (
    <nav
      className="sticky top-0 z-50 backdrop-blur-md border-b transition-colors duration-300"
      style={{ background: "var(--t-bg-nav)", borderColor: "var(--t-border)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-2xl">💎</span>
            <span
              className="text-xl font-bold transition-colors"
              style={{ color: "var(--t-accent)" }}
            >
              投资名言
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-medium transition-colors duration-200 relative"
                style={{ color: "var(--t-text-secondary)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--t-accent)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--t-text-secondary)")}
              >
                {link.href === "/favorites" ? (
                  <span className="inline-flex items-center gap-1.5">
                    <span aria-hidden>♡</span>
                    <span>{link.label}</span>
                    {hydrated && count > 0 && (
                      <span
                        className="ml-0.5 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold rounded-full"
                        style={{ background: "var(--t-accent)", color: "var(--t-bg)" }}
                        aria-label={`已收藏 ${count} 条`}
                      >
                        {count > 99 ? "99+" : count}
                      </span>
                    )}
                  </span>
                ) : (
                  link.label
                )}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            <button
              onClick={() => setOpen(!open)}
              className="md:hidden p-2 rounded-lg transition-colors"
              style={{ color: "var(--t-text)" }}
              aria-label="切换菜单"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {open ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {open && (
          <div className="md:hidden pb-4 space-y-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between px-4 py-2.5 rounded-lg font-medium transition-colors"
                style={{ color: "var(--t-text)" }}
              >
                <span>{link.label}</span>
                {link.href === "/favorites" && hydrated && count > 0 && (
                  <span
                    className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold rounded-full"
                    style={{ background: "var(--t-accent)", color: "var(--t-bg)" }}
                  >
                    {count}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
