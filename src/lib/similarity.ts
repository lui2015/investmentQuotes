/**
 * 名言相似度算法
 * 
 * 策略：
 * 1. 文本规范化：去除标点、空格、大小写差异
 * 2. Bigram（二元字符）Jaccard 相似度：适合中文短文本
 * 3. 大师姓名匹配加权：同一大师的相似名言更可能是重复
 * 4. 加入 Levenshtein 长度差惩罚：长度差异大时降低相似度
 */

/** 规范化文本：去掉标点符号、空白、统一小写 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\s\u3000]/g, "")
    .replace(/[""''""''「」『』（）()【】\[\]，。！？、；：""''""''.!?,;:—\-…·]/g, "")
    .trim();
}

/** 获取字符 bigrams（连续两字组合） */
function bigrams(text: string): Set<string> {
  const result = new Set<string>();
  const chars = Array.from(text);
  if (chars.length < 2) {
    if (chars.length === 1) result.add(chars[0]);
    return result;
  }
  for (let i = 0; i < chars.length - 1; i++) {
    result.add(chars[i] + chars[i + 1]);
  }
  return result;
}

/** Jaccard 相似度：交集/并集 */
function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const item of a) {
    if (b.has(item)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return intersection / union;
}

/**
 * 计算两条名言内容的相似度（0~1）
 * - 1.0 完全相同
 * - >= 0.85 视为高度重复
 * - >= 0.65 视为可疑
 */
export function contentSimilarity(a: string, b: string): number {
  const na = normalizeText(a);
  const nb = normalizeText(b);

  if (!na || !nb) return 0;
  if (na === nb) return 1;

  // 长度差惩罚：若长度差异 > 60% 则降权
  const lenA = na.length;
  const lenB = nb.length;
  const lenRatio = Math.min(lenA, lenB) / Math.max(lenA, lenB);
  if (lenRatio < 0.4) return 0;

  const simBigram = jaccard(bigrams(na), bigrams(nb));

  // 短包含关系加分：一方是另一方的子串
  const shorter = lenA < lenB ? na : nb;
  const longer = lenA < lenB ? nb : na;
  const containsBonus = longer.includes(shorter) ? 0.2 : 0;

  return Math.min(1, simBigram + containsBonus);
}

/** 判断两个大师名字是否指向同一人（简单归一化匹配） */
export function isSameMaster(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  const na = normalizeText(a);
  const nb = normalizeText(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  // 一方是另一方子串（如"巴菲特"vs"沃伦·巴菲特"）
  return na.includes(nb) || nb.includes(na);
}

/**
 * 综合相似度评分：同大师的相似名言权重更高
 */
export function combinedSimilarity(
  contentA: string,
  masterA: string | null,
  contentB: string,
  masterB: string | null,
): { score: number; sameMaster: boolean; contentSim: number } {
  const contentSim = contentSimilarity(contentA, contentB);
  const sameMaster = isSameMaster(masterA, masterB);

  // 同大师 → 提高至 min(1, +0.1)；不同大师 → 降权到 0.9x
  let score = contentSim;
  if (sameMaster) {
    score = Math.min(1, contentSim + 0.1);
  } else {
    score = contentSim * 0.9;
  }
  return { score, sameMaster, contentSim };
}

/** 阈值配置 */
export const DEDUPE_THRESHOLDS = {
  /** 高度重复：自动去重（rejected） */
  DUPLICATE: 0.85,
  /** 疑似重复：需人工审核（此版本仍标记为 pending） */
  SUSPICIOUS: 0.65,
};
