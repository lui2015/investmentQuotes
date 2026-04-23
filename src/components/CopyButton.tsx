"use client";

import { useState } from "react";
import type { Quote } from "@/lib/queries";

export function CopyButton({ quote }: { quote: Quote }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = `「${quote.content_cn}」—— ${quote.master_name_cn}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all hover:scale-105"
      style={{
        background: "var(--t-bg-tag)",
        color: "var(--t-text)",
        borderRadius: "var(--t-radius)",
      }}
    >
      {copied ? (
        <>
          <svg className="w-4 h-4" style={{ color: "var(--t-accent)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          已复制
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          复制名言
        </>
      )}
    </button>
  );
}
