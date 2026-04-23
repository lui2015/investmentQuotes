import Link from "next/link";
import { getDailyQuote, getFeaturedQuotes, getLatestQuotes, getPopularQuotes, getAllTags } from "@/lib/queries";
import { QuoteCard } from "@/components/QuoteCard";
import { DailyHero } from "@/components/DailyHero";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const dailyQuote = getDailyQuote();
  const featured = getFeaturedQuotes(6);
  const latest = getLatestQuotes(6);
  const popular = getPopularQuotes(6);
  const tags = getAllTags();

  return (
    <div>
      {/* Hero */}
      <section className="hero-gradient relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 relative">
          <div className="text-center mb-8">
            <span
              className="inline-block px-4 py-1.5 rounded-full text-sm font-medium mb-4"
              style={{ background: "var(--t-bg-tag)", color: "var(--t-accent-text)" }}
            >
              ✨ 每日一言
            </span>
          </div>
          {dailyQuote && <DailyHero initialQuote={dailyQuote} />}
        </div>
      </section>

      {/* Tags */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
        <div
          className="flex flex-wrap justify-center gap-2 rounded-2xl p-4 shadow-lg border transition-colors duration-300"
          style={{ background: "var(--t-bg-card)", borderColor: "var(--t-border)" }}
        >
          {tags.map((tag) => (
            <Link
              key={tag.id}
              href={`/topics/${tag.slug}`}
              className="tag-pill transition-colors"
              style={{ background: "var(--t-bg-tag)", color: "var(--t-tag-text)" }}
            >
              {tag.name}
              <span className="ml-1.5 text-xs" style={{ color: "var(--t-text-muted)" }}>{tag.quote_count}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Sections */}
      {[
        { title: "编辑精选", desc: "大师智慧，字字珠玑", quotes: featured },
        { title: "热门名言", desc: "最受欢迎的投资智慧", quotes: popular },
        { title: "最新收录", desc: "新增大师名言", quotes: latest },
      ].map((section) => (
        <section key={section.title} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold" style={{ color: "var(--t-text)" }}>{section.title}</h2>
              <p className="text-sm mt-1" style={{ color: "var(--t-text-secondary)" }}>{section.desc}</p>
            </div>
            <Link href="/quotes" className="text-sm font-medium" style={{ color: "var(--t-accent)" }}>
              查看全部 →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {section.quotes.map((quote) => (
              <QuoteCard key={quote.id} quote={quote} />
            ))}
          </div>
        </section>
      ))}

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 text-center">
        <div
          className="rounded-3xl p-12 border transition-colors duration-300"
          style={{ background: "var(--t-accent-bg)", borderColor: "var(--t-border)" }}
        >
          <h2 className="text-2xl font-bold mb-4" style={{ color: "var(--t-text)" }}>
            站在巨人的肩膀上投资
          </h2>
          <p className="mb-8 max-w-xl mx-auto" style={{ color: "var(--t-text-secondary)" }}>
            探索 50+ 条经典投资名言，从价值投资到风险管理，从心态修炼到人生哲学
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/masters"
              className="px-6 py-3 font-medium text-white transition-all hover:scale-105"
              style={{ background: "var(--t-accent)", borderRadius: "var(--t-radius)" }}
            >
              浏览投资大师
            </Link>
            <Link
              href="/topics"
              className="px-6 py-3 font-medium border transition-all hover:scale-105"
              style={{ background: "var(--t-bg-card)", color: "var(--t-text)", borderColor: "var(--t-border)", borderRadius: "var(--t-radius)" }}
            >
              按主题探索
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
