import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  deleteQuote,
  getQuoteById,
  updateQuote,
  type UpdateQuotePatch,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/admin/quotes/[id]
 *   body: 任意子集 { content_cn, content_en, master_id, source, source_year, is_featured }
 *   - master_id 必须指向已存在的大师
 *   - is_featured 只接受 0 / 1
 *   - 至少包含一个可更新字段
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const existing = getQuoteById(id);
  if (!existing) {
    return NextResponse.json({ error: "quote not found" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json body" }, { status: 400 });
  }

  const patch: UpdateQuotePatch = {};

  if (body.content_cn !== undefined) {
    if (typeof body.content_cn !== "string" || !body.content_cn.trim()) {
      return NextResponse.json(
        { error: "content_cn 不能为空" },
        { status: 400 },
      );
    }
    patch.content_cn = body.content_cn.trim();
  }

  if (body.content_en !== undefined) {
    if (body.content_en === null || body.content_en === "") {
      patch.content_en = null;
    } else if (typeof body.content_en === "string") {
      patch.content_en = body.content_en.trim();
    } else {
      return NextResponse.json(
        { error: "content_en 必须是字符串或 null" },
        { status: 400 },
      );
    }
  }

  if (body.master_id !== undefined) {
    if (typeof body.master_id !== "string" || !body.master_id.trim()) {
      return NextResponse.json(
        { error: "master_id 必须是非空字符串" },
        { status: 400 },
      );
    }
    patch.master_id = body.master_id.trim();
  }

  if (body.source !== undefined) {
    if (body.source === null || body.source === "") {
      patch.source = null;
    } else if (typeof body.source === "string") {
      patch.source = body.source.trim();
    } else {
      return NextResponse.json(
        { error: "source 必须是字符串或 null" },
        { status: 400 },
      );
    }
  }

  if (body.source_year !== undefined) {
    if (body.source_year === null || body.source_year === "") {
      patch.source_year = null;
    } else {
      const year = Number(body.source_year);
      if (!Number.isFinite(year) || year < 0 || year > 9999) {
        return NextResponse.json(
          { error: "source_year 必须是 0-9999 的数字" },
          { status: 400 },
        );
      }
      patch.source_year = Math.trunc(year);
    }
  }

  if (body.is_featured !== undefined) {
    const v = body.is_featured;
    if (v === 0 || v === 1 || v === "0" || v === "1" || v === true || v === false) {
      patch.is_featured = v === true || v === 1 || v === "1" ? 1 : 0;
    } else {
      return NextResponse.json(
        { error: "is_featured 必须是 0 或 1" },
        { status: 400 },
      );
    }
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json(
      { error: "至少提供一个可更新字段" },
      { status: 400 },
    );
  }

  try {
    const updated = updateQuote(id, patch);
    if (!updated) {
      return NextResponse.json({ error: "update failed" }, { status: 500 });
    }
    return NextResponse.json(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/quotes/[id]
 *   - 删除名言并级联清理 quote_tags 关联
 *   - 不会影响 daily_quotes / quote_submissions / quote_interpretations
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const ok = deleteQuote(id);
    if (!ok) {
      return NextResponse.json({ error: "quote not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
