import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { listQuotesAdmin } from "@/lib/queries";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/quotes
 *   - search?: 模糊匹配 content_cn / content_en / master_name
 *   - masterId?: 按大师 ID 过滤
 *   - page: 页码（默认 1）
 *   - pageSize: 每页条数（默认 20，最大 100）
 *
 * 用于名言管理后台。
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const pageRaw = Number.parseInt(searchParams.get("page") || "1", 10);
  const sizeRaw = Number.parseInt(searchParams.get("pageSize") || "20", 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const pageSize = Math.min(
    100,
    Math.max(1, Number.isFinite(sizeRaw) && sizeRaw > 0 ? sizeRaw : 20),
  );

  const search = (searchParams.get("search") || "").trim() || undefined;
  const masterId = (searchParams.get("masterId") || "").trim() || undefined;

  const result = listQuotesAdmin({ search, masterId, page, pageSize });
  return NextResponse.json(result);
}
