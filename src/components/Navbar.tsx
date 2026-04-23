"use client";

import Link from "next/link";
import { useState } from "react";
import { ThemeSwitcher } from "./ThemeSwitcher";

export function Navbar() {
  const [open, setOpen] = useState(false);

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
            {[
              { href: "/", label: "首页" },
              { href: "/masters", label: "投资大师" },
              { href: "/topics", label: "主题分类" },
              { href: "/quotes", label: "名言库" },
            ].map((link) => (
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
          </div>

          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            <button
              onClick={() => setOpen(!open)}
              className="md:hidden p-2 rounded-lg transition-colors"
              style={{ color: "var(--t-text)" }}
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
            {[
              { href: "/", label: "首页" },
              { href: "/masters", label: "投资大师" },
              { href: "/topics", label: "主题分类" },
              { href: "/quotes", label: "名言库" },
            ].map((link) => (
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
          </div>
        )}
      </div>
    </nav>
  );
}
