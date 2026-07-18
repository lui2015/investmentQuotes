#!/usr/bin/env node
/**
 * gen-interpretations-kb.mjs
 * ─────────────────────────────────────────────────────────────────────────
 * 离线知识库方案：为「缺失解读」的名言生成 4 段解读（核心解读 / 应用实操 /
 * 生动案例 / 大师视角）。不依赖任何外部 LLM / 网络，适合无 API Key 时补齐。
 *
 * 做法：为每位大师建立知识库（concept / philosophy / view / principles /
 * anecdotes），按 quote.id 的哈希做确定性组合，使每条名言得到互不相同的
 * 解读，且贴合该大师的方法论。
 *
 * 仅处理缺失行（可重跑幂等），数据写入 quote_interpretations。
 *
 * 用法（容器内）：
 *   node scripts/gen-interpretations-kb.mjs
 *   DRY_RUN=1 node scripts/gen-interpretations-kb.mjs
 *
 * 环境变量：DB_PATH（默认 /app/data/quotes.db）、DRY_RUN（=1 仅统计不写）
 */

import Database from "better-sqlite3";

const DB_PATH = process.env.DB_PATH || "/app/data/quotes.db";
const DRY_RUN = process.env.DRY_RUN === "1";

// ── 大师知识库（key 为去掉中间点/空格的规范化名，匹配时再做 normalize）────────
const MASTERS = {
  沃伦巴菲特: {
    name: "沃伦·巴菲特",
    concept: "价值投资与护城河",
    philosophy: "以合理价格买入优秀企业并长期持有，聚焦现金流与护城河。",
    view: "把买股票等同于买生意，是他一以贯之的底层逻辑。",
    principles: [
      "只在自己能看懂的能力圈内投资，不熟不投",
      "买股票就是买公司，关注它长期的现金流",
      "寻找有宽阔护城河、能持续提价的生意",
      "别人恐慌时贪婪，别人贪婪时恐慌",
      "长期持有优秀企业，少做无谓的交易",
      "保住本金永远是第一位的",
      "用 ROE 与自由现金流衡量企业质量",
      "远离高杠杆和看不懂的复杂金融",
    ],
    anecdotes: [
      "1988 年起持续买入可口可乐，看重其全球品牌与定价权，长期持有获利数十倍。",
      "2008 年金融危机市场最恐慌时大举买入高盛、通用电气优先股，危机后获利丰厚。",
      "早年受格雷厄姆《聪明的投资者》影响，完成从烟蒂股到伟大企业的思想转变。",
    ],
  },
  查理芒格: {
    name: "查理·芒格",
    concept: "多元思维模型与逆向思维",
    philosophy: "用跨学科思维模型看世界，反过来想如何必然失败并避开。",
    view: "追求理性与耐心，是他与巴菲特互补的智慧来源。",
    principles: [
      "建立多元思维模型，跨学科地思考问题",
      "反过来想：先研究怎样会失败，然后避开",
      "坐等投资，少即是多，只在绝佳机会出手",
      "警惕嫉妒、怨恨、自怜等心理误判",
      "终身学习，每天睡前比早晨聪明一点点",
      "承受得起波动，但承受不起永久损失",
      "偏好伟大企业而非便宜的平庸企业",
      "纪律比聪明更重要，简单但不容易",
    ],
    anecdotes: [
      "与巴菲特将伯克希尔从纺织厂转型为投资巨擘，主张放弃烟蒂股、转向优质企业。",
      "提出能力圈互补：巴菲特懂商业，他用法律与心理学补全跨学科视角。",
      "那句“如果我知道会死在哪里，就永远不去那里”正是对逆向思维的绝佳注解。",
    ],
  },
  本杰明格雷厄姆: {
    name: "本杰明·格雷厄姆",
    concept: "安全边际与市场先生",
    philosophy: "把股票当生意，利用市场先生的情绪波动，以安全边际买入。",
    view: "价值投资之父，用纪律把投资变成可复制的生意。",
    principles: [
      "把市场看作情绪化的市场先生，不为其所动",
      "安全边际是投资最核心的护盾",
      "买得便宜比买得好公司更基础",
      "用净流动资产折价控制下行风险",
      "分散持有被低估的证券组合",
      "关注账面值与清算价值",
      "长期看价格终将回归内在价值",
      "投资是严肃的生意，不是猜涨跌",
    ],
    anecdotes: [
      "1929 年大萧条中几乎破产，后写就《证券分析》《聪明的投资者》奠定价值投资。",
      "用市场先生寓言教导投资者：别被每日报价牵着鼻子走。",
      "早期重仓盖可保险（GEICO），验证了低估标的终会回归。",
    ],
  },
  瑞达利欧: {
    name: "瑞·达利欧",
    concept: "原则与全天候",
    philosophy: "把世界看作机器，用原则系统化决策，构建穿越任何环境的组合。",
    view: "理解因果机制，而非预测点位，是他的核心方法论。",
    principles: [
      "把生活和工作提炼成可复用的原则",
      "极度求真、极度透明地面对现实",
      "理解事物的因果机制，而非预测点位",
      "分散风险，构建全天候组合",
      "痛苦加反思等于进步",
      "区分目标与欲望，避免被情绪驱动",
      "用杠杆平衡不同经济环境的风险",
      "做最重要的事，别被琐事淹没",
    ],
    anecdotes: [
      "1982 年误判债务危机几乎让桥水破产，此后建立犯错日志与原则体系。",
      "设计出全天候策略，让组合在通胀、通缩、增长、衰退下都稳健。",
      "《原则》一书把毕生决策方法公开，影响全球投资者。",
    ],
  },
  乔治索罗斯: {
    name: "乔治·索罗斯",
    concept: "反身性与试错",
    philosophy: "市场由参与者偏见驱动，价格与基本面相互反射，趋势自我强化至反转。",
    view: "不恋战，认错比证明自己对更重要。",
    principles: [
      "理解反身性：认知与事实会互相影响",
      "市场并非总是有效，偏见制造机会",
      "先假设、再试错，错了快速改正",
      "在趋势自我强化时顺势，在拐点前离场",
      "承担可控风险以博取不对称收益",
      "保持开放，随时修正自己的观点",
      "盛衰序列：繁荣酝酿泡沫，泡沫终破裂",
      "别被希望与恐惧支配交易",
    ],
    anecdotes: [
      "1992 年做空英镑（黑色星期三），押注英国维持汇率失败，单日获利超十亿美元。",
      "提出反身性理论：投资者的偏见会改变市场本身。",
      "设立开放社会基金会，把投资哲学延伸到社会领域。",
    ],
  },
  霍华德马克斯: {
    name: "霍华德·马克斯",
    concept: "第二层思维与周期",
    philosophy: "卓越投资来自第二层思维与对周期的敬畏，风险控制优先于收益。",
    view: "无法预测，但可以准备，是他反复强调的纪律。",
    principles: [
      "用第二层思维想别人没想到的",
      "识别我们处在周期的哪个位置",
      "风险控制比追求高收益更根本",
      "在别人绝望时买入，狂热时卖出",
      "价格决定风险，而非标的本身",
      "接受足够好的回报，别贪最高",
      "很难卖在顶部或买在底部，别妄想",
      "清晰认识自己的可知与不可知",
    ],
    anecdotes: [
      "橡树资本在 2008 年危机中逆向大举买入困境债务，危机后回报丰厚。",
      "以投资备忘录闻名，用通俗语言传递周期与风险的智慧。",
      "强调你无法预测但可以准备，反对宏观择时。",
    ],
  },
  约翰博格: {
    name: "约翰·博格",
    concept: "指数投资与低成本",
    philosophy: "长期看多数主动基金跑不赢市场，低成本宽基指数是普通人的最佳选择。",
    view: "回归拥有市场本身的朴素真理，是他留给行业的遗产。",
    principles: [
      "长期持有低成本宽基指数基金",
      "费用是决定净收益的关键变量",
      "别试图择时，别追逐热门",
      "复利的最大敌人是成本与税负",
      "简单胜过聪明，被动胜过主动",
      "坚持到底比选基更重要",
      "警惕频繁交易与高换手",
      "买下整个市场，而非押注个别赢家",
    ],
    anecdotes: [
      "1975 年创立先锋集团并推出首只指数基金，曾被业内嘲笑为投资界的侏儒。",
      "用数据证明长期多数主动基金跑输指数，改变了整个行业。",
      "倡导保持冷静、坚持到底（stay the course）的投资信条。",
    ],
  },
  彼得林奇: {
    name: "彼得·林奇",
    concept: "投资身边所见",
    philosophy: "从日常生活发现十倍股，把股票分门别类，买自己研究懂的公司。",
    view: "普通人比机构更早注意到身边好生意，是他给散户的礼物。",
    principles: [
      "从生活和工作中发现好公司，投资身边所见",
      "把股票分为缓慢、稳定、快速、周期、困境、资产类",
      "研究财报与业务，别听小道消息",
      "买你看得懂、能解释的生意",
      "快速增长股要确认增长能持续",
      "别因大盘涨跌恐慌卖出好公司",
      "PEG 比单纯 PE 更能看估值",
      "长期持有伟大公司，及时卖出变差的",
    ],
    anecdotes: [
      "管理富达麦哲伦基金 13 年年均回报约 29%，从超市、餐厅等日常消费中发现牛股。",
      "提出墙角里的公司理念：普通人比机构更早注意到身边好生意。",
      "写《彼得·林奇的成功投资》把机构方法教给散户。",
    ],
  },
  塞斯卡拉曼: {
    name: "塞斯·卡拉曼",
    concept: "安全边际与绝对收益",
    philosophy: "价值投资的本质是安全边际与下行保护，宁可错过也不买贵。",
    view: "先求不亏，再求赚，是他绝对收益思维的底色。",
    principles: [
      "安全边际是应对未知的唯一缓冲",
      "绝对收益思维：先求不亏，再求赚",
      "宁可观望持币，也不买价格不对的东西",
      "把风险放在收益之前",
      "流动性是投资者的好朋友",
      "市场狂热时更需纪律",
      "低估加催化剂等于更好机会",
      "便宜是硬道理，故事再好也别付高价",
    ],
    anecdotes: [
      "所著《安全边际》绝版后二手价被炒至上千美元，被视为价值投资圣经。",
      "2008 年危机前保持高现金仓位，危机中从容买入被错杀资产。",
      "坚持低换手、重研究的买方文化。",
    ],
  },
  菲利普费雪: {
    name: "菲利普·费雪",
    concept: "长期成长与闲聊法",
    philosophy: "买入能长期成长的伟大公司并长期持有，用闲聊法深挖管理层与赛道。",
    view: "找到少数绝佳公司然后长期持有，胜过广泛分散。",
    principles: [
      "寻找能持续十年以上的成长型公司",
      "用闲聊法向上下游、竞品了解真相",
      "管理层诚信与能力比短期财报更关键",
      "买后长期持有，少做买卖",
      "关注研发投入与销售能力",
      "优秀公司值得为质量付合理溢价",
      "卖出只因逻辑变了或找到更好标的",
      "别被短期波动吓跑伟大公司",
    ],
    anecdotes: [
      "1955 年买入摩托罗拉并持有数十年，践行长期成长理念。",
      "《怎样选择成长股》提出闲聊法，开创基本面调研先河。",
      "强调找到少数绝佳公司、然后长期持有胜过广泛分散。",
    ],
  },
  杰西利弗莫尔: {
    name: "杰西·利弗莫尔",
    concept: "顺势与关键点",
    philosophy: "顺势而为，等待关键点突破，严格止损，保护本金。",
    view: "利润来自坐着不动，而非频繁进出，是他用血泪换来的纪律。",
    principles: [
      "顺势交易，不与趋势为敌",
      "等关键点确认再出手，不抄底摸顶",
      "严格止损，保住本金才能再战",
      "利润来自坐着不动，而非频繁进出",
      "赚钱的仓位要加足，亏钱的早砍",
      "控制情绪，别让希望与恐惧支配",
      "大钱在大的波动里，不在小反弹",
      "记录并复盘自己的每一笔交易",
    ],
    anecdotes: [
      "1907 年恐慌中做空获利，获 J.P. 摩根请其收手以稳定市场。",
      "1929 年大萧条前做空获利上亿美元。",
      "晚年著《股票作手回忆录》，其关键点与纪律思想影响后人。",
    ],
  },
  纳西姆塔勒布: {
    name: "纳西姆·塔勒布",
    concept: "黑天鹅与反脆弱",
    philosophy: "世界常被极端事件主宰，构建反脆弱组合，用杠铃策略应对未知。",
    view: "承认无法预测黑天鹅，但可为之准备，是他的核心洞见。",
    principles: [
      "承认无法预测黑天鹅，但可为它准备",
      "用杠铃策略：大部分极安全加小部极投机",
      "追求反脆弱：从波动中获益而非受损",
      "警惕被平滑的平静掩盖的风险",
      "少做预测，多建冗余",
      "重视期权式的非线性收益",
      "别因短期平静而忽视尾部风险",
      "经验大于理论，实践胜过模型",
    ],
    anecdotes: [
      "2008 年金融危机前押注极端风险，危机中获利，印证黑天鹅思想。",
      "《黑天鹅》《反脆弱》揭示人们对低频高冲击事件的系统性低估。",
      "主张让系统在被冲击时反而更强，而非仅仅抗住。",
    ],
  },
  段永平: {
    name: "段永平",
    concept: "本分与平常心",
    philosophy: "做对的事并把事做对，以本分和平常心做长期价值投资，重生意模式。",
    view: "不懂不做、不熟不投，是他践行巴菲特思想的根本。",
    principles: [
      "做对的事情，然后把事情做对",
      "买股票就是买公司，看未来现金流折现",
      "守住本分与平常心",
      "只投自己真正懂的好生意",
      "好生意要有好的商业模式与护城河",
      "长期持有，不被市场情绪左右",
      "不懂不做，不熟不投",
      "敢为天下后，后中争先",
    ],
    anecdotes: [
      "创立小霸王、步步高，后孵化 OPPO、vivo，践行本分企业文化。",
      "2000 年代重仓网易，在其低谷时看到价值并获巨额回报。",
      "被视为巴菲特与芒格思想的华人践行者，常公开分享价值投资。",
    ],
  },
};

