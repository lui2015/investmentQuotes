import Link from "next/link";
import type { Quote } from "@/lib/queries";

export function QuoteCard({ quote, showMaster = true }: { quote: Quote; showMaster?: boolean }) {
  return (
    <Link href={`/quotes/${quote.id}`} className="block">
      <div
        className="card-hover p-6 border h-full flex flex-col transition-colors duration-300"
        style={{
          background: "var(--t-bg-card)",
          borderColor: "var(--t-border)",
          borderRadius: "var(--t-radius)",
        }}
      >
        <div className="flex-1">
          <div className="text-3xl mb-3 leading-none" style={{ color: "var(--t-accent)" }}>&ldquo;</div>
          <p className="quote-text text-base leading-relaxed mb-3" style={{ color: "var(--t-text)" }}>
            {quote.content_cn}
          </p>
          {quote.content_en && (
            <p className="text-sm italic leading-relaxed mb-4" style={{ color: "var(--t-text-muted)" }}>
              {quote.content_en}
            </p>
          )}
        </div>

        <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--t-border)" }}>
          {showMaster && (
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                style={{ background: `linear-gradient(135deg, var(--t-avatar-from), var(--t-avatar-to))` }}
              >
                {quote.master_name_cn?.charAt(0) || "?"}
              </div>
              <div>
                <div className="font-semibold text-sm" style={{ color: "var(--t-text)" }}>
                  {quote.master_name_cn}
                </div>
                <div className="text-xs" style={{ color: "var(--t-text-muted)" }}>{quote.master_title}</div>
              </div>
            </div>
          )}
          {quote.source && (
            <div className="text-xs" style={{ color: "var(--t-text-muted)" }}>
              📖 {quote.source}{quote.source_year ? ` (${quote.source_year})` : ""}
            </div>
          )}
          {quote.tags && quote.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {quote.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "var(--t-bg-tag)", color: "var(--t-tag-text)" }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
