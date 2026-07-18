import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getStarQuotes } from "@/lib/queries";

// 数据库构建期是空库，接口保持动态渲染（运行时查真实库），避免构建期预渲染空数据；
// 同时用 unstable_cache 缓存查询结果 10 分钟，并下发 Cache-Control 让浏览器/CDN 缓存，
// 避免每次进入沉浸模式都重新拉取全量 JSON
export const dynamic = "force-dynamic";

export async function GET() {
  const quotes = await unstable_cache(
    async () => getStarQuotes(),
    ["stars-all"],
    { revalidate: 600 }
  )();

  return NextResponse.json(
    { quotes },
    {
      headers: {
        "Cache-Control": "public, s-maxage=600, max-age=120, stale-while-revalidate=300",
      },
    }
  );
}
