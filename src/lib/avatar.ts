import crypto from "crypto";
import fs from "fs";
import path from "path";

/** 上传图片大小上限（字节）。 */
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

/** 头像文件存放在数据卷内，容器重建后依然保留。 */
export const AVATAR_DIR = path.join(process.cwd(), "data", "avatars");
export const AVATAR_URL_PREFIX = "/api/avatars/";

export interface AvatarFormat {
  ext: "png" | "jpg" | "webp" | "gif";
  mime: string;
}

const MIME_BY_EXT: Record<AvatarFormat["ext"], string> = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
};

const SAFE_MASTER_ID = /^[A-Za-z0-9_-]{1,100}$/;
const SAFE_FILE_NAME = /^[A-Za-z0-9_-]+\.(png|jpg|webp|gif)$/;

export function isSafeMasterId(id: string): boolean {
  return SAFE_MASTER_ID.test(id);
}

export function isSafeAvatarFile(file: string): boolean {
  return SAFE_FILE_NAME.test(file);
}

/** 依据文件魔术字节识别格式，不信任客户端声明的 Content-Type。 */
export function detectAvatarFormat(bytes: Uint8Array): AvatarFormat | null {
  const has = (offset: number, signature: number[]) =>
    signature.every((b, i) => bytes[offset + i] === b);

  if (bytes.length >= 8 && has(0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { ext: "png", mime: MIME_BY_EXT.png };
  }
  if (bytes.length >= 3 && has(0, [0xff, 0xd8, 0xff])) {
    return { ext: "jpg", mime: MIME_BY_EXT.jpg };
  }
  if (bytes.length >= 4 && has(0, [0x47, 0x49, 0x46, 0x38])) {
    return { ext: "gif", mime: MIME_BY_EXT.gif };
  }
  if (
    bytes.length >= 12 &&
    has(0, [0x52, 0x49, 0x46, 0x46]) &&
    has(8, [0x57, 0x45, 0x42, 0x50])
  ) {
    return { ext: "webp", mime: MIME_BY_EXT.webp };
  }
  return null;
}

/**
 * 保存头像并返回数据库里应存的 URL。
 * 文件名带一次性随机后缀，替换头像后 URL 随之变化，可安全使用强缓存。
 */
export function saveAvatar(
  masterId: string,
  bytes: Buffer,
  format: AvatarFormat,
): string {
  if (!isSafeMasterId(masterId)) {
    throw new Error("非法的大师 ID");
  }
  fs.mkdirSync(AVATAR_DIR, { recursive: true });

  const token = `${Date.now().toString(36)}${crypto.randomBytes(4).toString("hex")}`;
  const filename = `${masterId}-${token}.${format.ext}`;
  fs.writeFileSync(path.join(AVATAR_DIR, filename), bytes, { flag: "wx" });

  // 清理该大师之前的上传文件，避免数据卷里不断堆积旧图
  try {
    for (const existing of fs.readdirSync(AVATAR_DIR)) {
      if (existing === filename || !existing.startsWith(`${masterId}-`)) continue;
      if (isSafeAvatarFile(existing)) {
        fs.rmSync(path.join(AVATAR_DIR, existing), { force: true });
      }
    }
  } catch (err) {
    console.error("[avatar] 清理旧头像失败（不影响本次上传）", err);
  }

  return `${AVATAR_URL_PREFIX}${filename}`;
}

/** 读取已上传的头像；非法文件名或文件不存在时返回 null。 */
export function readAvatar(file: string): { bytes: Buffer; mime: string } | null {
  if (!isSafeAvatarFile(file)) return null;
  const ext = file.slice(file.lastIndexOf(".") + 1) as AvatarFormat["ext"];
  const mime = MIME_BY_EXT[ext];
  if (!mime) return null;
  try {
    const bytes = fs.readFileSync(path.join(AVATAR_DIR, path.basename(file)));
    return { bytes, mime };
  } catch {
    return null;
  }
}
