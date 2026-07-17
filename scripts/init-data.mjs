#!/usr/bin/env node
/**
 * 在 Docker 构建时执行：初始化数据库（名言 + 解读）
 * 
 * 用法：node scripts/init-data.mjs
 */

import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';

const require = createRequire(import.meta.url);
const D = require('better-sqlite3');

// Ensure data directory exists
if (!fs.existsSync('./data')) {
  fs.mkdirSync('./data', { recursive: true });
}

const db = new D('./data/quotes.db');
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables if not exist
const createTablesSQL = `
CREATE TABLE IF NOT EXISTS masters (
  id TEXT PRIMARY KEY,
  name_cn TEXT NOT NULL,
  name_en TEXT,
  avatar_url TEXT,
  title TEXT,
  bio TEXT,
  born_year INTEGER,
  nationality TEXT,
  category TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT,
  description TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS quotes (
  id TEXT PRIMARY KEY,
  content_cn TEXT NOT NULL,
  content_en TEXT,
  master_id TEXT NOT NULL,
  source TEXT,
  source_year INTEGER,
  is_featured INTEGER DEFAULT 0,
  favorite_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (master_id) REFERENCES masters(id)
);
CREATE TABLE IF NOT EXISTS quote_tags (
  quote_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (quote_id, tag_id),
  FOREIGN KEY (quote_id) REFERENCES quotes(id),
  FOREIGN KEY (tag_id) REFERENCES tags(id)
);
CREATE TABLE IF NOT EXISTS quote_interpretations (
  quote_id TEXT PRIMARY KEY,
  core TEXT NOT NULL,
  practice TEXT NOT NULL,
  story TEXT NOT NULL,
  master_view TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (quote_id) REFERENCES quotes(id)
);
`;
db.exec(createTablesSQL);

// Insert masters if not exist
const insertMastersSQL = `
INSERT OR IGNORE INTO masters (id, name_cn, name_en, avatar_url, title, bio, born_year, nationality, category) VALUES
('m-buffett', '沃伦·巴菲特', 'Warren Buffett', '/avatars/buffett.png', '奥马哈先知', '伯克希尔·哈撒韦公司董事长兼CEO', 1930, '美国', '价值投资'),
('m-munger', '查理·芒格', 'Charlie Munger', '/avatars/munger.png', '多元思维模型大师', '伯克希尔·哈撒韦公司副董事长', 1924, '美国', '价值投资'),
('m-graham', '本杰明·格雷厄姆', 'Benjamin Graham', '/avatars/graham.png', '价值投资之父', '现代证券分析之父', 1894, '美国', '价值投资'),
('m-lynch', '彼得·林奇', 'Peter Lynch', '/avatars/lynch.png', '传奇基金经理', '富达麦哲伦基金经理', 1944, '美国', '成长投资'),
('m-soros', '乔治·索罗斯', 'George Soros', '/avatars/soros.png', '金融巨鳄', '量子基金创始人', 1930, '美国', '宏观对冲'),
('m-dalio', '瑞·达利欧', 'Ray Dalio', '/avatars/dalio.png', '原则先生', '桥水基金创始人', 1949, '美国', '宏观对冲'),
('m-marks', '霍华德·马克斯', 'Howard Marks', '/avatars/marks.png', '周期大师', '橡树资本联合创始人', 1946, '美国', '价值投资'),
('m-bogle', '约翰·博格', 'John Bogle', NULL, '指数基金之父', '先锋集团创始人', 1929, '美国', '指数投资'),
('m-fisher', '菲利普·费雪', 'Philip Fisher', NULL, '成长投资先驱', '成长股投资策略的开创者', 1907, '美国', '成长投资'),
('m-livermore', '杰西·利弗莫尔', 'Jesse Livermore', '/avatars/livermore.png', '华尔街传奇操盘手', '20世纪初最著名的股票交易员', 1877, '美国', '投机'),
('m-taleb', '纳西姆·塔勒布', 'Nassim Taleb', '/avatars/taleb.png', '黑天鹅之父', '风险管理专家', 1960, '黎巴嫩', '风险管理'),
('m-klarman', '塞思·卡拉曼', 'Seth Klarman', NULL, '价值投资大师', 'Baupost基金掌门人', 1957, '美国', '价值投资');
`;
db.exec(insertMastersSQL);

