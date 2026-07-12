import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import ExcelJS from "exceljs";
import { listQuotesAdmin, getAllQuotesWithInterpretations } from "@/lib/queries";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/quotes
 *   - export=xlsx: 一次导出所有名言（含解读 4 块）为 .xlsx 文件
 *   - search?: 模糊匹配 content_cn / content_en / master_name
 *   - masterId?: 按大师 ID 过滤
 *   - page: 页码（默认 1）
 *   - pageSize: 每页条数（默认 20，最大 100）
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  // 导出模式
  if (searchParams.get("export") === "xlsx") {
    const rows = getAllQuotesWithInterpretations();
    if (rows.length === 0) {
      return NextResponse.json({ error: "暂无数据" }, { status: 404 });
    }

    const wb = new ExcelJS.Workbook();
    wb.creator = "投资名言";
    wb.created = new Date();

    const ws = wb.addWorksheet("名言列表", {
      properties: { tabColor: { argb: "FF10B981" } },
    });

    // 列定义（与表头一致）
    const columns = [
      { key: "id", header: "ID" },
      { key: "content_cn", header: "中文内容" },
      { key: "content_en", header: "英文内容" },
      { key: "master_name_cn", header: "大师（中文）" },
      { key: "master_name_en", header: "大师（英文）" },
      { key: "source", header: "来源" },
      { key: "source_year", header: "年份" },
      { key: "is_featured", header: "推荐" },
      { key: "favorite_count", header: "收藏数" },
      { key: "tags", header: "标签" },
      { key: "core", header: "核心解读" },
      { key: "practice", header: "应用实操" },
      { key: "story", header: "生动案例" },
      { key: "master_view", header: "大师视角" },
      { key: "created_at", header: "创建时间" },
    ];
    ws.columns = columns;

    for (const r of rows) {
      const interp = r.interpretation;
      const tagNames = (r.tags ?? []).map((t) => t.name).join("、");
      const practiceText = interp
        ? interp.practice.map((p, i) => `${i + 1}. ${p}`).join("\n")
        : "";

      ws.addRow({
        id: r.id,
        content_cn: r.content_cn,
        content_en: r.content_en ?? "",
        master_name_cn: r.master_name_cn,
        master_name_en: r.master_name_en ?? "",
        source: r.source ?? "",
        source_year: r.source_year ?? "",
        is_featured: r.is_featured === 1 ? "是" : "否",
        favorite_count: r.favorite_count,
        tags: tagNames,
        core: interp ? interp.core : "",
        practice: practiceText,
        story: interp ? interp.story : "",
        master_view: interp ? (interp.master_view ?? "") : "",
        created_at: r.created_at,
      });
    }

    // 自动列宽（基于内容长度，上限 50）
    for (const col of ws.columns) {
      if (!col.header) continue;
      const headerLen = col.header.length;
      let maxLen = 0;
      const values = col.values;
      if (values) {
        for (let i = 1; i < values.length; i++) {
          const cell = values[i];
          if (cell === undefined) continue;
          const s = String(cell);
          for (const line of s.split("\n")) {
            maxLen = Math.max(maxLen, line.length);
          }
        }
      }
      col.width = Math.max(Math.min(50, headerLen + 2), Math.min(50, maxLen + 2), 10);
    }

    // 冻结首行
    ws.views = [{ state: "frozen", ySplit: 1 }];

    // 首行样式
    const headerRow = ws.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF10B981" },
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });

    // 流式写入响应
    const buffer = await wb.xlsx.writeBuffer();
    const now = new Date();
    const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
      now.getDate(),
    ).padStart(2, "0")}`;
    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=quotes_${stamp}.xlsx`,
      },
    });
  }

  // 列表模式
  const pageRaw = Number.parseInt(searchParams.get("page") || "1", 10);
  const sizeRaw = Number.parseInt(searchParams.get("pageSize") || "20", 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const pageSize = Math.min(
    100,
    Math.max(1, Number.isFinite(sizeRaw) && sizeRaw > 0 ? sizeRaw : 20),
  );

  const search = (searchParams.get("search") || "").trim() || undefined;
  const masterId = (searchParams.get("masterId") || "").trim() || undefined;

  const result = listQuotesAdmin({ search, masterId, page, pageSize });
  return NextResponse.json(result);
}
