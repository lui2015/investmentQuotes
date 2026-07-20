"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthProvider";
import { withBasePath } from "@/lib/basePath";

type FavoritesContextValue = {
  /** 收藏的 quote id 集合（顺序 = 收藏顺序，最近在前） */
  ids: string[];
  count: number;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => boolean;
  removeFavorite: (id: string) => void;
  clear: () => void;
  /** 已根据登录态加载完成（用于避免水合不一致 / 错误提示时序） */
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

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user, isLoggedIn, hydrated: authHydrated, openAuth } = useAuth();
  const [ids, setIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // 登录态变化后，从服务端加载 / 清空当前账号的收藏（所有 setState 都放在异步回调里，避免触发 set-state-in-effect 规则）
  useEffect(() => {
    if (!authHydrated) return;
    let cancelled = false;
    fetch(withBasePath("/api/favorites"), { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { code: number; ids?: string[] }) => {
        if (cancelled) return;
        if (data.code === 0 && Array.isArray(data.ids)) setIds(data.ids);
        else setIds([]);
      })
      .catch(() => {
        if (!cancelled) setIds([]);
      })
      .finally(() => {
        if (!cancelled) setHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, [user, authHydrated]);

  const isFavorite = useCallback(
    (id: string) => ids.includes(id),
    [ids],
  );

  const toggleFavorite = useCallback(
    (id: string): boolean => {
      // 未登录：拦截并提示先登录
      if (!isLoggedIn) {
        openAuth();
        return ids.includes(id);
      }
      const has = ids.includes(id);
      const next = has ? ids.filter((x) => x !== id) : [id, ...ids];
      setIds(next);
      const opts = {
        method: has ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId: id }),
      };
      fetch(withBasePath("/api/favorites"), opts).catch(() => {
        // 失败则回滚到改动前状态
        setIds(ids);
      });
      return !has;
    },
    [isLoggedIn, ids, openAuth],
  );

  const removeFavorite = useCallback(
    (id: string) => {
      if (!isLoggedIn) {
        openAuth();
        return;
      }
      setIds((prev) => prev.filter((x) => x !== id));
      fetch(withBasePath("/api/favorites"), {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId: id }),
      }).catch(() => {});
    },
    [isLoggedIn, openAuth],
  );

  const clear = useCallback(() => {
    if (!isLoggedIn) {
      openAuth();
      return;
    }
    setIds([]);
    fetch(withBasePath("/api/favorites"), {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }).catch(() => {});
  }, [isLoggedIn, openAuth]);

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
