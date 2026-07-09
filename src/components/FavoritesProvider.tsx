"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "iq-favorites";

type FavoritesContextValue = {
  /** 收藏的 quote id 集合（顺序 = 收藏顺序，最近在前） */
  ids: string[];
  count: number;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => boolean;
  removeFavorite: (id: string) => void;
  clear: () => void;
  /** 首次从 localStorage 读取完成，渲染前为 false，避免水合不一致 */
  hydrated: boolean;
};

const FavoritesContext = createContext<FavoritesContextValue>({
  ids: [],
  count: 0,
  isFavorite: () => false,
  toggleFavorite: () => false,
  removeFavorite: () => {},
  clear: () => {},
  hydrated: false,
});

function readFromStorage(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === "string");
  } catch {
    return [];
  }
}

function writeToStorage(ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    /* localStorage 可能因隐私模式 / 配额满而失败，忽略 */
  }
}

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // 首次挂载后从 localStorage 读取，避免 SSR/CSR 水合不一致
  useEffect(() => {
    setIds(readFromStorage());
    setHydrated(true);

    // 跨标签页同步：storage 事件触发时重新读取
    function handleStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) {
        setIds(readFromStorage());
      }
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const persist = useCallback((next: string[]) => {
    setIds(next);
    writeToStorage(next);
  }, []);

  const isFavorite = useCallback(
    (id: string) => ids.includes(id),
    [ids],
  );

  const toggleFavorite = useCallback(
    (id: string): boolean => {
      let added = false;
      setIds((prev) => {
        if (prev.includes(id)) {
          const next = prev.filter((x) => x !== id);
          writeToStorage(next);
          added = false;
          return next;
        }
        // 最新收藏放在最前
        const next = [id, ...prev];
        writeToStorage(next);
        added = true;
        return next;
      });
      return added;
    },
    [],
  );

  const removeFavorite = useCallback(
    (id: string) => {
      persist(ids.filter((x) => x !== id));
    },
    [ids, persist],
  );

  const clear = useCallback(() => persist([]), [persist]);

  return (
    <FavoritesContext.Provider
      value={{
        ids,
        count: ids.length,
        isFavorite,
        toggleFavorite,
        removeFavorite,
        clear,
        hydrated,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}
