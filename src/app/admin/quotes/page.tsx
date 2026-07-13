"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { withBasePath } from "@/lib/basePath";
import type { Interpretation, Quote } from "@/lib/queries";

interface ListResponse {
  items: Quote[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface MasterOption {
  id: string;
  name_cn: string;
  name_en: string;
  title: string;
}

type ToastKind = "success" | "error" | "info";
interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

export default function AdminQuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [masterId, setMasterId] = useState("");
  const [masters, setMasters] = useState<MasterOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Quote | null>(null);
  const [deleting, setDeleting] = useState<Quote | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);
  const exportingRef = useRef(false);

  const pushToast = useCallback((kind: ToastKind, message: string) => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, kind, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const handleExport = useCallback(async () => {
    if (exportingRef.current) return;
    exportingRef.current = true;
    pushToast("info", "正在生成 Excel…");
    try {
      // 通过 fetch 获取 blob，再本地触发下载，避免代理返回 HTML
      const res = await fetch(withBasePath("/api/admin/quotes?export=xlsx"));
      if (!res.ok) {
        pushToast("error", `导出失败 (${res.status})`);
        return;
      }
      const ct = res.headers.get("content-type") ?? "";
      if (!ct.includes("spreadsheetml")) {
        pushToast("error", "导出失败：返回内容不是 Excel");
        return;
      }
      const blob = await res.blob();
      // 从响应头解析文件名，缺省则用日期
      const disposition = res.headers.get("content-disposition") ?? "";
      const match = disposition.match(/filename=([^;]+)/);
      const filename = match
        ? match[1].trim().replace(/["']/g, "")
        : `quotes_${new Date().toISOString().slice(0, 10).replace(/-/g, "")}.xlsx`;

      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
      pushToast("success", "已开始下载");
    } catch {
      pushToast("error", "导出失败");
    } finally {
      exportingRef.current = false;
    }
  }, [pushToast]);

  const loadMasters = useCallback(async () => {
    try {
      const res = await fetch(withBasePath("/api/admin/masters"));
      if (!res.ok) return;
      const data = (await res.json()) as MasterOption[];
      setMasters(data);
    } catch {
      /* ignore */
    }
  }, []);

  const loadQuotes = useCallback(
    async (pageToLoad: number) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(pageToLoad));
        params.set("pageSize", String(pageSize));
        if (search.trim()) params.set("search", search.trim());
        if (masterId) params.set("masterId", masterId);

        const res = await fetch(withBasePath(`/api/admin/quotes?${params.toString()}`));
        if (!res.ok) {
          pushToast("error", `加载失败 (${res.status})`);
          return;
        }
        const data = (await res.json()) as ListResponse;
        setQuotes(data.items);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        setPage(data.page);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        pushToast("error", `加载失败：${message}`);
      } finally {
        setLoading(false);
      }
    },
    [search, masterId, pushToast],
  );

  useEffect(() => {
    loadMasters();
  }, [loadMasters]);

