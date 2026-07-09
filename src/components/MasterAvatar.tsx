import type { CSSProperties } from "react";

/**
 * 大师头像
 * - 若 master.avatar_url 存在，渲染 <img>（真实头像）
 * - 否则 fallback 到首字 + 渐变圆形
 *
 * 把"完整 wrapper className"（如 "w-10 h-10 rounded-full text-white font-bold text-sm"）
 * 传给 className，组件在 img 模式下会自动追加 `object-cover`，在 fallback 模式下
 * 自动追加 `flex items-center justify-center shrink-0`。
 */
export function MasterAvatar({
  name,
  avatarUrl,
  className,
  fallbackStyle,
}: {
  name: string;
  avatarUrl?: string | null;
  className: string;
  fallbackStyle?: CSSProperties;
}) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${className} object-cover`.trim()}
      />
    );
  }
  return (
    <div
      className={`${className} flex items-center justify-center shrink-0`.trim()}
      style={
        fallbackStyle ?? {
          background: `linear-gradient(135deg, var(--t-avatar-from), var(--t-avatar-to))`,
        }
      }
    >
      {name?.charAt(0) || "?"}
    </div>
  );
}