// 把 key 规范化：去掉中间点，便于按 master_name_cn 匹配
function normalizeKey(name) {
  return (name || "").replace(/[·•\s]/g, "");
}

const KB_BY_NAME = {};
for (const m of Object.values(MASTERS)) {
  KB_BY_NAME[normalizeKey(m.name)] = m;
}
// 异译别名：达利欧在库里有两种写法，统一指向同一知识库
KB_BY_NAME[normalizeKey("雷·达里奥")] = MASTERS["瑞达利欧"];
KB_BY_NAME[normalizeKey("瑞·达里奥")] = MASTERS["瑞达利欧"];

// ── 工具 ──────────────────────────────────────────────────────────────────
function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function trimTo(s, max) {
  return s.length > max ? s.slice(0, max) : s;
}

// ── 生成 ──────────────────────────────────────────────────────────────────
function buildInterpretation(quote) {
  const q = quote.content_cn || "";
  const qShort = q.length > 18 ? q.slice(0, 18) + "…" : q;
  const kb = KB_BY_NAME[normalizeKey(quote.master_name_cn)];

  if (!kb) {
    return {
      core: `“${qShort}”提醒我们：投资里重要的不是预测市场，而是为自己的判断留出安全边际、控制好风险。`,
      practice: [
        "只在自己真正理解的生意范围内下注",
        "为每笔投资预设清晰的卖出与止损条件",
        "用闲钱长期持有，不被每日报价牵着走",
        "持续复盘，修正自己的认知偏差",
      ],
      story:
        "市场上大多数人败在追涨杀跌；反过来，把注意力放在生意本身、忽略短期波动的人，长期反而更从容。等待与耐心，往往比频繁操作更重要。",
      master_view: null,
    };
  }

  const P = kb.principles;
  const A = kb.anecdotes;
  const h = hashStr(quote.id);

  const coreIdx = h % P.length;
  const used = new Set([coreIdx]);
  const practice = [];
  let i = 1;
  while (practice.length < 4 && i < 500) {
    const idx = (h + i * 7) % P.length;
    if (!used.has(idx)) {
      used.add(idx);
      practice.push(P[idx]);
    }
    i++;
  }
  while (practice.length < 4) practice.push(P[(coreIdx + practice.length + 1) % P.length]);

  const core = `${kb.name}用一句话点破：${P[coreIdx]}。结合“${qShort}”，这正是他“${kb.concept}”的落地——${kb.philosophy}`;
  const story = `回到“${qShort}”——${A[(h >>> 4) % A.length]}`;
  const master_view = `在${kb.name}的体系里，这句话属于“${kb.concept}”：${kb.view}`;

  return {
    core: trimTo(core, 170),
    practice,
    story: trimTo(story, 200),
    master_view: trimTo(master_view, 120),
  };
}

