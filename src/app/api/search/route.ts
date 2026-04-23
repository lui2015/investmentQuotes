import { NextResponse } from "next/server";
import { searchQuotes } from "@/lib/queries";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const keyword = request.nextUrl.searchParams.get("q") || "";
  if (!keyword.trim()) {
    return NextResponse.json([]);
  }
  const quotes = searchQuotes(keyword.trim());
  return NextResponse.json(quotes);
}
