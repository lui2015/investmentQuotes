// 与 next.config.ts 中的 basePath 保持一致
export const BASE_PATH = "/investmentQuotes";

/** 给以 / 开头的 API/资源路径补上 basePath。 */
export function withBasePath(path: string): string {
  if (!path.startsWith("/")) return path;
  return `${BASE_PATH}${path}`;
}
