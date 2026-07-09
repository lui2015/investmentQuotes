import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAllMasters } from "@/lib/queries";
import { initDb } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/masters
 *   - 返回全量大师列表（id + 名称），用于管理后台的「大师」下拉选择。
 */
export async function GET(_request: NextRequest) {
  initDb();
  const masters = getAllMasters().map((m) => ({
    id: m.id,
    name_cn: m.name_cn,
    name_en: m.name_en,
    title: m.title,
  }));
  return NextResponse.json(masters);
}
