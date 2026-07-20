"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { withBasePath } from "@/lib/basePath";
import { useFavorites } from "./FavoritesProvider";
import { useAuth } from "./AuthProvider";
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
  const { isLoggedIn, openAuth, user, setUser } = useAuth();
  const settingsRef = useRef<HTMLDivElement>(null);

  const handleFavoritesClick = (e: ReactMouseEvent) => {
    if (!isLoggedIn) {
      e.preventDefault();
      openAuth();
    }
  };

  const handleLogout = async () => {
    setSettingsOpen(false);
    try {
      await fetch(withBasePath("/api/auth/logout"), { method: "POST" });
    } catch {
      /* 忽略网络错误，本地仍视为已退出 */
    }
    setUser(null);
  };

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
        <div className="flex items-center justify-between h-16 sm:h-20">
          <Link href="/" className="flex items-center group" aria-label="投资名言">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={withBasePath("/logo.png")}
              alt="投资名言"
              className="h-12 sm:h-16 w-auto object-contain"
            />
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
              onClick={handleFavoritesClick}
              className="font-medium transition-colors duration-200 inline-flex items-center gap-1.5"
              style={{ color: "var(--t-text-secondary)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--t-accent)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--t-text-secondary)")}
            >
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

          </div>

          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            <div ref={settingsRef} className="relative">
              <button
                onClick={() => setSettingsOpen(!settingsOpen)}
                className="p-2 rounded-lg transition-colors duration-200 inline-flex items-center justify-center"
                style={{ color: "var(--t-text-secondary)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--t-accent)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--t-text-secondary)")}
                aria-haspopup="menu"
                aria-expanded={settingsOpen}
                aria-label="设置"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
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

                  {isLoggedIn ? (
                    <button
                      onClick={() => void handleLogout()}
                      role="menuitem"
                      className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200"
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
                      <span aria-hidden>🚪</span>
                      <span>退出登录{user ? `（${user.username}）` : ""}</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setSettingsOpen(false);
                        openAuth();
                      }}
                      role="menuitem"
                      className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200"
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
                      <span aria-hidden>🔑</span>
                      <span>登录 / 注册</span>
                    </button>
                  )}
                </div>
              )}
            </div>
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
              onClick={(e) => {
                handleFavoritesClick(e);
                setOpen(false);
              }}
              className="flex items-center justify-between px-4 py-2.5 rounded-lg font-medium transition-colors"
              style={{ color: "var(--t-text)" }}
            >
              <span>
                <span>我的收藏</span>
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
          </div>
        )}
      </div>
    </nav>
  );
}
