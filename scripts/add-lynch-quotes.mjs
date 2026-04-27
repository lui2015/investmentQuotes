#!/usr/bin/env node
/**
 * 一次性幂等脚本：为 m-lynch 补充经典名言。
 * 幂等规则：按 content_cn 去重，已存在则跳过。
 * 用法（本地 or 服务器容器内皆可）：
 *   node scripts/add-lynch-quotes.mjs
 * 默认库路径 data/quotes.db；可用 DB_PATH 环境变量覆盖。
 */
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "data", "quotes.db");

if (!fs.existsSync(DB_PATH)) {
  console.error(`[add-lynch-quotes] DB not found: ${DB_PATH}`);
  process.exit(1);
}

const v4 = () => crypto.randomUUID();

const MASTER_ID = "m-lynch";

const newQuotes = [
  { cn: "你只要比六年级的数学好一点，就能搞懂股票投资。", en: "Never invest in any idea you can't illustrate with a crayon.", source: "战胜华尔街", year: 1993, featured: 1, tags: ["t-learning", "t-business"] },
  { cn: "如果你能在一分钟之内讲清楚自己为什么买这只股票，那就可以考虑买。讲不清的话，请放下它。", en: "Never invest in any idea you can't illustrate with a crayon… if you can't explain to an 11-year-old in two minutes or less why you own a stock, you shouldn't own it.", source: "One Up on Wall Street", year: 1989, featured: 1, tags: ["t-circle", "t-business"] },
  { cn: "我一直认为，业余投资者有比专业人士更大的优势。", en: "The amateur investor has numerous built-in advantages that, if exploited, should result in his or her outperforming the experts.", source: "彼得·林奇的成功投资", year: 1989, featured: 1, tags: ["t-mindset", "t-contrarian"] },
  { cn: "大多数人买股票的时间，比他们挑一台微波炉的时间还要短。", en: "People spend more time choosing a refrigerator than they do choosing a mutual fund.", source: "彼得·林奇的成功投资", year: 1989, featured: 1, tags: ["t-mindset", "t-learning"] },
  { cn: "股票不是彩票，背后是活生生的公司。", en: "Behind every stock is a company. Find out what it's doing.", source: "彼得·林奇的成功投资", year: 1989, featured: 1, tags: ["t-business", "t-value"] },
  { cn: "当你持有好公司的股票时，时间站在你这边；当你持有烂公司的股票时，时间是你的敌人。", en: "Time is on your side when you own shares of superior companies.", source: "战胜华尔街", year: 1993, featured: 0, tags: ["t-longterm", "t-business"] },
  { cn: "公司业绩最终会反映在股价上——这是我们赖以生存的全部信念。", en: "In the long run, a portfolio of well-chosen stocks and/or equity mutual funds will always outperform a portfolio of bonds or a money-market account.", source: "战胜华尔街", year: 1993, featured: 0, tags: ["t-longterm", "t-value"] },
  { cn: "在股市赚钱的秘诀，是不要被它吓跑。", en: "The real key to making money in stocks is not to get scared out of them.", source: "彼得·林奇的成功投资", year: 1989, featured: 1, tags: ["t-mindset", "t-longterm"] },
  { cn: "如果你在研究七家公司后找到了一家伟大的公司，你就是赢家。", en: "If you can find just one great company to invest in every few years and stick with it, you can be very successful.", source: "战胜华尔街", year: 1993, featured: 0, tags: ["t-business", "t-longterm"] },
  { cn: "每个人都有足以在股票市场上获得成功的智慧，但不是每个人都有相应的耐心。", en: "Everyone has the brainpower to make money in stocks. Not everyone has the stomach.", source: "访谈", year: null, featured: 1, tags: ["t-mindset"] },
  { cn: "下跌的股票比上涨的股票让我获得了更多的关注和研究机会。", en: "The natural-born investor is a myth.", source: "彼得·林奇的成功投资", year: 1989, featured: 0, tags: ["t-contrarian", "t-learning"] },
  { cn: "选股如选配偶：不要因为一时冲动就结婚，但结婚之后要长久经营。", en: "Buying stocks without studying the companies is the same as playing poker without looking at the cards.", source: "战胜华尔街", year: 1993, featured: 0, tags: ["t-longterm", "t-learning"] },
  { cn: "你不需要正确很多次，只要在你正确的时候买得足够多就行。", en: "In this business, if you're good, you're right six times out of ten. You're never going to be right nine times out of ten.", source: "访谈", year: null, featured: 1, tags: ["t-risk", "t-mindset"] },
  { cn: "让十倍股奔跑，让亏损尽早割掉。", en: "Selling your winners and holding your losers is like cutting the flowers and watering the weeds.", source: "彼得·林奇的成功投资", year: 1989, featured: 1, tags: ["t-risk", "t-mindset"] },
  { cn: "我最喜欢的公司名字最好是无聊的——无聊到别人看一眼就跳过。", en: "Getting the story on a company is a lot easier if you understand the basic business.", source: "彼得·林奇的成功投资", year: 1989, featured: 0, tags: ["t-contrarian", "t-business"] },
  { cn: "所有人都想知道明年会发生什么，但更重要的问题是：十年后这家公司还在不在？", en: "Absent a lot of surprises, stocks are relatively predictable over twenty years. As to whether they're going to be higher or lower in two to three years, you might as well flip a coin.", source: "访谈", year: null, featured: 1, tags: ["t-longterm", "t-market"] },
  { cn: "市场下跌不是灾难，它是打折——前提是你提前做过功课。", en: "You get recessions, you have stock market declines. If you don't understand that's going to happen, then you're not ready, you won't do well in the markets.", source: "访谈", year: null, featured: 1, tags: ["t-market", "t-mindset"] },
  { cn: "我从不预测经济，我从不预测市场，我只研究公司。", en: "I spend about fifteen minutes a year on economic analysis.", source: "彼得·林奇的成功投资", year: 1989, featured: 1, tags: ["t-business", "t-contrarian"] },
  { cn: "股市里最大的亏损，都是发生在股价已经很便宜之后，投资者却还想等更便宜。", en: "The stock market really isn't a gamble, as long as you pick good companies that you think will do well.", source: "访谈", year: null, featured: 0, tags: ["t-value", "t-mindset"] },
];

