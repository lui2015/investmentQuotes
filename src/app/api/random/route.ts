import { NextResponse } from "next/server";
import { getRandomQuote } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const quote = getRandomQuote();
  return NextResponse.json(quote);
}
