import { NextResponse } from "next/server";
import { getStarQuotes } from "@/lib/queries";

// 繁星模式数据量大，按需拉取，不进入首屏
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ quotes: getStarQuotes() });
}