// Update avatar_url for masters that have avatars (only if currently NULL)
const updateAvatarsSQL = `
UPDATE masters SET avatar_url = '/avatars/buffett.png' WHERE id = 'm-buffett' AND avatar_url IS NULL;
UPDATE masters SET avatar_url = '/avatars/munger.png' WHERE id = 'm-munger' AND avatar_url IS NULL;
UPDATE masters SET avatar_url = '/avatars/graham.png' WHERE id = 'm-graham';
UPDATE masters SET avatar_url = '/avatars/soros.png' WHERE id = 'm-soros';
UPDATE masters SET avatar_url = '/avatars/marks.png' WHERE id = 'm-marks';
UPDATE masters SET avatar_url = '/avatars/lynch.png' WHERE id = 'm-lynch';
UPDATE masters SET avatar_url = '/avatars/dalio.png' WHERE id = 'm-dalio';
UPDATE masters SET avatar_url = '/avatars/livermore.png' WHERE id = 'm-livermore';
UPDATE masters SET avatar_url = '/avatars/taleb.png' WHERE id = 'm-taleb';
UPDATE masters SET avatar_url = '/avatars/bogle.png' WHERE id = 'm-bogle';
UPDATE masters SET avatar_url = '/avatars/fisher.png' WHERE id = 'm-fisher';
UPDATE masters SET avatar_url = '/avatars/klarman.png' WHERE id = 'm-klarman';
`;
db.exec(updateAvatarsSQL);

// Insert tags if not exist
const insertTagsSQL = `
INSERT OR IGNORE INTO tags (id, name, slug, description) VALUES
('t-value', '价值投资', 'value-investing', '关于内在价值、安全边际、低估买入'),
('t-longterm', '长期主义', 'long-term', '关于耐心、复利、时间的力量'),
('t-risk', '风险管理', 'risk-management', '关于风控、止损、分散投资'),
('t-contrarian', '逆向思维', 'contrarian', '关于独立思考、反人性、逆向投资'),
('t-circle', '能力圈', 'circle-of-competence', '关于认知边界、专注、知之为知之'),
('t-market', '市场认知', 'market-insight', '关于市场本质、周期、波动'),
('t-mindset', '心态修炼', 'mindset', '关于情绪控制、纪律、理性'),
('t-learning', '学习成长', 'learning', '关于阅读、思维模型、终身学习'),
('t-business', '企业分析', 'business-analysis', '关于护城河、商业模式、竞争优势'),
('t-philosophy', '人生哲学', 'life-philosophy', '关于人生、财富、幸福的感悟')
`;
db.exec(insertTagsSQL);