  useEffect(() => {
    loadQuotes(1);
  }, [loadQuotes]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearch("");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
      <header className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span
              className="inline-flex items-center justify-center w-8 h-8 rounded-full text-base"
              style={{ background: "var(--t-accent)", color: "var(--t-bg)" }}
              aria-hidden
            >
              📝
            </span>
            <h1
              className="text-2xl md:text-3xl font-bold tracking-tight"
              style={{ color: "var(--t-text)" }}
            >
              名言管理
            </h1>
          </div>
          <p className="text-sm" style={{ color: "var(--t-text-secondary)" }}>
            编辑或删除现有名言。共 <strong>{total}</strong> 条记录。
          </p>
          <button
            onClick={handleExport}
            className="px-4 py-2 text-sm font-medium rounded-md transition-all hover:opacity-90"
            style={{ background: "var(--t-accent)", color: "var(--t-bg)" }}
          >
            📥 一键导出 Excel
          </button>
        </div>
      </header>

      <div
        className="p-4 md:p-5 border mb-6 flex flex-col md:flex-row gap-3"
        style={{ background: "var(--t-bg-card)", borderColor: "var(--t-border)", borderRadius: "var(--t-radius)" }}
      >
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="搜索中文 / 英文 / 大师名…"
            className="flex-1 px-3 py-2 rounded-md border text-sm outline-none focus:ring-2 transition-all"
            style={{
              background: "var(--t-bg)",
              color: "var(--t-text)",
              borderColor: "var(--t-border)",
            }}
          />
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium rounded-md transition-all hover:opacity-90"
            style={{ background: "var(--t-accent)", color: "var(--t-bg)" }}
          >
            搜索
          </button>
          {search && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="px-3 py-2 text-sm rounded-md transition-colors"
              style={{ background: "var(--t-bg-tag)", color: "var(--t-text)" }}
              title="清除搜索"
            >
              ✕
            </button>
          )}
        </form>
        <select
          value={masterId}
          onChange={(e) => setMasterId(e.target.value)}
          className="md:w-56 px-3 py-2 rounded-md border text-sm outline-none focus:ring-2 transition-all"
          style={{
            background: "var(--t-bg)",
            color: "var(--t-text)",
            borderColor: "var(--t-border)",
          }}
        >
          <option value="">全部大师</option>
          {masters.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name_cn}
            </option>
          ))}
        </select>
      </div>

      <div
        className="border overflow-hidden"
        style={{ background: "var(--t-bg-card)", borderColor: "var(--t-border)", borderRadius: "var(--t-radius)" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead style={{ background: "var(--t-bg-tag)" }}>
              <tr>
                <Th className="w-[40%]">名言内容</Th>
                <Th>大师</Th>
                <Th>来源 / 年份</Th>
                <Th className="text-center">推荐</Th>
                <Th className="text-right">操作</Th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-12"
                    style={{ color: "var(--t-text-muted)" }}
                  >
                    加载中…
                  </td>
                </tr>
              )}
              {!loading && quotes.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-12"
                    style={{ color: "var(--t-text-muted)" }}
                  >
                    没有匹配的名言
                  </td>
                </tr>
              )}
              {!loading &&
                quotes.map((q) => (
                  <tr
                    key={q.id}
                    className="border-t transition-colors"
                    style={{ borderColor: "var(--t-border)" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "var(--t-bg-tag)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <Td>
                      <p className="line-clamp-2" style={{ color: "var(--t-text)" }}>
                        {q.content_cn}
                      </p>
                      {q.content_en && (
                        <p
                          className="text-xs mt-1 line-clamp-1 italic"
                          style={{ color: "var(--t-text-muted)" }}
                        >
                          {q.content_en}
                        </p>
                      )}
                    </Td>
                    <Td>
                      <span style={{ color: "var(--t-text)" }}>{q.master_name_cn}</span>
                      {q.master_name_en && (
                        <span
                          className="block text-xs"
                          style={{ color: "var(--t-text-muted)" }}
                        >
                          {q.master_name_en}
                        </span>
                      )}
                    </Td>
                    <Td>
                      <span style={{ color: "var(--t-text-secondary)" }}>
                        {q.source || "—"}
                        {q.source_year ? ` · ${q.source_year}` : ""}
                      </span>
                    </Td>
                    <Td className="text-center">
                      {q.is_featured ? (
                        <span
                          className="inline-block w-2 h-2 rounded-full"
                          style={{ background: "var(--t-accent)" }}
                          title="推荐"
                          aria-label="推荐"
                        />
                      ) : (
                        <span
                          className="inline-block w-2 h-2 rounded-full opacity-30"
                          style={{ background: "var(--t-text-muted)" }}
                          title="非推荐"
                          aria-label="非推荐"
                        />
                      )}
                    </Td>
                    <Td className="text-right whitespace-nowrap">
                      <button
                        onClick={() => setEditing(q)}
                        className="px-3 py-1.5 text-xs font-medium rounded-md mr-2 transition-colors hover:opacity-90"
                        style={{ background: "var(--t-bg-tag)", color: "var(--t-text)" }}
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => setDeleting(q)}
                        className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors hover:opacity-90"
                        style={{ background: "#fee2e2", color: "#b91c1c" }}
                      >
                        删除
                      </button>
                    </Td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-4 border-t text-sm"
          style={{ borderColor: "var(--t-border)" }}
        >
          <span style={{ color: "var(--t-text-muted)" }}>
            第 {page} / {totalPages} 页 · 共 {total} 条
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => loadQuotes(page - 1)}
              disabled={page <= 1 || loading}
              className="px-3 py-1.5 text-xs font-medium rounded-md transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "var(--t-bg-tag)", color: "var(--t-text)" }}
            >
              ← 上一页
            </button>
            <button
              onClick={() => loadQuotes(page + 1)}
              disabled={page >= totalPages || loading}
              className="px-3 py-1.5 text-xs font-medium rounded-md transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "var(--t-bg-tag)", color: "var(--t-text)" }}
            >
              下一页 →
            </button>
          </div>
        </div>
      </div>

      {editing && (
        <EditModal
          quote={editing}
          masters={masters}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            loadQuotes(page);
            pushToast("success", "已保存");
          }}
          onError={(msg) => pushToast("error", msg)}
        />
      )}

      {deleting && (
        <ConfirmDeleteModal
          quote={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={() => {
            setDeleting(null);
            loadQuotes(page);
            pushToast("success", "已删除");
          }}
          onError={(msg) => pushToast("error", msg)}
        />
      )}

      <ToastStack toasts={toasts} />
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${className}`}
      style={{ color: "var(--t-text-secondary)" }}
    >
      {children}
    </th>
  );
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={`px-4 py-3 align-top ${className}`} style={{ color: "var(--t-text)" }}>
      {children}
    </td>
  );
}

interface EditModalProps {
  quote: Quote;
  masters: MasterOption[];
  onClose: () => void;
  onSaved: () => void;
  onError: (msg: string) => void;
}

function EditModal({ quote, masters, onClose, onSaved, onError }: EditModalProps) {
  const [contentCn, setContentCn] = useState(quote.content_cn);
  const [contentEn, setContentEn] = useState(quote.content_en ?? "");
  const [masterId, setMasterId] = useState(quote.master_id);
  const [source, setSource] = useState(quote.source ?? "");
  const [sourceYear, setSourceYear] = useState<string>(
    quote.source_year ? String(quote.source_year) : "",
  );
  const [isFeatured, setIsFeatured] = useState(quote.is_featured === 1);
  // 解读 4 块
  const [core, setCore] = useState("");
  const [practice, setPractice] = useState<string[]>(["", "", "", ""]);
  const [story, setStory] = useState("");
  const [masterView, setMasterView] = useState("");
  const [interpLoading, setInterpLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  // 打开弹窗时拉取现有解读
  useEffect(() => {
    let cancelled = false;
    setInterpLoading(true);
    (async () => {
      try {
        const res = await fetch(withBasePath(`/api/admin/quotes/${quote.id}`));
        if (!res.ok) return;
        const data = (await res.json()) as {
          interpretation: Interpretation | null;
        };
        if (cancelled) return;
        const ip = data.interpretation;
        if (ip) {
          setCore(ip.core ?? "");
          const arr = (ip.practice ?? []).slice(0, 10);
          // 补齐到 4 条以便编辑
          while (arr.length < 4) arr.push("");
          setPractice(arr);
          setStory(ip.story ?? "");
          setMasterView(ip.master_view ?? "");
        } else {
          setCore("");
          setPractice(["", "", "", ""]);
          setStory("");
          setMasterView("");
        }
      } catch {
        /* 静默失败，留空让用户填写 */
      } finally {
        if (!cancelled) setInterpLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [quote.id]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contentCn.trim()) {
      onError("中文内容不能为空");
      return;
    }
    if (contentEn.trim().length > 1000) {
      onError("英文内容过长");
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        content_cn: contentCn.trim(),
        master_id: masterId,
        is_featured: isFeatured ? 1 : 0,
      };
      body.content_en = contentEn.trim() ? contentEn.trim() : null;
      body.source = source.trim() ? source.trim() : null;
      body.source_year = sourceYear.trim() ? Number(sourceYear) : null;

      // 解读 patch：过滤空条目后仅当至少有一项非空才发送
      const cleanPractice = practice
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      const hasInterp =
        core.trim().length > 0 ||
        cleanPractice.length > 0 ||
        story.trim().length > 0 ||
        masterView.trim().length > 0;
      if (hasInterp) {
        body.interpretation = {
          core: core.trim(),
          practice: cleanPractice,
          story: story.trim(),
          master_view: masterView.trim() ? masterView.trim() : null,
        };
      }

      const res = await fetch(withBasePath(`/api/admin/quotes/${quote.id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        onError(data.error || `保存失败 (${res.status})`);
        return;
      }
      onSaved();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      onError(`保存失败：${message}`);
    } finally {
      setSaving(false);
    }
  };

  const updatePractice = (idx: number, value: string) => {
    setPractice((prev) => prev.map((v, i) => (i === idx ? value : v)));
  };
  const addPractice = () => {
    setPractice((prev) => (prev.length >= 10 ? prev : [...prev, ""]));
  };
  const removePractice = (idx: number) => {
    setPractice((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0, 0, 0, 0.5)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto border"
        style={{ background: "var(--t-bg-card)", borderColor: "var(--t-border)", borderRadius: "var(--t-radius)" }}
        role="dialog"
        aria-modal="true"
      >
        <div
          className="px-6 py-4 border-b flex items-center justify-between"
          style={{ borderColor: "var(--t-border)" }}
        >
          <h2 className="text-lg font-bold" style={{ color: "var(--t-text)" }}>
            编辑名言
          </h2>
          <button
            onClick={onClose}
            className="text-2xl leading-none transition-opacity hover:opacity-70"
            style={{ color: "var(--t-text-muted)" }}
            aria-label="关闭"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Field label="中文内容" required>
            <textarea
              value={contentCn}
              onChange={(e) => setContentCn(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-md border text-sm outline-none focus:ring-2 transition-all resize-y"
              style={{ background: "var(--t-bg)", color: "var(--t-text)", borderColor: "var(--t-border)" }}
              required
            />
          </Field>

          <Field label="英文内容">
            <textarea
              value={contentEn}
              onChange={(e) => setContentEn(e.target.value)}
              rows={2}
              placeholder="可选"
              className="w-full px-3 py-2 rounded-md border text-sm outline-none focus:ring-2 transition-all resize-y"
              style={{ background: "var(--t-bg)", color: "var(--t-text)", borderColor: "var(--t-border)" }}
            />
          </Field>

          <Field label="所属大师" required>
            <select
              value={masterId}
              onChange={(e) => setMasterId(e.target.value)}
              className="w-full px-3 py-2 rounded-md border text-sm outline-none focus:ring-2 transition-all"
              style={{ background: "var(--t-bg)", color: "var(--t-text)", borderColor: "var(--t-border)" }}
              required
            >
              {masters.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name_cn}（{m.name_en}）
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="来源">
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="书名 / 演讲 / 访谈…"
                className="w-full px-3 py-2 rounded-md border text-sm outline-none focus:ring-2 transition-all"
                style={{ background: "var(--t-bg)", color: "var(--t-text)", borderColor: "var(--t-border)" }}
              />
            </Field>
            <Field label="年份">
              <input
                type="number"
                value={sourceYear}
                onChange={(e) => setSourceYear(e.target.value)}
                min={0}
                max={9999}
                placeholder="可选"
                className="w-full px-3 py-2 rounded-md border text-sm outline-none focus:ring-2 transition-all"
                style={{ background: "var(--t-bg)", color: "var(--t-text)", borderColor: "var(--t-border)" }}
              />
            </Field>
          </div>

          {/* ============== 解读信息（4 块） ============== */}
          <div
            className="pt-4 border-t"
            style={{ borderColor: "var(--t-border)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3
                  className="text-sm font-bold flex items-center gap-2"
                  style={{ color: "var(--t-text)" }}
                >
                  <span aria-hidden>💡</span>
                  解读信息
                </h3>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "var(--t-text-muted)" }}
                >
                  保存后会在名言详情页和导出海报中显示
                </p>
              </div>
              {interpLoading && (
                <span
                  className="text-xs"
                  style={{ color: "var(--t-text-muted)" }}
                >
                  加载中…
                </span>
              )}
            </div>

            <div className="space-y-4">
              <Field label="核心解读" required={false}>
                <textarea
                  value={core}
                  onChange={(e) => setCore(e.target.value)}
                  rows={3}
                  placeholder="这句话究竟在说什么（3-5 句，说人话）"
                  className="w-full px-3 py-2 rounded-md border text-sm outline-none focus:ring-2 transition-all resize-y"
                  style={{ background: "var(--t-bg)", color: "var(--t-text)", borderColor: "var(--t-border)" }}
                />
              </Field>

              <div>
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: "var(--t-text-secondary)" }}
                >
                  应用实操（4-5 条行动清单）
                </label>
                <div className="space-y-2">
                  {practice.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span
                        className="shrink-0 mt-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ background: "var(--t-accent)" }}
                      >
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => updatePractice(idx, e.target.value)}
                        placeholder={`第 ${idx + 1} 条行动建议`}
                        className="flex-1 px-3 py-1.5 rounded-md border text-sm outline-none focus:ring-2 transition-all"
                        style={{
                          background: "var(--t-bg)",
                          color: "var(--t-text)",
                          borderColor: "var(--t-border)",
                        }}
                      />
                      {practice.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePractice(idx)}
                          className="shrink-0 px-2 py-1.5 text-xs rounded-md transition-colors"
                          style={{
                            background: "var(--t-bg-tag)",
                            color: "var(--t-text-muted)",
                          }}
                          title="删除这一条"
                          aria-label={`删除第 ${idx + 1} 条`}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {practice.length < 10 && (
                  <button
                    type="button"
                    onClick={addPractice}
                    className="mt-2 px-3 py-1.5 text-xs rounded-md transition-colors"
                    style={{
                      background: "var(--t-bg-tag)",
                      color: "var(--t-text)",
                    }}
                  >
                    + 添加一条
                  </button>
                )}
              </div>

              <Field label="生动案例" required={false}>
                <textarea
                  value={story}
                  onChange={(e) => setStory(e.target.value)}
                  rows={4}
                  placeholder="一个真实故事 / 场景化情节（1-2 段）"
                  className="w-full px-3 py-2 rounded-md border text-sm outline-none focus:ring-2 transition-all resize-y"
                  style={{ background: "var(--t-bg)", color: "var(--t-text)", borderColor: "var(--t-border)" }}
                />
              </Field>

              <Field label="大师视角（可选）" required={false}>
                <textarea
                  value={masterView}
                  onChange={(e) => setMasterView(e.target.value)}
                  rows={2}
                  placeholder="这句话在该大师思想体系里的位置"
                  className="w-full px-3 py-2 rounded-md border text-sm outline-none focus:ring-2 transition-all resize-y"
                  style={{ background: "var(--t-bg)", color: "var(--t-text)", borderColor: "var(--t-border)" }}
                />
              </Field>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="w-4 h-4 cursor-pointer"
            />
            <span style={{ color: "var(--t-text)" }}>设为推荐名言（首页展示）</span>
          </label>

          <div
            className="flex items-center justify-end gap-2 pt-4 border-t"
            style={{ borderColor: "var(--t-border)" }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50"
              style={{ background: "var(--t-bg-tag)", color: "var(--t-text)" }}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium rounded-md transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "var(--t-accent)", color: "var(--t-bg)" }}
            >
              {saving ? "保存中…" : "保存"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        className="block text-xs font-medium mb-1.5"
        style={{ color: "var(--t-text-secondary)" }}
      >
        {label}
        {required && <span style={{ color: "var(--t-accent)" }}> *</span>}
      </label>
      {children}
    </div>
  );
}

