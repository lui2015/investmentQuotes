"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

export const THEMES = [
  { id: "classic", name: "经典金", icon: "💎", desc: "温暖雅致" },
  { id: "cyberpunk", name: "赛博朋克", icon: "🌃", desc: "霓虹未来" },
  { id: "ink", name: "水墨丹青", icon: "🖌️", desc: "古朴意韵" },
  { id: "minimal", name: "极简主义", icon: "◻️", desc: "纯净克制" },
  { id: "purple", name: "暗夜星辰", icon: "🔮", desc: "神秘深邃" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

const ThemeContext = createContext<{
  theme: ThemeId;
  setTheme: (t: ThemeId) => void;
}>({ theme: "classic", setTheme: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>("classic");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("iq-theme") as ThemeId | null;
    if (saved && THEMES.some((t) => t.id === saved)) {
      setThemeState(saved);
      document.documentElement.setAttribute("data-theme", saved);
    }
    setMounted(true);
  }, []);

  const setTheme = useCallback((t: ThemeId) => {
    setThemeState(t);
    localStorage.setItem("iq-theme", t);
    document.documentElement.setAttribute("data-theme", t);
  }, []);

  // Prevent flash of wrong theme
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