// Insert initial quotes from seed.ts (with fixed IDs for matching)
const insertInitialQuotesSQL = `
INSERT OR IGNORE INTO quotes (id, content_cn, content_en, master_id, source, source_year, is_featured) VALUES
('q-buffett-001', '价格是你付出的，价值是你得到的。', 'Price is what you pay. Value is what you get.', 'm-buffett', '致股东的信', 2008, 1),
('q-buffett-002', '我们最喜欢的持有期是永远。', 'Our favorite holding period is forever.', 'm-buffett', '致股东的信', 1988, 1),
('q-buffett-003', '投资的第一条规则是不要亏钱，第二条规则是不要忘记第一条。', 'Rule No.1: Never lose money. Rule No.2: Never forget rule No.1.', 'm-buffett', '伯克希尔股东大会', NULL, 1),
('q-buffett-004', '别人贪婪时我恐惧，别人恐惧时我贪婪。', 'Be fearful when others are greedy and greedy when others are fearful.', 'm-buffett', '致股东的信', 2004, 1),
('q-buffett-005', '以合理的价格买入伟大的公司，远胜于以便宜的价格买入平庸的公司。', 'It''s far better to buy a wonderful company at a fair price than a fair company at a wonderful price.', 'm-buffett', '致股东的信', 1989, 1),
('q-buffett-006', '永远不要投资你不了解的生意。', 'Never invest in a business you cannot understand.', 'm-buffett', '伯克希尔股东大会', NULL, 0),
('q-buffett-007', '如果你不愿意持有一只股票十年，那就连十分钟也不要持有。', 'If you aren''t willing to own a stock for ten years, don''t even think about owning it for ten minutes.', 'm-buffett', '致股东的信', 1996, 0),
('q-buffett-008', '在投资中，最重要的品质不是智力，而是气质。', 'The most important quality for an investor is temperament, not intellect.', 'm-buffett', '访谈', NULL, 0),
('q-buffett-009', '当潮水退去，才知道谁在裸泳。', 'Only when the tide goes out do you discover who''s been swimming naked.', 'm-buffett', '致股东的信', 2001, 1),
('q-buffett-010', '时间是优秀企业的朋友，是平庸企业的敌人。', 'Time is the friend of the wonderful company, the enemy of the mediocre.', 'm-buffett', '致股东的信', 1989, 0),
('q-munger-001', '知道自己不知道什么，比聪明更重要。', 'Knowing what you don''t know is more useful than being brilliant.', 'm-munger', '穷查理宝典', NULL, 1),
('q-munger-002', '我这辈子遇到的聪明人，没有不每天阅读的，一个都没有。', 'In my whole life, I have known no wise people who didn''t read all the time — none, zero', 'm-munger', '穷查理宝典', NULL, 1),
('q-munger-003', '反过来想，总是反过来想。', 'Invert, always invert.', 'm-munger', '穷查理宝典', NULL, 1),
('q-munger-004', '如果我知道我会在哪里死去，我就永远不会去那个地方。', 'All I want to know is where I''m going to die, so I''ll never go there.', 'm-munger', '穷查理宝典', NULL, 0),
('q-graham-001', '市场短期是投票机，长期是称重机。', 'In the short run, the market is a voting machine but in the long run, it is a weighing machine.', 'm-graham', '聪明的投资者', 1949, 1),
('q-graham-002', '投资者最大的敌人不是股票市场，而是他自己。', 'The investor''s chief problem — and even his worst enemy — is likely to be himself', 'm-graham', '聪明的投资者', 1949, 1),
('q-graham-003', '安全边际的目的是让准确的预测变得不必要。', 'The purpose of the margin of safety is to render accurate prediction unnecessary.', 'm-graham', '聪明的投资者', 1949, 1),
('q-lynch-001', '投资你所了解的。', 'Invest in what you know.', 'm-lynch', '彼得·林奇的成功投资', 1989, 1),
('q-lynch-002', '不做研究就投资，和不看牌就玩扑克一样荒唐。', 'Investing without research is like playing stud poker and never looking at the cards.', 'm-lynch', '战胜华尔街', 1993, 0),
('q-lynch-003', '股市下跌就像科罗拉多一月的暴风雪一样寻常，如果你有准备，它不会伤害你。', 'A stock market decline is as routine as a January blizzard in Colorado. If you''re prepared, it can''t hurt you.', 'm-lynch', '战胜华尔街', 1993, 1),
('q-soros-001', '重要的不是你做对或做错了，而是你做对时赚了多少，做错时亏了多少。', 'It''s not whether you''re right or wrong that''s important, but how much money you make when you''re right and how much you lose when you''re wrong.', 'm-soros', '索罗斯谈索罗斯', 1995, 1),
('q-soros-002', '市场永远处于不确定和波动之中，通过押注出乎意料的事物来赚钱。', 'Markets are constantly in a state of uncertainty and flux, and money is made by discounting the obvious and betting on the unexpected.', 'm-soros', '金融炼金术', 1987, 0),
('q-soros-003', '我比别人更会赚钱，是因为我更快地承认自己的错误。', 'I''m only rich because I know when I''m wrong… I basically have survived by recognizing my mistakes', 'm-soros', '彭博电视访谈', NULL, 1),
('q-dalio-001', '痛苦+反思=进步。', 'Pain + Reflection = Progress.', 'm-dalio', '原则', 2017, 1),
('q-dalio-002', '如果你不感到担忧，你担忧得还不够；如果你过于担忧，你就做不成任何事。', 'If you''re not worried, you need to worry — and if you''re worried, you don''t need to worry.', 'm-dalio', '原则', 2017, 0),
('q-dalio-003', '最大的错误是无法看到自己的盲点。', 'The biggest mistake you can make is not seeing your own blind spots.', 'm-dalio', '原则', 2017, 0),
('q-dalio-004', '分散投资是投资中唯一的免费午餐。', 'Diversifying well is the most important thing you need to do in order to invest well.', 'm-dalio', '原则', 2017, 1),
('q-marks-001', '投资中最重要的事情是对风险的理解。', 'The most important thing is understanding risk.', 'm-marks', '投资最重要的事', 2011, 1),
('q-marks-002', '你不能通过做和别人一样的事情来获得卓越的业绩。', 'You can''t do the same things others do and expect to outperform.', 'm-marks', '投资最重要的事', 2011, 0),
('q-bogle-001', '不要在干草堆中找针，把整个干草堆买下来。', 'Don''t look for the needle in the haystack. Just buy the haystack!', 'm-bogle', '共同基金常识', 1999, 1),
('q-bogle-002', '时间是你的朋友，冲动是你的敌人。', 'Time is your friend; impulse is your enemy.', 'm-bogle', '共同基金常识', 1999, 1),
('q-fisher-001', '股票市场充斥着知道一切的价格但不知道任何东西的价值的人。', 'The stock market is filled with individuals who know the price of everything, but the value of nothing.', 'm-fisher', '怎样选择成长股', 1958, 1),
('q-livermore-001', '华尔街没有新事物。因为投机像山丘一样古老。', 'There is nothing new in Wall Street. There can''t be because speculation is as old as the hills.', 'm-livermore', '股票大作手回忆录', 1923, 1),
('q-taleb-001', '风吹灭蜡烛，却助长火焰。反脆弱性利用冲击和不确定性。', 'Wind extinguishes a candle and energizes fire. You want to be the fire and wish for the wind.', 'm-taleb', '反脆弱', 2012, 1),
('q-klarman-001', '价值投资看上去简单，但实践起来很难。', 'Value investing is simple to understand but difficult to implement.', 'm-klarman', '安全边际', 1991, 1),
('q-klarman-002', '耐心是价值投资者最宝贵的资产。', 'Patience is one of the most valuable assets a value investor can have.', 'm-klarman', '安全边际', 1991, 0)
`;
db.exec(insertInitialQuotesSQL);

