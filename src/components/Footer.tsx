import Link from "next/link";

export function Footer() {
  return (
    <footer
      className="border-t mt-16 transition-colors duration-300"
      style={{ background: "var(--t-bg-footer)", borderColor: "var(--t-border)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">💎</span>
              <span className="text-lg font-bold" style={{ color: "var(--t-accent)" }}>投资名言</span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "var(--t-text-secondary)" }}>
              让大师思想照亮普通人的投资道路。<br />
              汇聚全球投资大师的智慧结晶。
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-4" style={{ color: "var(--t-text)" }}>浏览</h3>
            <div className="space-y-2">
              {[
                { href: "/masters", label: "投资大师" },
                { href: "/topics", label: "主题分类" },
                { href: "/quotes", label: "全部名言" },
              ].map((link) => (
                <Link key={link.href} href={link.href} className="block text-sm transition-colors" style={{ color: "var(--t-text-secondary)" }}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-4" style={{ color: "var(--t-text)" }}>热门主题</h3>
            <div className="flex flex-wrap gap-2">
              {["价值投资", "长期主义", "风险管理", "逆向思维", "能力圈"].map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2.5 py-1 rounded-full"
                  style={{ background: "var(--t-bg-tag)", color: "var(--t-tag-text)" }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div
          className="mt-8 pt-8 border-t text-center text-sm"
          style={{ borderColor: "var(--t-border)", color: "var(--t-text-muted)" }}
        >
          投资名言 © {new Date().getFullYear()} · 投资有风险，入市需谨慎
        </div>
      </div>
    </footer>
  );
}