interface ConfirmDeleteModalProps {
  quote: Quote;
  onClose: () => void;
  onDeleted: () => void;
  onError: (msg: string) => void;
}

function ConfirmDeleteModal({ quote, onClose, onDeleted, onError }: ConfirmDeleteModalProps) {
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(withBasePath(`/api/admin/quotes/${quote.id}`), {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        onError(data.error || `删除失败 (${res.status})`);
        setDeleting(false);
        return;
      }
      onDeleted();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      onError(`删除失败：${message}`);
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0, 0, 0, 0.5)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-md border"
        style={{ background: "var(--t-bg-card)", borderColor: "var(--t-border)", borderRadius: "var(--t-radius)" }}
        role="dialog"
        aria-modal="true"
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl" aria-hidden>⚠️</span>
            <h2 className="text-lg font-bold" style={{ color: "var(--t-text)" }}>
              确认删除？
            </h2>
          </div>
          <p className="text-sm mb-4" style={{ color: "var(--t-text-secondary)" }}>
            此操作将永久删除该名言及其标签关联，<strong>不可恢复</strong>。
          </p>
          <div
            className="p-3 rounded-md text-sm"
            style={{ background: "var(--t-bg-tag)", color: "var(--t-text)" }}
          >
            {quote.content_cn}
            {quote.content_en && (
              <span
                className="block mt-1 italic text-xs"
                style={{ color: "var(--t-text-muted)" }}
              >
                {quote.content_en}
              </span>
            )}
            <span
              className="block mt-2 text-xs"
              style={{ color: "var(--t-text-muted)" }}
            >
              — {quote.master_name_cn}
            </span>
          </div>
        </div>
        <div
          className="flex items-center justify-end gap-2 px-6 py-3 border-t"
          style={{ borderColor: "var(--t-border)" }}
        >
          <button
            onClick={onClose}
            disabled={deleting}
            className="px-4 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50"
            style={{ background: "var(--t-bg-tag)", color: "var(--t-text)" }}
          >
            取消
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 text-sm font-medium rounded-md transition-all disabled:opacity-50"
            style={{ background: "#dc2626", color: "#fff" }}
          >
            {deleting ? "删除中…" : "确认删除"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ToastStack({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="px-4 py-3 rounded-md text-sm font-medium shadow-lg pointer-events-auto border animate-fade-in"
          style={{
            background:
              t.kind === "success"
                ? "#10b981"
                : t.kind === "error"
                ? "#ef4444"
                : "var(--t-bg-card)",
            color: t.kind === "info" ? "var(--t-text)" : "#fff",
            borderColor: t.kind === "info" ? "var(--t-border)" : "transparent",
            minWidth: 240,
          }}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
