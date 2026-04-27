"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Master } from "@/lib/queries";

export function MastersClient({ masters }: { masters: Master[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase();
    if (!kw) return masters;
    return masters.filter((m) => {
      const fields = [
        m.name_cn,
        m.name_en,
        m.title,
        m.bio,
        m.category,
        m.nationality,
      ];
      return fields.some((f) => f && f.toLowerCase().includes(kw));
    });
  }, [masters, search]);

  const grouped = useMemo(() => {
    return filtered.reduce((acc, m) => {
      const cat = m.category || "其他";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(m);
      return acc;
    }, {} as Record<string, Master[]>);
  }, [filtered]);

  return (
    <>
      <div className="mb-10">
        <div className="relative max-w-xl">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索大师姓名、流派、关键词…"
            className="w-full px-5 py-3 pl-12 border text-base focus:outline-none focus:ring-2 transition-shadow"
            style={{
              background: "var(--t-bg-input)",
              borderColor: "var(--t-border)",
              color: "var(--t-text)",
              borderRadius: "var(--t-radius)",
              // @ts-expect-error css variable
              "--tw-ring-color": "var(--t-accent)",
            }}
          />
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
            style={{ color: "var(--t-text-muted)" }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {search && (
            <button
              onClick={() => setSearch("")}
              aria-label="清空搜索"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-sm"
              style={{ color: "var(--t-text-muted)" }}
            >
              ✕
            </button>
          )}
        </div>
        <p className="text-sm mt-3" style={{ color: "var(--t-text-muted)" }}>
          共 {filtered.length} 位大师
        </p>
      </div>

      {Object.entries(grouped).map(([category, categoryMasters]) => (
        <div key={category} className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-bold" style={{ color: "var(--t-text)" }}>
              {category}
            </h2>
            <span
              className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{ background: "var(--t-bg-tag)", color: "var(--t-tag-text)" }}
            >
              {categoryMasters.length} 位大师
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categoryMasters.map((master) => (
              <Link
                key={master.id}
                href={`/masters/${master.id}`}
                className="block"
              >
                <div
                  className="card-hover p-6 border h-full transition-colors duration-300"
                  style={{
                    background: "var(--t-bg-card)",
                    borderColor: "var(--t-border)",
                    borderRadius: "var(--t-radius)",
                  }}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl shrink-0 shadow-lg"
                      style={{
                        background: `linear-gradient(135deg, var(--t-avatar-from), var(--t-avatar-to))`,
                      }}
                    >
                      {master.name_cn.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold" style={{ color: "var(--t-text)" }}>
                        {master.name_cn}
                      </h3>
                      <p className="text-sm" style={{ color: "var(--t-text-muted)" }}>
                        {master.name_en}
                      </p>
                    </div>
                  </div>
                  <div className="mb-3">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: "var(--t-bg-tag)", color: "var(--t-tag-text)" }}
                    >
                      {master.title}
                    </span>
                  </div>
                  <p
                    className="text-sm line-clamp-2 leading-relaxed mb-4"
                    style={{ color: "var(--t-text-secondary)" }}
                  >
                    {master.bio}
                  </p>
                  <div
                    className="flex items-center justify-between text-xs"
                    style={{ color: "var(--t-text-muted)" }}
                  >
                    <span>
                      {master.nationality} · {master.born_year}年生
                    </span>
                    <span className="font-medium" style={{ color: "var(--t-accent)" }}>
                      {master.quote_count} 条名言
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-lg" style={{ color: "var(--t-text-secondary)" }}>
            没有找到匹配的大师
          </p>
          <p className="text-sm mt-2" style={{ color: "var(--t-text-muted)" }}>
            试试换个关键词
          </p>
        </div>
      )}
    </>
  );
}