function validate(obj) {
  if (!obj || typeof obj !== "object") return null;
  let core = typeof obj.core === "string" ? obj.core.trim() : "";
  let practice = Array.isArray(obj.practice)
    ? obj.practice.map((x) => String(x).trim()).filter(Boolean)
    : [];
  let story = typeof obj.story === "string" ? obj.story.trim() : "";
  let mv = obj.master_view == null ? null : String(obj.master_view).trim() || null;

  // 夹紧而非拒绝：保证每一条都能写入，且长度在展示合理范围内
  if (core.length < 30) core += "这是该大师反复强调的底层原则，值得长期反复体会。";
  if (core.length > 180) core = core.slice(0, 180);
  while (practice.length < 4)
    practice.push("把这条原则写进自己的投资纪律，并定期复盘执行偏差。");
  if (practice.length > 4) practice = practice.slice(0, 4);
  if (story.length < 50)
    story += "这提醒我们，真正重要的不是预测对错，而是为自己的判断留出余地。";
  if (story.length > 200) story = story.slice(0, 200);
  if (mv && mv.length > 120) mv = mv.slice(0, 120);

  return { core, practice, story, master_view: mv };
}

// ── 数据库 ────────────────────────────────────────────────────────────────
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.pragma("busy_timeout = 15000");

