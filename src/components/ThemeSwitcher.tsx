"use client";

import { useState, useRef, useEffect } from "react";
import { useTheme, THEMES } from "./ThemeProvider";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const current = THEMES.find((t) => t.id === theme) || THEMES[0];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
        style={{
          background: "var(--t-bg-tag)",
          color: "var(--t-accent-text)",
        }}
        title="切换主题风格"
      >
        <span>{current.icon}</span>
        <span className="hidden sm:inline">{current.name}</span>
        <svg className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-52 rounded-xl p-2 shadow-2xl z-50 border animate-in fade-in slide-in-from-top-2 duration-200"
          style={{
            background: "var(--t-bg-card)",
            borderColor: "var(--t-border)",
          }}
        >
          <div className="px-2 py-1.5 text-xs font-medium" style={{ color: "var(--t-text-muted)" }}>
            选择风格
          </div>
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => { setTheme(t.id); setOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 group"
              style={{
                background: theme === t.id ? "var(--t-accent-bg)" : "transparent",
                color: theme === t.id ? "var(--t-accent-text)" : "var(--t-text-secondary)",
              }}
              onMouseEnter={(e) => {
                if (theme !== t.id) e.currentTarget.style.background = "var(--t-bg-tag)";
              }}
              onMouseLeave={(e) => {
                if (theme !== t.id) e.currentTarget.style.background = "transparent";
              }}
            >
              <span className="text-xl w-7 text-center">{t.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{t.name}</div>
                <div className="text-xs" style={{ color: "var(--t-text-muted)" }}>{t.desc}</div>
              </div>
              {theme === t.id && (
                <svg className="w-4 h-4 shrink-0" style={{ color: "var(--t-accent)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
