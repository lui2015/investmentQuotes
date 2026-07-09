"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useFavorites } from "./FavoritesProvider";
import { ThemeSwitcher } from "./ThemeSwitcher";

const PRIMARY_LINKS = [
  { href: "/", label: "首页" },
  { href: "/quotes", label: "名言库" },
];

const SETTINGS_LINKS = [
  { href: "/api-docs", label: "贡献名言", icon: "📝" },
  { href: "/admin/quotes", label: "名言管理", icon: "🛠️" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { count, hydrated } = useFavorites();
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

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
            {PRIMARY_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-medium transition-colors duration-200"
                style={{ color: "var(--t-text-secondary)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--t-accent)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--t-text-secondary)")}
              >
                {link.label}
              </Link>
            ))}

            <Link
              href="/favorites"
              className="font-medium transition-colors duration-200 inline-flex items-center gap-1.5"
              style={{ color: "var(--t-text-secondary)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--t-accent)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--t-text-secondary)")}
            >
              <span aria-hidden>♡</span>
              <span>我的收藏</span>
              {hydrated && count > 0 && (
                <span
                  className="ml-0.5 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold rounded-full"
                  style={{ background: "var(--t-accent)", color: "var(--t-bg)" }}
                  aria-label={`已收藏 ${count} 条`}
                >
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </Link>

            <div ref={settingsRef} className="relative">
              <button
                onClick={() => setSettingsOpen(!settingsOpen)}
                className="font-medium transition-colors duration-200 inline-flex items-center gap-1"
                style={{ color: "var(--t-text-secondary)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--t-accent)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--t-text-secondary)")}
                aria-haspopup="menu"
                aria-expanded={settingsOpen}
                aria-label="设置菜单"
              >
                <span>设置</span>
                <svg
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    settingsOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {settingsOpen && (
                <div
                  className="absolute right-0 top-full mt-3 w-48 rounded-xl p-2 shadow-2xl z-50 border"
                  style={{
                    background: "var(--t-bg-card)",
                    borderColor: "var(--t-border)",
                  }}
                  role="menu"
                >
                  {SETTINGS_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setSettingsOpen(false)}
                      role="menuitem"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200"
                      style={{ color: "var(--t-text-secondary)" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--t-bg-tag)";
                        e.currentTarget.style.color = "var(--t-accent)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "var(--t-text-secondary)";
                      }}
                    >
                      <span aria-hidden>{link.icon}</span>
                      <span>{link.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
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
            {PRIMARY_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block px-4 py-2.5 rounded-lg font-medium transition-colors"
                style={{ color: "var(--t-text)" }}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/favorites"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between px-4 py-2.5 rounded-lg font-medium transition-colors"
              style={{ color: "var(--t-text)" }}
            >
              <span>
                <span aria-hidden>♡</span> 我的收藏
              </span>
              {hydrated && count > 0 && (
                <span
                  className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold rounded-full"
                  style={{ background: "var(--t-accent)", color: "var(--t-bg)" }}
                >
                  {count}
                </span>
              )}
            </Link>
            <div className="pt-2 mt-2 border-t" style={{ borderColor: "var(--t-border)" }}>
              <div
                className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--t-text-muted)" }}
              >
                设置
              </div>
              {SETTINGS_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors"
                  style={{ color: "var(--t-text)" }}
                >
                  <span aria-hidden>{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
