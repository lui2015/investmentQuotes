import Link from "next/link";
import { getDailyQuote, getLatestQuotes, getFeaturedMasters } from "@/lib/queries";
import { FeedQuoteCard } from "@/components/FeedQuoteCard";
import { MasterAvatar } from "@/components/MasterAvatar";
import { HomeModeShell } from "@/components/HomeModeShell";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const daily = getDailyQuote();
  const featuredMasters = getFeaturedMasters(8);
  // 今日推荐从 feed 中排除，避免重复；展示 60 条让用户持续下滑浏览
  const allLatest = getLatestQuotes(80);
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
      {daily && (
        <section className="mb-10 md:mb-14">
          <div className="flex items-baseline justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center justify-center w-7 h-7 rounded-full text-sm"
                style={{ background: "var(--t-accent)", color: "var(--t-bg)" }}
                aria-hidden
              >
                ✨
              </span>
              <h2 className="text-lg md:text-xl font-bold" style={{ color: "var(--t-text)" }}>
                今日推荐
              </h2>
            </div>
            <span className="text-xs font-mono" style={{ color: "var(--t-text-muted)" }}>
              {dateStr}
            </span>
          </div>

          <Link href={`/quotes/${daily.id}`} className="block group">
            <div
              className="relative p-6 md:p-8 border-2 transition-all duration-300 group-hover:shadow-2xl"
              style={{
                background: "var(--t-accent-bg)",
                borderColor: "var(--t-accent)",
                borderRadius: "var(--t-radius)",
              }}
            >
              {/* 装饰大引号 */}
              <div
                className="absolute top-2 left-3 text-7xl md:text-8xl leading-none opacity-20 select-none pointer-events-none font-serif"
                style={{ color: "var(--t-accent)" }}
              >
                &ldquo;
              </div>

              <p
                className="quote-text relative text-xl md:text-2xl lg:text-3xl font-medium leading-relaxed pl-2 md:pl-4 mb-5"
                style={{ color: "var(--t-text)" }}
              >
                {daily.content_cn}
              </p>

              {daily.content_en && (
                <p
                  className="text-sm md:text-base italic leading-relaxed pl-2 md:pl-4 mb-6"
                  style={{ color: "var(--t-text-muted)" }}
                >
                  &ldquo;{daily.content_en}&rdquo;
                </p>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pl-2 md:pl-4">
                <div className="flex items-center gap-3 min-w-0">
                  <MasterAvatar
                    name={daily.master_name_cn || ""}
                    avatarUrl={daily.master_avatar_url}
                    className="w-11 h-11 rounded-full text-white font-bold text-base shadow-md"
                  />
                  <div className="min-w-0">
                    <div className="font-semibold text-sm md:text-base truncate" style={{ color: "var(--t-text)" }}>
                      {daily.master_name_cn}
                    </div>
                    {daily.master_title && (
                      <div className="text-xs truncate" style={{ color: "var(--t-text-secondary)" }}>
                        {daily.master_title}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {daily.source && (
                    <span className="text-xs hidden sm:inline" style={{ color: "var(--t-text-muted)" }}>
                      📖 {daily.source}{daily.source_year ? ` · ${daily.source_year}` : ""}
                    </span>
                  )}
                  <span
                    className="inline-flex items-center gap-1 text-sm font-bold transition-transform group-hover:translate-x-0.5"
                    style={{ color: "var(--t-accent)" }}
                  >
                    查看详情
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </section>
      )}

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
