import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { deleteSession, SESSION_COOKIE } from "@/lib/auth";
import { BASE_PATH } from "@/lib/basePath";

export const dynamic = "force-dynamic";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) deleteSession(token);
  cookieStore.delete(SESSION_COOKIE);
  // 兜底：显式下发过期 cookie，path 与登录时保持一致
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: BASE_PATH,
    maxAge: 0,
  });
  return NextResponse.json({ code: 0 });
}
