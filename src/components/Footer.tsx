import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-stone-100 dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">💎</span>
              <span className="text-lg font-bold text-amber-700 dark:text-amber-400">投资名言</span>
            </div>
            <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed">
              让大师思想照亮普通人的投资道路。<br />
              汇聚全球投资大师的智慧结晶。
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-stone-700 dark:text-stone-300">浏览</h3>
            <div className="space-y-2">
              <Link href="/masters" className="block text-sm text-stone-500 hover:text-amber-700 dark:text-stone-400 dark:hover:text-amber-400 transition-colors">投资大师</Link>
              <Link href="/topics" className="block text-sm text-stone-500 hover:text-amber-700 dark:text-stone-400 dark:hover:text-amber-400 transition-colors">主题分类</Link>
              <Link href="/quotes" className="block text-sm text-stone-500 hover:text-amber-700 dark:text-stone-400 dark:hover:text-amber-400 transition-colors">全部名言</Link>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-stone-700 dark:text-stone-300">热门主题</h3>
            <div className="flex flex-wrap gap-2">
              {["价值投资", "长期主义", "风险管理", "逆向思维", "能力圈"].map((tag) => (
                <span key={tag} className="text-xs px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-stone-200 dark:border-stone-800 text-center text-sm text-stone-400">
          投资名言 © {new Date().getFullYear()} · 投资有风险，入市需谨慎
        </div>
      </div>
    </footer>
  );
}
