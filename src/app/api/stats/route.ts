import { NextResponse, type NextRequest } from "next/server";
import {
  getStatsSummary,
  getEndpointStats,
  getDailyStats,
  getRecentCalls,
} from "@/lib/apiStats";

export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
} as const;

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * GET /api/stats
 * 查询 API 调用统计
 *
 * Query:
 *   days   最近 N 天的每日趋势，默认 7，范围 1~90
 *   recent 最近 N 次调用记录，默认 20，范围 1~200
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const days = Math.min(90, Math.max(1, parseInt(sp.get("days") || "7", 10) || 7));
  const recent = Math.min(200, Math.max(1, parseInt(sp.get("recent") || "20", 10) || 20));

  const summary = getStatsSummary();
  const endpoints = getEndpointStats();
  const daily = getDailyStats(days);
  const recentCalls = getRecentCalls(recent);

  return NextResponse.json(
    {
      code: 0,
      data: {
        summary,
        endpoints,
        daily,
        recent: recentCalls,
        server_time: new Date().toISOString(),
      },
    },
    { headers: CORS_HEADERS },
  );
}
