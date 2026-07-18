import Link from "next/link";
import { unstable_cache } from "next/cache";
import { getDailyQuote, getLatestQuotes, getFeaturedMasters } from "@/lib/queries";
import { FeedQuoteCard } from "@/components/FeedQuoteCard";
import { MasterAvatar } from "@/components/MasterAvatar";
import { HomeModeShell } from "@/components/HomeModeShell";
import DailyQuoteCard from "@/components/DailyQuoteCard";

// 数据库在容器启动时（init-data）才灌入，构建期是空库，故首页保持动态渲染（运行时查真实库）；
// 同时用 unstable_cache 把三条查询缓存 5 分钟，避免每次请求都打库，提升 TTFB
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { daily, featuredMasters, allLatest } = await unstable_cache(
    async () => {
      const daily = getDailyQuote();
      const featuredMasters = getFeaturedMasters(8);
      const allLatest = getLatestQuotes(80);
      return { daily, featuredMasters, allLatest };
    },
    ["home-feed"],
    { revalidate: 300 }
  )();
  const quotes = daily
    ? allLatest.filter((q) => q.id !== daily.id).slice(0, 60)
    : allLatest.slice(0, 60);

  // 7 天内的新增名言论为"新"
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const isNewQuote = (createdAt: string) => {
    const ts = new Date(createdAt.replace(" ", "T") + "Z").getTime();
    return Number.isFinite(ts) && ts >= sevenDaysAgo;
  };

  // 今日推荐日期展示
  const today = new Date();
  const weekDays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const dateStr = `${today.getFullYear()}年${String(today.getMonth() + 1).padStart(2, "0")}月${String(today.getDate()).padStart(2, "0")}日 · ${weekDays[today.getDay()]}`;

  // 繁星模式的名言集合改为「按需拉取」（/api/stars），不再阻塞首屏渲染
  return (
    <HomeModeShell>
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* 今日推荐 */}
      {daily && <DailyQuoteCard daily={daily} dateStr={dateStr} />}

      {/* 投资大师 */}
      {featuredMasters.length > 0 && (
        <section className="mb-10 md:mb-14">
          <div className="flex items-center justify-between gap-4 mb-5 md:mb-6">
            <div className="flex items-center gap-3 min-w-0">
              <span
                className="w-1.5 h-6 rounded-full shrink-0"
                style={{ background: "var(--t-accent)" }}
              />
              <h2
                className="text-xl md:text-2xl font-bold tracking-tight truncate"
                style={{ color: "var(--t-text)" }}
              >
                投资大师
              </h2>
            </div>
            <Link
              href="/masters"
              className="group inline-flex items-center gap-1 text-sm font-semibold transition-transform hover:translate-x-0.5 shrink-0"
              style={{ color: "var(--t-accent)" }}
            >
              查看全部
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-x-3 gap-y-5 md:gap-x-4 md:gap-y-6">
            {featuredMasters.map((master) => (
              <Link
                key={master.id}
                href={`/masters/${master.id}`}
                className="group flex flex-col items-center text-center gap-2 md:gap-3"
              >
                <MasterAvatar
                  name={master.name_cn}
                  avatarUrl={master.avatar_url}
                  className="w-16 h-16 md:w-20 md:h-20 rounded-full text-white font-bold text-lg md:text-xl shadow-md transition-transform duration-300 group-hover:scale-105"
                />
                <span
                  className="text-xs md:text-sm font-medium leading-tight line-clamp-1"
                  style={{ color: "var(--t-text)" }}
                >
                  {master.name_cn}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 信息流页头 */}
      <header className="mb-6 md:mb-8">
        <div className="flex items-baseline justify-between gap-4 mb-1">
          <h1
            className="text-xl md:text-2xl font-bold tracking-tight"
            style={{ color: "var(--t-text)" }}
          >
            投资名言
          </h1>
          <Link
            href="/quotes"
            className="group inline-flex items-center gap-1 text-sm font-semibold transition-transform hover:translate-x-0.5 shrink-0"
            style={{ color: "var(--t-accent)" }}
          >
            查看更多
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        <p className="text-sm" style={{ color: "var(--t-text-secondary)" }}>
          大师智慧，按时间持续更新
        </p>
      </header>

      {/* 信息流主体：宽屏多列瀑布流，充分利用横向空间，消除大面积留白 */}
      {quotes.length === 0 ? (
        <div
          className="p-12 text-center border"
          style={{
            background: "var(--t-bg-card)",
            borderColor: "var(--t-border)",
            borderRadius: "var(--t-radius)",
          }}
        >
          <p style={{ color: "var(--t-text-secondary)" }}>暂无名言</p>
        </div>
      ) : (
        <div className="columns-1 md:columns-2 xl:columns-3 gap-5 md:gap-6">
          {quotes.map((quote) => (
            <div key={quote.id} className="break-inside-avoid mb-5 md:mb-6">
              <FeedQuoteCard
                quote={quote}
                isNew={isNewQuote(quote.created_at)}
              />
            </div>
          ))}
        </div>
      )}

      {/* 滑到底的温柔提示 */}
      {quotes.length > 0 && (
        <div
          className="pt-8 pb-2 text-center text-xs"
          style={{ color: "var(--t-text-muted)" }}
        >
          <div className="inline-flex items-center gap-2">
            <span className="inline-block w-1 h-1 rounded-full" style={{ background: "currentColor" }} />
            到底了 · 今天的 {quotes.length} 条已全部呈现
            <span className="inline-block w-1 h-1 rounded-full" style={{ background: "currentColor" }} />
          </div>
        </div>
      )}
    </div>
    </HomeModeShell>
  );
}
