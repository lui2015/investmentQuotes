import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import {
  registerUser,
  createSession,
  SESSION_COOKIE,
} from "@/lib/auth";
import { BASE_PATH } from "@/lib/basePath";

export const dynamic = "force-dynamic";

function validUsername(username: string): boolean {
  return (
    username.length >= 3 &&
    username.length <= 32 &&
    !/\s/.test(username)
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const username = (body?.username ?? "").toString().trim();
  const password = (body?.password ?? "").toString();

  if (!validUsername(username)) {
    return NextResponse.json(
      { code: 1, message: "用户名需为 3-32 位，不能含空格" },
      { status: 400 },
    );
  }
  if (password.length < 6) {
    return NextResponse.json(
      { code: 1, message: "密码至少 6 位" },
      { status: 400 },
    );
  }

  try {
    const user = registerUser(username, password);
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
  } catch (e) {
    return NextResponse.json(
      { code: 1, message: e instanceof Error ? e.message : "注册失败" },
      { status: 400 },
    );
  }
}
