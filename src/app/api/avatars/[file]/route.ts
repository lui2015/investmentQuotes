import { NextResponse, type NextRequest } from "next/server";
import { readAvatar } from "@/lib/avatar";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/avatars/<file>
 *   公开读取管理员上传的大师头像（存于数据卷，容器重建不丢失）。
 *   文件名经白名单校验，禁止路径遍历；固定 Content-Type + nosniff 防止内容嗅探。
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ file: string }> },
) {
  const { file } = await params;
  const result = readAvatar(file);
  if (!result) {
    return new NextResponse("Not Found", { status: 404 });
  }
  return new NextResponse(new Uint8Array(result.bytes), {
    headers: {
      "Content-Type": result.mime,
      "Content-Length": String(result.bytes.length),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