// Insert tags for initial quotes
const insertInitialQuoteTagsSQL = `
INSERT OR IGNORE INTO quote_tags (quote_id, tag_id) VALUES
('q-buffett-001','t-value'),('q-buffett-002','t-longterm'),('q-buffett-003','t-risk'),
('q-buffett-004','t-contrarian'),('q-buffett-005','t-value'),('q-buffett-006','t-circle'),
('q-buffett-007','t-longterm'),('q-buffett-008','t-mindset'),('q-buffett-009','t-risk'),
('q-buffett-010','t-longterm'),('q-munger-001','t-circle'),('q-munger-002','t-learning'),
('q-munger-003','t-contrarian'),('q-munger-004','t-risk'),('q-graham-001','t-market'),
('q-graham-002','t-mindset'),('q-graham-003','t-value'),('q-lynch-001','t-circle'),
('q-lynch-002','t-learning'),('q-lynch-003','t-market'),('q-soros-001','t-risk'),
('q-soros-002','t-contrarian'),('q-soros-003','t-mindset'),('q-dalio-001','t-learning'),
('q-dalio-002','t-risk'),('q-dalio-003','t-circle'),('q-dalio-004','t-risk'),
('q-marks-001','t-risk'),('q-marks-002','t-contrarian'),('q-bogle-001','t-value'),
('q-bogle-002','t-longterm'),('q-fisher-001','t-value'),('q-livermore-001','t-market'),
('q-taleb-001','t-risk'),('q-klarman-001','t-value'),('q-klarman-002','t-longterm')
`;
db.exec(insertInitialQuoteTagsSQL);

const INTERP_DIR = './scripts/interpretations';
const EXPAND_DIR = './scripts';
const NGRAM_THRESHOLD = 0.15;

const MASTER_MAP = {
  'buffett': 'm-buffett', 'munger': 'm-munger', 'graham': 'm-graham',
  'lynch': 'm-lynch', 'soros': 'm-soros', 'dalio': 'm-dalio',
  'marks': 'm-marks', 'bogle': 'm-bogle', 'fisher': 'm-fisher',
  'livermore': 'm-livermore', 'taleb': 'm-taleb', 'klarman': 'm-klarman',
};

