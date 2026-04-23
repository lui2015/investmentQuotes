import Link from "next/link";
import { getAllMasters } from "@/lib/queries";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "投资大师 — 投资名言",
  description: "浏览巴菲特、芒格、格雷厄姆等投资大师的名言合集",
};

export const dynamic = "force-dynamic";

const categoryColors: Record<string, string> = {
  "价值投资": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  "成长投资": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  "宏观对冲": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  "指数投资": "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
  "交易投机": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  "风险管理": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
};

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
        <h1 className="text-3xl md:text-4xl font-bold text-stone-800 dark:text-stone-200 mb-4">
          投资大师
        </h1>
        <p className="text-stone-500 dark:text-stone-400 text-lg max-w-2xl">
          跨越时空的投资智慧，从他们的思想中汲取力量
        </p>
      </div>

      {Object.entries(grouped).map(([category, categoryMasters]) => (
        <div key={category} className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-bold text-stone-700 dark:text-stone-300">{category}</h2>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${categoryColors[category] || "bg-stone-100 text-stone-600"}`}>
              {categoryMasters.length} 位大师
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categoryMasters.map((master) => (
              <Link key={master.id} href={`/masters/${master.id}`} className="block">
                <div className="card-hover bg-white dark:bg-stone-900 rounded-2xl p-6 border border-stone-200 dark:border-stone-800 h-full">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-xl shrink-0 shadow-lg shadow-amber-500/20">
                      {master.name_cn.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-stone-800 dark:text-stone-200">{master.name_cn}</h3>
                      <p className="text-sm text-stone-400">{master.name_en}</p>
                    </div>
                  </div>
                  <div className="mb-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 font-medium">
                      {master.title}
                    </span>
                  </div>
                  <p className="text-sm text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed mb-4">
                    {master.bio}
                  </p>
                  <div className="flex items-center justify-between text-xs text-stone-400">
                    <span>{master.nationality} · {master.born_year}年生</span>
                    <span className="font-medium text-amber-700 dark:text-amber-400">{master.quote_count} 条名言</span>
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
