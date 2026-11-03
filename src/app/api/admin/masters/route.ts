import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAllMastersAdmin } from "@/lib/queries";
import { initDb } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/masters
 *   - 返回全量大师列表（id + 名称），用于管理后台的「大师」下拉选择。
 *   - 包含 user-submitted 自动创建的大师。
 */
export async function GET(_request: NextRequest) {
  initDb();
  const masters = getAllMastersAdmin().map((m) => ({
    id: m.id,
    name_cn: m.name_cn,
    name_en: m.name_en,
    title: m.title,
    avatar_url: m.avatar_url,
    quote_count: m.quote_count ?? 0,
  }));
  return NextResponse.json(masters);
}