function getNgrams(text, n = 3) {
  const clean = text.replace(/[^\u4e00-\u9fff]/g, '');
  if (clean.length < n) return new Set();
  const result = new Set();
  for (let i = 0; i <= clean.length - n; i++) result.add(clean.slice(i, i + n));
  return result;
}

function coverage(quoteText, interpText) {
  const q = getNgrams(quoteText, 3);
  const i = getNgrams(interpText, 3);
  if (!q.size) return 0;
  const intersection = new Set([...q].filter(x => i.has(x)));
  return intersection.size / q.size;
}

function interpFullText(item) {
  const parts = [];
  if (item.core) parts.push(item.core);
  if (item.story) parts.push(item.story);
  if (item.master_view) parts.push(item.master_view);
  if (item.practice) {
    parts.push(Array.isArray(item.practice) ? item.practice.join(' ') : String(item.practice));
  }
  return parts.join(' ');
}

// Apply expand SQL files
const expandFiles = [
  'expand_quotes.sql', 'expand_quotes_part2.sql',
  'expand_quotes_part3.sql', 'expand_quotes_part4.sql'
];

for (const file of expandFiles) {
  const filePath = path.join(EXPAND_DIR, file);
  if (!fs.existsSync(filePath)) {
    console.log(`  Skip: ${file} not found`);
    continue;
  }
  try {
    const sql = fs.readFileSync(filePath, 'utf-8');
    db.exec(sql);
    console.log(`  Applied: ${file}`);
  } catch (e) {
    console.log(`  Error in ${file}: ${e.message}`);
  }
}

// Load all quotes
const quotes = new Map();
for (const row of db.prepare('SELECT id, content_cn, master_id FROM quotes').all()) {
  quotes.set(row.id, { content: row.content_cn, master_id: row.master_id });
}

const quotesByMaster = new Map();
for (const [qid, q] of quotes) {
  if (!quotesByMaster.has(q.master_id)) quotesByMaster.set(q.master_id, []);
  quotesByMaster.get(q.master_id).push({ id: qid, content: q.content });
}

// Match interpretations
let inserted = 0;
for (const [masterSlug, masterId] of Object.entries(MASTER_MAP)) {
  const interpFile = path.join(INTERP_DIR, `${masterSlug}.json`);
  if (!fs.existsSync(interpFile)) continue;
  
  const interps = JSON.parse(fs.readFileSync(interpFile, 'utf-8'));
  const masterQuotes = quotesByMaster.get(masterId) || [];
  if (!masterQuotes.length) continue;
  
  // Phase 1: Content matching
  const matched = new Map();
  for (const item of interps) {
    const text = interpFullText(item);
    let bestScore = 0, bestId = null;
    for (const q of masterQuotes) {
      if (matched.has(q.id)) continue;
      const score = coverage(q.content, text);
      if (score > bestScore) { bestScore = score; bestId = q.id; }
    }
    if (bestScore >= NGRAM_THRESHOLD && bestId) {
      matched.set(bestId, item);
    }
  }
  
  // Phase 2: Sequential fallback
  const matchedValues = new Set(matched.values());
  const unmatchedInterps = interps.filter(item => !matchedValues.has(item));
  const unmatchedQuotes = masterQuotes.filter(q => !matched.has(q.id));
  const pairs = unmatchedInterps.slice(0, unmatchedQuotes.length);
  for (let i = 0; i < pairs.length; i++) {
    matched.set(unmatchedQuotes[i].id, pairs[i]);
  }
  
  // Insert
  for (const [qid, item] of matched) {
    let practice = item.practice || [];
    if (Array.isArray(practice)) practice = JSON.stringify(practice);
    db.prepare(
      `INSERT OR REPLACE INTO quote_interpretations (quote_id, core, practice, story, master_view)
       VALUES (?, ?, ?, ?, ?)`
    ).run(qid, item.core || '', practice, item.story || '', item.master_view || null);
    inserted++;
  }
}

const totalInterp = db.prepare('SELECT COUNT(*) c FROM quote_interpretations').get().c;
const totalQ = db.prepare('SELECT COUNT(*) c FROM quotes').get().c;

console.log('\n=== Summary ===');
console.log(`Quotes: ${totalQ}, Interpretations: ${totalInterp}`);
console.log(`Inserted this run: ${inserted}`);

db.close();