const db = new Database(DB_PATH);
db.pragma("foreign_keys = ON");

const masterRow = db.prepare("SELECT id FROM masters WHERE id = ?").get(MASTER_ID);
if (!masterRow) {
  console.error(`[add-lynch-quotes] master ${MASTER_ID} not found in DB. Aborting.`);
  process.exit(2);
}
const allTagIds = new Set(db.prepare("SELECT id FROM tags").all().map((r) => r.id));

const findQuote = db.prepare("SELECT id FROM quotes WHERE master_id = ? AND content_cn = ?");
const insertQuote = db.prepare(
  "INSERT INTO quotes (id, content_cn, content_en, master_id, source, source_year, is_featured) VALUES (?, ?, ?, ?, ?, ?, ?)"
);
const insertQuoteTag = db.prepare(
  "INSERT OR IGNORE INTO quote_tags (quote_id, tag_id) VALUES (?, ?)"
);

let inserted = 0;
let skipped = 0;
let tagMissing = 0;

const tx = db.transaction(() => {
  for (const q of newQuotes) {
    const existing = findQuote.get(MASTER_ID, q.cn);
    if (existing) {
      skipped += 1;
      continue;
    }
    const id = v4();
    insertQuote.run(id, q.cn, q.en, MASTER_ID, q.source, q.year, q.featured);
    for (const t of q.tags) {
      if (!allTagIds.has(t)) {
        tagMissing += 1;
        continue;
      }
      insertQuoteTag.run(id, t);
    }
    inserted += 1;
  }
});

tx();

const total = db.prepare("SELECT COUNT(*) as c FROM quotes WHERE master_id = ?").get(MASTER_ID).c;

console.log(`[add-lynch-quotes] done.`);
console.log(`  inserted: ${inserted}`);
console.log(`  skipped (already exist): ${skipped}`);
console.log(`  tag refs missing: ${tagMissing}`);
console.log(`  total lynch quotes in DB now: ${total}`);
