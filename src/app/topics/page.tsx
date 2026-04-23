import Link from "next/link";
import { getAllTags } from "@/lib/queries";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "主题分类 — 投资名言",
  description: "按投资思路分类浏览名言：价值投资、长期主义、风险管理、逆向思维等",
};

export const dynamic = "force-dynamic";

const tagIcons: Record<string, string> = {
  "价值投资": "💰",
  "长期主义": "⏳",
  "风险管理": "🛡️",
  "逆向思维": "🔄",
  "能力圈": "🎯",
  "市场认知": "📊",
  "心态修炼": "🧘",
  "学习成长": "📚",
  "企业分析": "🏢",
  "人生哲学": "🌟",
};

const tagGradients: Record<string, string> = {
  "价值投资": "from-blue-500 to-blue-600",
  "长期主义": "from-green-500 to-emerald-600",
  "风险管理": "from-red-500 to-rose-600",
  "逆向思维": "from-purple-500 to-violet-600",
  "能力圈": "from-amber-500 to-orange-600",
  "市场认知": "from-cyan-500 to-teal-600",
  "心态修炼": "from-indigo-500 to-blue-600",
  "学习成长": "from-emerald-500 to-green-600",
  "企业分析": "from-slate-500 to-gray-600",
  "人生哲学": "from-pink-500 to-rose-600",
};

export default function TopicsPage() {
  const tags = getAllTags();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-stone-800 dark:text-stone-200 mb-4">
          主题分类
        </h1>
        <p className="text-stone-500 dark:text-stone-400 text-lg max-w-2xl">
          按投资思路分类探索大师智慧，找到你最需要的投资理念
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {tags.map((tag) => (
          <Link key={tag.id} href={`/topics/${tag.slug}`} className="block">
            <div className="card-hover bg-white dark:bg-stone-900 rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800 h-full">
              <div className={`bg-gradient-to-r ${tagGradients[tag.name] || "from-amber-500 to-orange-600"} p-6`}>
                <span className="text-4xl">{tagIcons[tag.name] || "💬"}</span>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-stone-800 dark:text-stone-200 mb-2">
                  {tag.name}
                </h3>
                <p className="text-stone-500 dark:text-stone-400 text-sm mb-4 leading-relaxed">
                  {tag.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-amber-700 dark:text-amber-400 font-medium">
                    {tag.quote_count} 条名言
                  </span>
                  <span className="text-sm text-stone-400">探索 →</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
