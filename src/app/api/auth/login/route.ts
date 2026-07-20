import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import {
  authenticateUser,
  createSession,
  SESSION_COOKIE,
} from "@/lib/auth";
import { BASE_PATH } from "@/lib/basePath";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const username = (body?.username ?? "").toString().trim();
  const password = (body?.password ?? "").toString();

  if (!username || !password) {
    return NextResponse.json(
      { code: 1, message: "请输入用户名和密码" },
      { status: 400 },
    );
  }

  const user = authenticateUser(username, password);
  if (!user) {
    return NextResponse.json(
      { code: 1, message: "用户名或密码错误" },
      { status: 401 },
    );
  }

  const { token, maxAge } = createSession(user.id);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: req.nextUrl.protocol === "https:",
    path: BASE_PATH,
    maxAge,
  });
  return NextResponse.json({ code: 0, user });
}
