#!/usr/bin/env node
/**
 * 一次性幂等脚本：为 m-soros 补充经典名言。
 * 幂等规则：按 content_cn 去重，已存在则跳过。
 * 用法（本地 or 服务器容器内皆可）：
 *   node scripts/add-soros-quotes.mjs
 * 默认库路径 data/quotes.db；可用 DB_PATH 环境变量覆盖。
 */
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "data", "quotes.db");

if (!fs.existsSync(DB_PATH)) {
  console.error(`[add-soros-quotes] DB not found: ${DB_PATH}`);
  process.exit(1);
}

const v4 = () => crypto.randomUUID();

const MASTER_ID = "m-soros";

const newQuotes = [
  { cn: "金融市场从来不反映真实状况，它们永远反映的是参与者对真实状况的扭曲看法。", en: "Financial markets generally are unpredictable, so that one has to have different scenarios… The idea that you can actually predict what's going to happen contradicts my way of looking at the market.", source: "索罗斯谈索罗斯", year: 1995, featured: 1, tags: ["t-market", "t-mindset"] },
  { cn: "我比别人更会赚钱，是因为我更快地承认自己的错误。", en: "I'm only rich because I know when I'm wrong… I basically have survived by recognizing my mistakes.", source: "彭博电视访谈", year: null, featured: 1, tags: ["t-mindset", "t-risk"] },
  { cn: "反身性理论的关键在于：参与者的认知和市场本身会相互影响，彼此塑造。", en: "Reflexivity sets up a feedback loop between market valuations and the so-called fundamentals which are being valued.", source: "金融炼金术", year: 1987, featured: 1, tags: ["t-market", "t-philosophy"] },
  { cn: "我们对世界的看法永远是不完整的、有偏见的——我把这叫作『易错性』。", en: "All human constructs are flawed. This applies both to our understanding of reality and to our institutions.", source: "开放社会", year: 2000, featured: 0, tags: ["t-philosophy", "t-mindset"] },
  { cn: "先生存，再赚钱。", en: "Survive first and make money afterwards.", source: "访谈", year: null, featured: 1, tags: ["t-risk", "t-mindset"] },
  { cn: "我不是根据规则玩游戏的，我是在寻找游戏规则的改变。", en: "I don't play the game by a particular set of rules; I look for changes in the rules of the game.", source: "索罗斯谈索罗斯", year: 1995, featured: 0, tags: ["t-contrarian", "t-market"] },
  { cn: "当一个趋势盛行时，它本身就会强化它所依赖的那些条件，直到它们最终走向崩溃。", en: "Every bubble consists of a trend and a misconception that interact in a reflexive manner.", source: "金融市场新范式", year: 2008, featured: 1, tags: ["t-market", "t-contrarian"] },
  { cn: "股市泡沫不会凭空出现，它们有坚实的基础——只是这些基础被认知扭曲了。", en: "Stock market bubbles don't grow out of thin air. They have a solid basis in reality, but reality as distorted by a misconception.", source: "金融市场新范式", year: 2008, featured: 0, tags: ["t-market"] },
  { cn: "如果投资是一件让你觉得有趣的事，那你八成没有赚到钱。好的投资是枯燥的。", en: "If investing is entertaining, if you're having fun, you're probably not making any money. Good investing is boring.", source: "访谈", year: null, featured: 0, tags: ["t-mindset", "t-philosophy"] },
  { cn: "我只在我看到靶心时才开枪。", en: "I only go to work on the days that make sense to go to work. And I really do something on that day. But you figure that's one day a month. The rest of the time I'm just hanging out.", source: "Jim Rogers 访谈回忆", year: null, featured: 0, tags: ["t-mindset", "t-risk"] },
  { cn: "当你看到泡沫正在形成时，正确的做法不是做空它，而是骑上它，然后在破灭前下车。", en: "When I see a bubble forming, I rush in to buy, adding fuel to the fire. That is not irrational.", source: "达沃斯论坛演讲", year: 2009, featured: 1, tags: ["t-contrarian", "t-market"] },
  { cn: "我比大多数人更善于预见趋势的终点，因为我在趋势中始终抱着怀疑。", en: "I'm not better at predicting events, as I can't. I'm better at recognizing when I'm wrong.", source: "访谈", year: null, featured: 0, tags: ["t-mindset", "t-contrarian"] },
  { cn: "错误不会伤害你，拒绝承认错误才会。", en: "Once we realize that imperfect understanding is the human condition there is no shame in being wrong, only in failing to correct our mistakes.", source: "金融市场新范式", year: 2008, featured: 1, tags: ["t-mindset", "t-learning"] },
  { cn: "当我意识到我错了，我会立刻认错、马上行动，其他的情绪都留给之后。", en: "My approach works not by making valid predictions but by allowing me to correct false ones.", source: "金融炼金术", year: 1987, featured: 0, tags: ["t-mindset", "t-learning"] },
  { cn: "市场是一个最极端的『易错性』实验室——它在不断用真实亏损来教你谦卑。", en: "Markets are constantly in a state of flux; markets are always wrong.", source: "索罗斯谈索罗斯", year: 1995, featured: 0, tags: ["t-market", "t-philosophy"] },
  { cn: "我的成功并不来自猜对结果，而来自识别自己最初的假设何时不再成立。", en: "My conceptual framework enables me to be both a player and an observer... I recognize that I may be wrong.", source: "索罗斯谈索罗斯", year: 1995, featured: 0, tags: ["t-mindset", "t-learning"] },
  { cn: "当你对一笔交易没有把握时，最好的位置是场外。", en: "The worst mistake you can make is to be caught up in a trend you don't really believe in.", source: "访谈", year: null, featured: 0, tags: ["t-risk", "t-mindset"] },
  { cn: "我赚大钱的方式从来不是靠细节，而是靠宏大的图景——然后用小仓位去验证它。", en: "Whenever I can, I take a broad view. The big money is made by getting the big picture right.", source: "索罗斯谈索罗斯", year: 1995, featured: 1, tags: ["t-market", "t-learning"] },
  { cn: "金融市场的运作原理，归根结底和自然科学完全不同：它研究的是『正在塑造自身』的现象。", en: "Social phenomena are different from natural phenomena because they have thinking participants who influence what happens.", source: "开放社会", year: 2000, featured: 0, tags: ["t-philosophy", "t-market"] },
  { cn: "当事情明显不对劲却每个人都装作没事，那就是最大的风险信号。", en: "The prevailing wisdom is that markets are always right. I take the opposite position. I assume that markets are always wrong.", source: "金融炼金术", year: 1987, featured: 1, tags: ["t-risk", "t-contrarian"] },
];

const db = new Database(DB_PATH);
db.pragma("foreign_keys = ON");

// 预检：确认 master 和 tags 都存在
const masterRow = db.prepare("SELECT id FROM masters WHERE id = ?").get(MASTER_ID);
if (!masterRow) {
  console.error(`[add-soros-quotes] master ${MASTER_ID} not found in DB. Aborting.`);
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

console.log(`[add-soros-quotes] done.`);
console.log(`  inserted: ${inserted}`);
console.log(`  skipped (already exist): ${skipped}`);
console.log(`  tag refs missing: ${tagMissing}`);
console.log(`  total soros quotes in DB now: ${total}`);
