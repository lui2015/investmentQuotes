"use client";

import Link from "next/link";
import { useState } from "react";
import { withBasePath } from "@/lib/basePath";

interface Master {
  id: string;
  name_cn: string;
  name_en: string;
  avatar_url: string | null;
  quote_count?: number;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
  quote_count?: number;
}

interface FilterTabsProps {
  masters: Master[];
  tags: Tag[];
}

export function FilterTabs({ masters, tags }: FilterTabsProps) {
  const [activeTab, setActiveTab] = useState<"masters" | "topics">("masters");

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
      <div
        className="rounded-2xl shadow-lg border transition-colors duration-300 overflow-hidden"
        style={{ background: "var(--t-bg-card)", borderColor: "var(--t-border)" }}
      >
        {/* Tab Headers */}
        <div className="flex border-b" style={{ borderColor: "var(--t-border)" }}>
          <button
            type="button"
            onClick={() => setActiveTab("masters")}
            className="flex-1 px-4 py-3 text-sm font-medium transition-colors cursor-pointer"
            style={{
              background: activeTab === "masters" ? "var(--t-accent-bg)" : "transparent",
              color: activeTab === "masters" ? "var(--t-accent)" : "var(--t-text-secondary)",
              borderBottom: activeTab === "masters" ? "2px solid var(--t-accent)" : "2px solid transparent",
            }}
          >
            按大师筛选
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("topics")}
            className="flex-1 px-4 py-3 text-sm font-medium transition-colors cursor-pointer"
            style={{
              background: activeTab === "topics" ? "var(--t-accent-bg)" : "transparent",
              color: activeTab === "topics" ? "var(--t-accent)" : "var(--t-text-secondary)",
              borderBottom: activeTab === "topics" ? "2px solid var(--t-accent)" : "2px solid transparent",
            }}
          >
            按主题筛选
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {activeTab === "masters" ? (
            <div className="flex flex-wrap gap-3">
              {masters.map((master) => (
                <Link
                  key={master.id}
                  href={`/masters/${master.id}`}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all hover:scale-105"
                  style={{
                    background: "var(--t-bg)",
                    borderColor: "var(--t-border)",
                    color: "var(--t-text)",
                  }}
                >
                  {master.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={withBasePath(master.avatar_url)}
                      alt={master.name_cn}
                      className="w-5 h-5 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ background: "var(--t-accent)", color: "var(--t-bg)" }}
                    >
                      {master.name_cn.charAt(0)}
                    </div>
                  )}
                  <span className="text-sm">{master.name_cn}</span>
                  <span className="text-xs" style={{ color: "var(--t-text-muted)" }}>
                    {master.quote_count}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-2">
              {tags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/topics/${tag.slug}`}
                  className="tag-pill transition-colors"
                  style={{ background: "var(--t-bg-tag)", color: "var(--t-tag-text)" }}
                >
                  {tag.name}
                  <span className="ml-1.5 text-xs" style={{ color: "var(--t-text-muted)" }}>
                    {tag.quote_count}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
