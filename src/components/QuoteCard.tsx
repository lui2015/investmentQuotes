import Link from "next/link";
import type { Quote } from "@/lib/queries";

export function QuoteCard({ quote, showMaster = true }: { quote: Quote; showMaster?: boolean }) {
  return (
    <Link href={`/quotes/${quote.id}`} className="block">
      <div className="card-hover bg-white dark:bg-stone-900 rounded-2xl p-6 border border-stone-200 dark:border-stone-800 h-full flex flex-col">
        <div className="flex-1">
          <div className="text-amber-500 text-3xl mb-3 leading-none">&ldquo;</div>
          <p className="quote-text text-stone-800 dark:text-stone-200 text-base leading-relaxed mb-3">
            {quote.content_cn}
          </p>
          {quote.content_en && (
            <p className="text-stone-400 dark:text-stone-500 text-sm italic leading-relaxed mb-4">
              {quote.content_en}
            </p>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-800">
          {showMaster && (
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {quote.master_name_cn?.charAt(0) || "?"}
              </div>
              <div>
                <div className="font-semibold text-sm text-stone-800 dark:text-stone-200">
                  {quote.master_name_cn}
                </div>
                <div className="text-xs text-stone-400">{quote.master_title}</div>
              </div>
            </div>
          )}
          {quote.source && (
            <div className="text-xs text-stone-400">
              📖 {quote.source}{quote.source_year ? ` (${quote.source_year})` : ""}
            </div>
          )}
          {quote.tags && quote.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {quote.tags.map((tag) => (
                <span key={tag.id} className="text-xs px-2 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-full">
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
