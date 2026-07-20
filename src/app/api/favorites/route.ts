import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import {
  getUserBySession,
  SESSION_COOKIE,
  getFavorites,
  addFavorite,
  removeFavorite,
  clearFavorites,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json(
    { code: 401, message: "请先登录" },
    { status: 401 },
  );
}

export async function GET() {
  const cookieStore = await cookies();
  const user = getUserBySession(cookieStore.get(SESSION_COOKIE)?.value);
  if (!user) return unauthorized();
  return NextResponse.json({ code: 0, ids: getFavorites(user.id) });
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const user = getUserBySession(cookieStore.get(SESSION_COOKIE)?.value);
  if (!user) return unauthorized();

  const body = await req.json().catch(() => null);
  const quoteId = (body?.quoteId ?? "").toString().trim();
  if (!quoteId) {
    return NextResponse.json(
      { code: 1, message: "缺少 quoteId" },
      { status: 400 },
    );
  }
  addFavorite(user.id, quoteId);
  return NextResponse.json({ code: 0, ids: getFavorites(user.id) });
}

export async function DELETE(req: NextRequest) {
  const cookieStore = await cookies();
  const user = getUserBySession(cookieStore.get(SESSION_COOKIE)?.value);
  if (!user) return unauthorized();

  const body = await req.json().catch(() => null);
  const quoteId = (body?.quoteId ?? "").toString().trim();
  if (quoteId) {
    removeFavorite(user.id, quoteId);
  } else {
    clearFavorites(user.id);
  }
  return NextResponse.json({ code: 0, ids: getFavorites(user.id) });
}
