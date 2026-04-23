import Link from "next/link";
import { getAllMasters } from "@/lib/queries";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "投资大师 — 投资名言",
  description: "浏览巴菲特、芒格、格雷厄姆等投资大师的名言合集",
};

export const dynamic = "force-dynamic";

export default function MastersPage() {
  const masters = getAllMasters();

  const grouped = masters.reduce((acc, m) => {
    const cat = m.category || "其他";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(m);
    return acc;
  }, {} as Record<string, typeof masters>);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: "var(--t-text)" }}>
          投资大师
        </h1>
        <p className="text-lg max-w-2xl" style={{ color: "var(--t-text-secondary)" }}>
          跨越时空的投资智慧，从他们的思想中汲取力量
        </p>
      </div>

      {Object.entries(grouped).map(([category, categoryMasters]) => (
        <div key={category} className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-bold" style={{ color: "var(--t-text)" }}>{category}</h2>
            <span
              className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{ background: "var(--t-bg-tag)", color: "var(--t-tag-text)" }}
            >
              {categoryMasters.length} 位大师
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categoryMasters.map((master) => (
              <Link key={master.id} href={`/masters/${master.id}`} className="block">
                <div
                  className="card-hover p-6 border h-full transition-colors duration-300"
                  style={{ background: "var(--t-bg-card)", borderColor: "var(--t-border)", borderRadius: "var(--t-radius)" }}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl shrink-0 shadow-lg"
                      style={{ background: `linear-gradient(135deg, var(--t-avatar-from), var(--t-avatar-to))` }}
                    >
                      {master.name_cn.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold" style={{ color: "var(--t-text)" }}>{master.name_cn}</h3>
                      <p className="text-sm" style={{ color: "var(--t-text-muted)" }}>{master.name_en}</p>
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
                  <p className="text-sm line-clamp-2 leading-relaxed mb-4" style={{ color: "var(--t-text-secondary)" }}>
                    {master.bio}
                  </p>
                  <div className="flex items-center justify-between text-xs" style={{ color: "var(--t-text-muted)" }}>
                    <span>{master.nationality} · {master.born_year}年生</span>
                    <span className="font-medium" style={{ color: "var(--t-accent)" }}>{master.quote_count} 条名言</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
