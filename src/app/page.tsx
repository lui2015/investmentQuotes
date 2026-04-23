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
      {/* Hero - 每日一言 */}
      <section className="hero-gradient relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDAwMDAiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDE0djIwaC0yVjE0aDJ6TTI0IDI0djEwaC0yVjI0aDJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 relative">
          <div className="text-center mb-8">
            <span className="inline-block px-4 py-1.5 rounded-full bg-amber-800/10 dark:bg-amber-200/10 text-amber-800 dark:text-amber-200 text-sm font-medium mb-4">
              ✨ 每日一言
            </span>
          </div>

          {dailyQuote && <DailyHero initialQuote={dailyQuote} />}
        </div>
      </section>

      {/* 主题标签 */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
        <div className="flex flex-wrap justify-center gap-2 bg-white dark:bg-stone-900 rounded-2xl p-4 shadow-lg border border-stone-200 dark:border-stone-800">
          {tags.map((tag) => (
            <Link
              key={tag.id}
              href={`/topics/${tag.slug}`}
              className="tag-pill bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 hover:text-amber-800 dark:hover:text-amber-300"
            >
              {tag.name}
              <span className="ml-1.5 text-xs text-stone-400 dark:text-stone-500">{tag.quote_count}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 编辑精选 */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-200">编辑精选</h2>
            <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">大师智慧，字字珠玑</p>
          </div>
          <Link href="/quotes" className="text-sm text-amber-700 dark:text-amber-400 hover:underline font-medium">
            查看全部 →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((quote) => (
            <QuoteCard key={quote.id} quote={quote} />
          ))}
        </div>
      </section>

      {/* 热门名言 */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-200">热门名言</h2>
            <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">最受欢迎的投资智慧</p>
          </div>
          <Link href="/quotes" className="text-sm text-amber-700 dark:text-amber-400 hover:underline font-medium">
            查看全部 →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {popular.map((quote) => (
            <QuoteCard key={quote.id} quote={quote} />
          ))}
        </div>
      </section>

      {/* 最新收录 */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-200">最新收录</h2>
            <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">新增大师名言</p>
          </div>
          <Link href="/quotes" className="text-sm text-amber-700 dark:text-amber-400 hover:underline font-medium">
            查看全部 →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {latest.map((quote) => (
            <QuoteCard key={quote.id} quote={quote} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 text-center">
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-3xl p-12 border border-amber-200 dark:border-amber-800/30">
          <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-200 mb-4">
            站在巨人的肩膀上投资
          </h2>
          <p className="text-stone-500 dark:text-stone-400 mb-8 max-w-xl mx-auto">
            探索 50+ 条经典投资名言，从价值投资到风险管理，从心态修炼到人生哲学
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/masters"
              className="px-6 py-3 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-medium transition-colors shadow-lg shadow-amber-700/20"
            >
              浏览投资大师
            </Link>
            <Link
              href="/topics"
              className="px-6 py-3 rounded-xl bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-medium transition-colors border border-stone-200 dark:border-stone-700"
            >
              按主题探索
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
