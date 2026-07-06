import { NextResponse, type NextRequest } from "next/server";
import { getSubmission } from "@/lib/submissions";
import { recordApiCall } from "@/lib/apiStats";

export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
} as const;

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * GET /api/submit/{id}
 * 查询单条提交详情及审核状态
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const startedAt = Date.now();
  const ip = getClientIp(req);
  const userAgent = req.headers.get("user-agent") || undefined;
  const { id } = await params;
  const submission = getSubmission(id);

  const notFound = !submission;
  const res = notFound
    ? NextResponse.json(
        { code: 404, message: "未找到该提交记录" },
        { status: 404, headers: CORS_HEADERS },
      )
    : NextResponse.json({ code: 0, data: submission }, { headers: CORS_HEADERS });

  recordApiCall({
    endpoint: "/api/submit/[id]",
    method: "GET",
    statusCode: notFound ? 404 : 200,
    isSuccess: !notFound,
    itemCount: notFound ? 0 : 1,
    durationMs: Date.now() - startedAt,
    clientIp: ip,
    userAgent,
  });

  return res;
}
