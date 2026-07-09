import { NextResponse } from "next/server";
import { getAllQuotes } from "@/lib/queries";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/quotes
 *   - 不带 ids: 返回全量名言
 *   - 带 ids=id1,id2,... : 仅返回对应 ID 的名言，保持传入顺序
 *
 * 用于「我的收藏」等只需要按 ID 拉取完整数据的场景。
 */
export async function GET(request: NextRequest) {
  const idsParam = request.nextUrl.searchParams.get("ids");
  const all = getAllQuotes();
  const byId = new Map(all.map((q) => [q.id, q]));

  if (!idsParam) {
    return NextResponse.json(all);
  }

  const ids = idsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // 按传入顺序返回；不存在的 ID 静默跳过
  const result = ids.map((id) => byId.get(id)).filter(Boolean);
  return NextResponse.json(result);
}
