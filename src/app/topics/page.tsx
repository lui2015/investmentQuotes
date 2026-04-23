import Link from "next/link";
import { getAllTags } from "@/lib/queries";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "主题分类 — 投资名言",
  description: "按投资思路分类浏览名言：价值投资、长期主义、风险管理、逆向思维等",
};

export const dynamic = "force-dynamic";

const tagIcons: Record<string, string> = {
  "价值投资": "💰", "长期主义": "⏳", "风险管理": "🛡️", "逆向思维": "🔄",
  "能力圈": "🎯", "市场认知": "📊", "心态修炼": "🧘", "学习成长": "📚",
  "企业分析": "🏢", "人生哲学": "🌟",
};

export default function TopicsPage() {
  const tags = getAllTags();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: "var(--t-text)" }}>主题分类</h1>
        <p className="text-lg max-w-2xl" style={{ color: "var(--t-text-secondary)" }}>
          按投资思路分类探索大师智慧，找到你最需要的投资理念
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {tags.map((tag) => (
          <Link key={tag.id} href={`/topics/${tag.slug}`} className="block">
            <div
              className="card-hover overflow-hidden border h-full transition-colors duration-300"
              style={{ background: "var(--t-bg-card)", borderColor: "var(--t-border)", borderRadius: "var(--t-radius)" }}
            >
              <div
                className="p-6"
                style={{ background: `linear-gradient(135deg, var(--t-avatar-from), var(--t-avatar-to))` }}
              >
                <span className="text-4xl">{tagIcons[tag.name] || "💬"}</span>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2" style={{ color: "var(--t-text)" }}>{tag.name}</h3>
                <p className="text-sm mb-4 leading-relaxed" style={{ color: "var(--t-text-secondary)" }}>{tag.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium" style={{ color: "var(--t-accent)" }}>{tag.quote_count} 条名言</span>
                  <span className="text-sm" style={{ color: "var(--t-text-muted)" }}>探索 →</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
