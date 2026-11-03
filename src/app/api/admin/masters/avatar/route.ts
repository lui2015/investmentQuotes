import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getUserBySession, SESSION_COOKIE } from "@/lib/auth";
import { initDb, getDb } from "@/lib/db";
import {
  MAX_AVATAR_BYTES,
  detectAvatarFormat,
  isSafeMasterId,
  saveAvatar,
} from "@/lib/avatar";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/admin/masters/avatar?masterId=xxx
 *   body: 图片二进制（png / jpg / webp / gif，≤ 2MB）
 *   仅管理员可调用；文件写入数据卷 data/avatars/，并更新 masters.avatar_url。
 */
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const user = getUserBySession(cookieStore.get(SESSION_COOKIE)?.value);
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  if (!user.isAdmin) {
    return NextResponse.json({ error: "仅管理员可编辑头像" }, { status: 403 });
  }

  const masterId = (request.nextUrl.searchParams.get("masterId") ?? "").trim();
  if (!isSafeMasterId(masterId)) {
    return NextResponse.json({ error: "非法的大师 ID" }, { status: 400 });
  }

  const db = initDb();
  const master = db
    .prepare("SELECT id FROM masters WHERE id = ?")
    .get(masterId);
  if (!master) {
    return NextResponse.json({ error: "大师不存在" }, { status: 404 });
  }

  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_AVATAR_BYTES) {
    return NextResponse.json({ error: "图片过大，上限 2MB" }, { status: 413 });
  }

  let bytes: Buffer;
  try {
    const arrayBuffer = await request.arrayBuffer();
    if (arrayBuffer.byteLength === 0) {
      return NextResponse.json({ error: "图片内容为空" }, { status: 400 });
    }
    if (arrayBuffer.byteLength > MAX_AVATAR_BYTES) {
      return NextResponse.json({ error: "图片过大，上限 2MB" }, { status: 413 });
    }
    bytes = Buffer.from(arrayBuffer);
  } catch {
    return NextResponse.json({ error: "读取上传文件失败" }, { status: 400 });
  }

  const format = detectAvatarFormat(bytes);
  if (!format) {
    return NextResponse.json(
      { error: "仅支持 PNG / JPG / WebP / GIF 格式的图片" },
      { status: 400 },
    );
  }

  try {
    const avatarUrl = saveAvatar(masterId, bytes, format);
    db.prepare("UPDATE masters SET avatar_url = ? WHERE id = ?").run(
      avatarUrl,
      masterId,
    );
    return NextResponse.json({ ok: true, masterId, avatarUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[avatar] 保存失败", err);
    return NextResponse.json({ error: `保存失败：${message}` }, { status: 500 });
  }
}
