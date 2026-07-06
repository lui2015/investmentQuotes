import { NextResponse, type NextRequest } from "next/server";
import {
  processBatchInstantly,
  processSubmissionInstantly,
  listSubmissions,
  validateSubmission,
  type SubmissionInput,
} from "@/lib/submissions";
import { recordApiCall } from "@/lib/apiStats";

export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
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
 * POST /api/submit
 * 用户提交名言（对外开放，无速率限制，即时生效）
 * 支持单条 / 数组 / { items: [] }
 */
export async function POST(req: NextRequest) {
  const startedAt = Date.now();
  const ip = getClientIp(req);
  const userAgent = req.headers.get("user-agent") || null;

  const finish = (
    res: NextResponse,
    stats: {
      statusCode: number;
      isSuccess: boolean;
      isBatch?: boolean;
      itemCount?: number;
      approvedCount?: number;
      rejectedCount?: number;
      failedCount?: number;
    },
  ) => {
    recordApiCall({
      endpoint: "/api/submit",
      method: "POST",
      statusCode: stats.statusCode,
      isSuccess: stats.isSuccess,
      isBatch: stats.isBatch,
      itemCount: stats.itemCount,
      approvedCount: stats.approvedCount,
      rejectedCount: stats.rejectedCount,
      failedCount: stats.failedCount,
      durationMs: Date.now() - startedAt,
      clientIp: ip,
      userAgent: userAgent ?? undefined,
    });
    return res;
  };

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return finish(
      NextResponse.json(
        { code: 400, message: "请求体必须是有效的 JSON" },
        { status: 400, headers: CORS_HEADERS },
      ),
      { statusCode: 400, isSuccess: false, itemCount: 0, failedCount: 1 },
    );
  }

  // 判定输入形态
  let items: Array<Partial<SubmissionInput>> | null = null;
  let isBatch = false;

  if (Array.isArray(body)) {
    items = body as Array<Partial<SubmissionInput>>;
    isBatch = true;
  } else if (body && typeof body === "object" && Array.isArray((body as { items?: unknown }).items)) {
    items = (body as { items: Array<Partial<SubmissionInput>> }).items;
    isBatch = true;
  }

  if (isBatch && items) {
    if (items.length === 0) {
      return finish(
        NextResponse.json(
          { code: 400, message: "批量提交至少需要包含 1 条名言" },
          { status: 400, headers: CORS_HEADERS },
        ),
        { statusCode: 400, isSuccess: false, isBatch: true, itemCount: 0, failedCount: 1 },
      );
    }
    if (items.length > 200) {
      return finish(
        NextResponse.json(
          { code: 400, message: "单次批量提交最多支持 200 条" },
          { status: 400, headers: CORS_HEADERS },
        ),
        { statusCode: 400, isSuccess: false, isBatch: true, itemCount: items.length, failedCount: items.length },
      );
    }

    const result = processBatchInstantly(items, ip);
    return finish(
      NextResponse.json(
        {
          code: 0,
          message: `批量处理完成：新增 ${result.approved} 条，去重 ${result.rejected} 条，失败 ${result.failed} 条`,
          data: result,
        },
        { status: 201, headers: CORS_HEADERS },
      ),
      {
        statusCode: 201,
        isSuccess: true,
        isBatch: true,
        itemCount: result.total,
        approvedCount: result.approved,
        rejectedCount: result.rejected,
        failedCount: result.failed,
      },
    );
  }

  // 单条提交
  const single = body as Partial<SubmissionInput>;
  const validationError = validateSubmission(single);
  if (validationError) {
    return finish(
      NextResponse.json(
        { code: 400, message: validationError },
        { status: 400, headers: CORS_HEADERS },
      ),
      { statusCode: 400, isSuccess: false, itemCount: 1, failedCount: 1 },
    );
  }

  const result = processSubmissionInstantly(single as SubmissionInput, ip);

  if (result.status === "rejected") {
    return finish(
      NextResponse.json(
        { code: 409, message: result.reason, data: result },
        { status: 409, headers: CORS_HEADERS },
      ),
      { statusCode: 409, isSuccess: true, itemCount: 1, rejectedCount: 1 },
    );
  }

  return finish(
    NextResponse.json(
      { code: 0, message: "名言已成功入库，前台立即可见", data: result },
      { status: 201, headers: CORS_HEADERS },
    ),
    { statusCode: 201, isSuccess: true, itemCount: 1, approvedCount: 1 },
  );
}

/**
 * GET /api/submit?status=approved&limit=20&offset=0
 * 分页查询提交记录
 */
export async function GET(req: NextRequest) {
  const startedAt = Date.now();
  const ip = getClientIp(req);
  const userAgent = req.headers.get("user-agent") || null;

  const searchParams = req.nextUrl.searchParams;
  const status = searchParams.get("status") || undefined;
  const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 20;
  const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!, 10) : 0;

  const { total, items } = listSubmissions({ status, limit, offset });

  recordApiCall({
    endpoint: "/api/submit",
    method: "GET",
    statusCode: 200,
    isSuccess: true,
    itemCount: items.length,
    durationMs: Date.now() - startedAt,
    clientIp: ip,
    userAgent: userAgent ?? undefined,
  });

  return NextResponse.json(
    { code: 0, data: { total, items } },
    { headers: CORS_HEADERS },
  );
}
