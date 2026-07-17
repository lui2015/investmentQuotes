import { BASE_PATH } from "./basePath";

/**
 * 站点级 SEO 配置集中管理。
 *
 * SITE_ORIGIN：站点根域名（协议 + 域名），通过环境变量 NEXT_PUBLIC_SITE_URL 配置。
 *   ⚠️ 生产环境务必设置为正式域名（如 https://quotes.example.com），
 *   否则用 IP 会严重影响搜索引擎收录与排名。
 * SITE_URL：站点实际访问根地址（含 basePath 子路径 /investmentQuotes）。
 */
export const SITE_ORIGIN = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://159.75.56.177"
).replace(/\/+$/, "");

export const SITE_URL = `${SITE_ORIGIN}${BASE_PATH}`;

export const SITE_NAME = "投资名言 · 大师智慧库";

export const SITE_DESCRIPTION =
  "投资名言精选：汇集巴菲特、查理·芒格、段永平、彼得·林奇等投资大师的经典名言与语录，涵盖价值投资、心态修炼、人生哲学，每日更新，中英对照。";

export const SITE_KEYWORDS = [
  "投资名言",
  "投资语录",
  "投资大师名言",
  "价值投资",
  "巴菲特名言",
  "查理芒格名言",
  "段永平语录",
  "彼得林奇",
  "股市名言",
  "投资金句",
  "经典投资语录",
];

/** 生成绝对 URL：传入以 / 开头的站内路径（不含 basePath） */
export function absoluteUrl(path = ""): string {
  if (!path) return SITE_URL;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${p}`;
}
