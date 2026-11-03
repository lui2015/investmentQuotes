import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getUserBySession, SESSION_COOKIE } from "@/lib/auth";
import {
  MAX_IMPORT_BYTES,
  parseWorkbook,
  replaceQuotesFromImport,
} from "@/lib/importQuotes";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** 单进程内串行化全库替换，避免并发导入互相覆盖。 */
let importing = false;

/**
 * POST /api/admin/quotes/import
 *   body: .xlsx 文件二进制
 *   ?dryRun=1  仅解析校验并返回预览报告，不写库
 *   无 dryRun  校验通过后事务替换线上名言数据
 *
 * 仅管理员可调用；替换前会自动在 data/backups/ 留一份 JSON 快照。
 */
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const user = getUserBySession(cookieStore.get(SESSION_COOKIE)?.value);
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  if (!user.isAdmin) {
    return NextResponse.json({ error: "仅管理员可导入数据" }, { status: 403 });
  }

  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_IMPORT_BYTES) {
    return NextResponse.json(
      { error: `文件过大，上限 ${Math.floor(MAX_IMPORT_BYTES / 1024 / 1024)}MB` },
      { status: 413 },
    );
  }

  let fileBuffer: ArrayBuffer;
  try {
    fileBuffer = await request.arrayBuffer();
    if (fileBuffer.byteLength > MAX_IMPORT_BYTES) {
      return NextResponse.json(
        { error: `文件过大，上限 ${Math.floor(MAX_IMPORT_BYTES / 1024 / 1024)}MB` },
        { status: 413 },
      );
    }
  } catch {
    return NextResponse.json({ error: "读取上传文件失败" }, { status: 400 });
  }

  // .xlsx 本质是 zip，校验魔数，避免把任意文件交给解析器
  const head = new Uint8Array(fileBuffer, 0, Math.min(4, fileBuffer.byteLength));
  if (head.length < 4 || head[0] !== 0x50 || head[1] !== 0x4b) {
    return NextResponse.json(
      { error: "不是有效的 .xlsx 文件（请先用「一键导出 Excel」获取模板）" },
      { status: 400 },
    );
  }

  let parsed;
  try {
    parsed = await parseWorkbook(fileBuffer);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (parsed.report.errors.length > 0) {
    return NextResponse.json(
      { error: "文件校验未通过，未对线上数据做任何修改", report: parsed.report },
      { status: 422 },
    );
  }

  const dryRun = request.nextUrl.searchParams.get("dryRun") === "1";
  if (dryRun) {
    return NextResponse.json({ ok: true, report: parsed.report });
  }

  if (importing) {
    return NextResponse.json(
      { error: "已有导入任务进行中，请稍后重试" },
      { status: 429 },
    );
  }

  importing = true;
  try {
    // 正式提交前重新取一次当前条数，避免预览后被其他操作改变
    const result = replaceQuotesFromImport(parsed.rows);
    return NextResponse.json({
      ok: true,
      report: parsed.report,
      result: { ...result, backupFile: result.backupFile ? true : false },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[import] 替换失败", err);
    return NextResponse.json({ error: `导入失败：${message}` }, { status: 500 });
  } finally {
    importing = false;
  }
}
