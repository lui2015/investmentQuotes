// 与 next.config.ts 中的 basePath 保持一致。
// 线上多应用共享同一域名，通过子路径区分，Nginx 将 /investmentQuotes 原样转发，
// 因此本应用必须部署在 /investmentQuotes 子路径下。
export const BASE_PATH = "/investmentQuotes";

/** 给以 / 开头的 API/资源路径补上 basePath。 */
export function withBasePath(path: string): string {
  if (!path.startsWith("/")) return path;
  return `${BASE_PATH}${path}`;
}