function getMissing() {
  return db
    .prepare(
      `SELECT q.id, q.content_cn, m.name_cn AS master_name_cn
       FROM quotes q JOIN masters m ON q.master_id = m.id
       WHERE NOT EXISTS (SELECT 1 FROM quote_interpretations i WHERE i.quote_id = q.id)
       ORDER BY q.favorite_count DESC, q.created_at DESC`
    )
    .all();
}

const insertStmt = db.prepare(
  `INSERT OR IGNORE INTO quote_interpretations (quote_id, core, practice, story, master_view)
   VALUES (?, ?, ?, ?, ?)`
);

// ── 主流程 ────────────────────────────────────────────────────────────────
function main() {
  const fixMode = process.env.FIX === "1";

  if (fixMode) {
    const bad = db
      .prepare(
        `SELECT q.id, q.content_cn, m.name_cn AS master_name_cn
         FROM quotes q
         JOIN quote_interpretations i ON i.quote_id = q.id
         JOIN masters m ON q.master_id = m.id
         WHERE i.story LIKE '%undefined%' OR i.core LIKE '%undefined%'
            OR i.practice LIKE '%undefined%' OR i.master_view LIKE '%undefined%'`
      )
      .all();
    console.log(`\n🔧 FIX 模式：发现含 undefined 的坏行 ${bad.length} 条`);

    if (DRY_RUN) {
      console.log("✅ DRY_RUN 完成，未写库。");
      return;
    }

    const upd = db.prepare(
      `UPDATE quote_interpretations SET core=?, practice=?, story=?, master_view=? WHERE quote_id=?`
    );
    let fixed = 0;
    for (const quote of bad) {
      const norm = validate(buildInterpretation(quote));
      upd.run(norm.core, JSON.stringify(norm.practice), norm.story, norm.master_view, quote.id);
      fixed++;
    }
    const stillBad = db
      .prepare(
        `SELECT COUNT(*) AS c FROM quote_interpretations
         WHERE story LIKE '%undefined%' OR core LIKE '%undefined%'
            OR practice LIKE '%undefined%' OR master_view LIKE '%undefined%'`
      )
      .get().c;
    console.log(`   已修复: ${fixed}`);
    console.log(`   仍含 undefined: ${stillBad}`);
    return;
  }

  const missing = getMissing();
  console.log(`\n🔎 缺失解读的名言共 ${missing.length} 条`);

  if (DRY_RUN) {
    let kbHit = 0;
    for (const q of missing) if (KB_BY_NAME[normalizeKey(q.master_name_cn)]) kbHit++;
    console.log(`   命中知识库: ${kbHit} 条，走通用模板: ${missing.length - kbHit} 条`);
    console.log("✅ DRY_RUN 完成，未写库。");
    return;
  }

  let inserted = 0;
  let failed = 0;
  for (const quote of missing) {
    const built = buildInterpretation(quote);
    const norm = validate(built);
    if (!norm) {
      failed++;
      console.warn(`   ⚠️ 校验失败 [${quote.id}] ${quote.master_name_cn}`);
      continue;
    }
    const info = insertStmt.run(
      quote.id,
      norm.core,
      JSON.stringify(norm.practice),
      norm.story,
      norm.master_view
    );
    if (info.changes > 0) inserted++;
    else failed++;
  }

  const remaining = db
    .prepare(
      `SELECT COUNT(*) AS c FROM quotes q
       WHERE NOT EXISTS (SELECT 1 FROM quote_interpretations i WHERE i.quote_id = q.id)`
    )
    .get().c;
  const totalInt = db.prepare(`SELECT COUNT(*) AS c FROM quote_interpretations`).get().c;

  console.log(`\n── 完成 ──`);
  console.log(`   本次新写入: ${inserted}`);
  console.log(`   失败/跳过: ${failed}`);
  console.log(`   解读表总数: ${totalInt}`);
  console.log(`   仍未覆盖:   ${remaining}`);
}

main();
db.close();
