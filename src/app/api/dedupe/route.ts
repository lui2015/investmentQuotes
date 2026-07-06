import { NextResponse, type NextRequest } from "next/server";
import { runDedupeJob } from "@/lib/submissions";

export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Cron-Token",
} as const;

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * POST /api/dedupe
 * 
 * 后台去重任务：扫描所有 pending 提交，与库内名言比对
 * - 相似度 ≥ 85% → 自动去重（rejected）
 * - 未匹配大师 → 保持 pending（需人工处理）
 * - 其余 → 自动入库（approved）
 * 
 * 需要通过 CRON_TOKEN 环境变量鉴权，防止未授权调用
 * 请求头：X-Cron-Token: {token}   或   Authorization: Bearer {token}
 * 
 * 若未设置 CRON_TOKEN 环境变量，则限制仅本机（127.0.0.1）可访问
 */
export async function POST(req: NextRequest) {
  const cronToken = process.env.CRON_TOKEN;

  if (cronToken) {
    const provided =
      req.headers.get("x-cron-token") ||
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (provided !== cronToken) {
      return NextResponse.json(
        { code: 401, message: "未授权：无效的 X-Cron-Token" },
        { status: 401, headers: CORS_HEADERS },
      );
    }
  } else {
    // 未配置 token → 仅允许本机调用
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";
    const isLocal = ip === "127.0.0.1" || ip === "::1" || ip === "localhost" || ip === "unknown";
    if (!isLocal) {
      return NextResponse.json(
        { code: 401, message: "未授权：请配置 CRON_TOKEN 环境变量并在请求头中传入 X-Cron-Token" },
        { status: 401, headers: CORS_HEADERS },
      );
    }
  }

  const started = Date.now();
  const result = runDedupeJob();
  const duration = Date.now() - started;

  return NextResponse.json(
    {
      code: 0,
      message: `去重任务完成：处理 ${result.processed} 条，入库 ${result.approved}，去重 ${result.rejected}，跳过 ${result.skipped}`,
      data: {
        ...result,
        duration_ms: duration,
      },
    },
    { headers: CORS_HEADERS },
  );
}
