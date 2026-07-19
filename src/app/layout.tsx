import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";
import { FavoritesProvider } from "@/components/FavoritesProvider";

export const metadata: Metadata = {
  title: "投资名言 — 让大师思想照亮投资道路",
  description: "汇聚巴菲特、芒格、格雷厄姆等投资大师的经典名言，按大师和投资思路分类，每日推荐一句智慧箴言。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" data-theme="fresh-green" suppressHydrationWarning>
      <head>
        {/* 在首屏绘制前同步设定主题，避免先黑后绿的闪烁 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('iq-theme');var v=['classic','cyberpunk','ink','minimal','purple','fresh-green'];document.documentElement.setAttribute('data-theme',(t&&v.indexOf(t)>=0)?t:'fresh-green');}catch(e){document.documentElement.setAttribute('data-theme','fresh-green');}})();`,
          }}
        />
      </head>
      <body className="antialiased min-h-screen flex flex-col">
        <ThemeProvider>
          <FavoritesProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </FavoritesProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
