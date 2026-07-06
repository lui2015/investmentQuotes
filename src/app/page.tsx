import Link from "next/link";
import { getDailyQuote, getLatestQuotes } from "@/lib/queries";
import { FeedQuoteCard } from "@/components/FeedQuoteCard";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const daily = getDailyQuote();
  // 今日推荐从 feed 中排除，避免重复
  const allLatest = getLatestQuotes(40);
  const quotes = daily
    ? allLatest.filter((q) => q.id !== daily.id).slice(0, 24)
    : allLatest.slice(0, 24);

  // 7 天内的新增名言论为"新"
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const isNewQuote = (createdAt: string) => {
    const ts = new Date(createdAt.replace(" ", "T") + "Z").getTime();
    return Number.isFinite(ts) && ts >= sevenDaysAgo;
  };

  const newCount = quotes.filter((q) => isNewQuote(q.created_at)).length;

  // 今日推荐日期展示
  const today = new Date();
  const weekDays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const dateStr = `${today.getFullYear()}年${String(today.getMonth() + 1).padStart(2, "0")}月${String(today.getDate()).padStart(2, "0")}日 · ${weekDays[today.getDay()]}`;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
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
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-base shrink-0 shadow-md"
                    style={{ background: `linear-gradient(135deg, var(--t-avatar-from), var(--t-avatar-to))` }}
                  >
                    {daily.master_name_cn?.charAt(0) || "?"}
                  </div>
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

      {/* 信息流页头 */}
      <header className="mb-6 md:mb-8">
        <div className="flex items-baseline justify-between gap-4 mb-1">
          <h1
            className="text-xl md:text-2xl font-bold tracking-tight"
            style={{ color: "var(--t-text)" }}
          >
            投资名言
          </h1>
          <span
            className="text-xs font-mono px-2.5 py-1 rounded-full"
            style={{ background: "var(--t-bg-tag)", color: "var(--t-tag-text)" }}
          >
            {quotes.length} 条 · 本周新增 {newCount}
          </span>
        </div>
        <p className="text-sm" style={{ color: "var(--t-text-secondary)" }}>
          大师智慧，按时间持续更新
        </p>
      </header>

      {/* 信息流主体 */}
      <div className="space-y-5 md:space-y-6">
        {quotes.length === 0 ? (
          <div
            className="p-12 text-center border"
            style={{
              background: "var(--t-bg-card)",
              borderColor: "var(--t-border)",
              borderRadius: "var(--t-radius)",
            }}
          >
            <p style={{ color: "var(--t-text-secondary)" }}>暂无名言，<Link href="/api-docs" className="underline" style={{ color: "var(--t-accent)" }}>贡献一条</Link>？</p>
          </div>
        ) : (
          quotes.map((quote) => (
            <FeedQuoteCard
              key={quote.id}
              quote={quote}
              isNew={isNewQuote(quote.created_at)}
            />
          ))
        )}
      </div>

      {/* 底部：查看更多 + 贡献 */}
      {quotes.length > 0 && (
        <div className="mt-12 md:mt-16 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/quotes"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium border transition-all hover:scale-[1.02]"
            style={{
              background: "var(--t-bg-card)",
              color: "var(--t-text)",
              borderColor: "var(--t-border)",
              borderRadius: "var(--t-radius)",
            }}
          >
            浏览全部名言
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <Link
            href="/api-docs"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold transition-all hover:scale-[1.02]"
            style={{
              background: "var(--t-accent)",
              color: "var(--t-bg)",
              borderRadius: "var(--t-radius)",
            }}
          >
            + 贡献名言
          </Link>
        </div>
      )}
    </div>
  );
}
