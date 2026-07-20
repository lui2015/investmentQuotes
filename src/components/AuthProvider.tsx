"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { withBasePath } from "@/lib/basePath";

type User = { id: string; username: string };

type AuthContextValue = {
  user: User | null;
  isLoggedIn: boolean;
  hydrated: boolean;
  modalOpen: boolean;
  openAuth: () => void;
  closeAuth: () => void;
  refresh: () => Promise<void>;
  setUser: (user: User | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth 必须在 AuthProvider 内使用");
  }
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(withBasePath("/api/auth/me"), {
        cache: "no-store",
      });
      const data = await res.json();
      setUser(data.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setHydrated(true);
    }
  }, []);

  // 内联拉取当前会话（直接写在 effect 内，避免调用外部函数触发 set-state-in-effect 规则）
  useEffect(() => {
    let cancelled = false;
    fetch(withBasePath("/api/auth/me"), { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { user: User | null }) => {
        if (!cancelled) setUser(data.user ?? null);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const openAuth = useCallback(() => setModalOpen(true), []);
  const closeAuth = useCallback(() => setModalOpen(false), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        hydrated,
        modalOpen,
        openAuth,
        closeAuth,
        refresh,
        setUser,
      }}
    >
      {children}
      {modalOpen && <AuthModal onClose={closeAuth} onSuccess={setUser} />}
    </AuthContext.Provider>
  );
}

function AuthModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (user: User | null) => void;
}) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    if (!username.trim() || !password) {
      setError("请输入用户名和密码");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        withBasePath(`/api/auth/${mode}`),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: username.trim(), password }),
        },
      );
      const data = await res.json();
      if (!res.ok || data.code !== 0) {
        setError(data.message ?? "操作失败");
        return;
      }
      onSuccess(data.user);
      setUsername("");
      setPassword("");
      onClose();
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-[var(--t-card)] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--t-text)]">
            {mode === "login" ? "登录" : "注册账号"}
          </h2>
          <button
            onClick={onClose}
            aria-label="关闭"
            className="text-[var(--t-text-2)] transition hover:text-[var(--t-text)]"
          >
            ✕
          </button>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl bg-black/20 p-1">
          <button
            onClick={() => {
              setMode("login");
              setError("");
            }}
            className={`rounded-lg py-2 text-sm font-medium transition ${
              mode === "login"
                ? "bg-[var(--t-accent)] text-white"
                : "text-[var(--t-text-2)]"
            }`}
          >
            登录
          </button>
          <button
            onClick={() => {
              setMode("register");
              setError("");
            }}
            className={`rounded-lg py-2 text-sm font-medium transition ${
              mode === "register"
                ? "bg-[var(--t-accent)] text-white"
                : "text-[var(--t-text-2)]"
            }`}
          >
            注册
          </button>
        </div>

        <label className="mb-1 block text-sm text-[var(--t-text-2)]">
          用户名
        </label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoFocus
          placeholder="3-32 位"
          className="mb-3 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-[var(--t-text)] outline-none focus:border-[var(--t-accent)]"
        />

        <label className="mb-1 block text-sm text-[var(--t-text-2)]">
          密码
        </label>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="至少 6 位"
          onKeyDown={(e) => {
            if (e.key === "Enter") void submit();
          }}
          className="mb-3 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-[var(--t-text)] outline-none focus:border-[var(--t-accent)]"
        />

        {error && (
          <p className="mb-3 text-sm text-red-400">{error}</p>
        )}

        <button
          onClick={() => void submit()}
          disabled={loading}
          className="w-full rounded-xl bg-[var(--t-accent)] py-2.5 font-medium text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "处理中…" : mode === "login" ? "登录" : "注册并登录"}
        </button>

        <p className="mt-4 text-center text-xs text-[var(--t-text-2)]">
          {mode === "login"
            ? "还没有账号？点击上方「注册」创建"
            : "注册后自动登录，收藏将保存在你的账号下"}
        </p>
      </div>
    </div>
  );
}
