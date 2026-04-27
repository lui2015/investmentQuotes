import { initDb } from "./db";
import { v4 } from "./uuid";

const masters = [
  {
    id: "m-buffett",
    name_cn: "沃伦·巴菲特",
    name_en: "Warren Buffett",
    title: "奥马哈先知",
    bio: "伯克希尔·哈撒韦公司董事长兼CEO，被誉为「股神」。坚持价值投资理念超过60年，是全球最成功的投资者之一。其投资哲学强调以合理价格买入优质企业并长期持有。",
    born_year: 1930,
    nationality: "美国",
    category: "价值投资",
  },
  {
    id: "m-munger",
    name_cn: "查理·芒格",
    name_en: "Charlie Munger",
    title: "多元思维模型大师",
    bio: "伯克希尔·哈撒韦公司副董事长，巴菲特的长期合伙人。主张跨学科思维模型，强调理性思考和终身学习。其「反过来想」的逆向思维影响了无数投资者。",
    born_year: 1924,
    nationality: "美国",
    category: "价值投资",
  },
  {
    id: "m-graham",
    name_cn: "本杰明·格雷厄姆",
    name_en: "Benjamin Graham",
    title: "价值投资之父",
    bio: "现代证券分析之父，哥伦比亚大学商学院教授。著有《证券分析》和《聪明的投资者》，提出了安全边际、市场先生等经典概念，是巴菲特的导师。",
    born_year: 1894,
    nationality: "美国",
    category: "价值投资",
  },
  {
    id: "m-lynch",
    name_cn: "彼得·林奇",
    name_en: "Peter Lynch",
    title: "传奇基金经理",
    bio: "富达麦哲伦基金经理，在其管理期间（1977-1990）年均回报率达29.2%。著有《战胜华尔街》《彼得·林奇的成功投资》。主张「买你所知」的投资理念。",
    born_year: 1944,
    nationality: "美国",
    category: "成长投资",
  },
  {
    id: "m-soros",
    name_cn: "乔治·索罗斯",
    name_en: "George Soros",
    title: "金融巨鳄",
    bio: "量子基金创始人，以宏观对冲策略闻名。提出「反身性理论」，认为市场参与者的认知会影响市场本身。1992年做空英镑获利10亿美元，被称为「打败英格兰银行的人」。",
    born_year: 1930,
    nationality: "美国",
    category: "宏观对冲",
  },
  {
    id: "m-dalio",
    name_cn: "瑞·达利欧",
    name_en: "Ray Dalio",
    title: "原则先生",
    bio: "桥水基金创始人，全球最大对冲基金掌舵人。著有《原则》，提倡极度透明和系统化决策。其全天候策略（All Weather）影响深远。",
    born_year: 1949,
    nationality: "美国",
    category: "宏观对冲",
  },
  {
    id: "m-marks",
    name_cn: "霍华德·马克斯",
    name_en: "Howard Marks",
    title: "周期大师",
    bio: "橡树资本联合创始人，以投资备忘录闻名于世。著有《投资最重要的事》《周期》。强调风险意识、逆向投资和对市场周期的深刻理解。",
    born_year: 1946,
    nationality: "美国",
    category: "价值投资",
  },
  {
    id: "m-bogle",
    name_cn: "约翰·博格",
    name_en: "John Bogle",
    title: "指数基金之父",
    bio: "先锋集团创始人，指数基金的发明者和推广者。毕生倡导低成本被动投资，认为大多数主动管理基金无法长期战胜市场。其理念惠及数亿普通投资者。",
    born_year: 1929,
    nationality: "美国",
    category: "指数投资",
  },
  {
    id: "m-fisher",
    name_cn: "菲利普·费雪",
    name_en: "Philip Fisher",
    title: "成长投资先驱",
    bio: "成长股投资策略的开创者，著有《怎样选择成长股》。主张深入调研企业管理层和竞争优势，对巴菲特的投资理念产生了深远影响。",
    born_year: 1907,
    nationality: "美国",
    category: "成长投资",
  },
  {
    id: "m-livermore",
    name_cn: "杰西·利弗莫尔",
    name_en: "Jesse Livermore",
    title: "华尔街传奇操盘手",
    bio: "20世纪初最著名的股票交易员，《股票大作手回忆录》主人公原型。在1929年大崩盘中做空获利超过1亿美元。其对市场心理和交易时机的洞察至今影响深远。",
    born_year: 1877,
    nationality: "美国",
    category: "交易投机",
  },
  {
    id: "m-taleb",
    name_cn: "纳西姆·塔勒布",
    name_en: "Nassim Taleb",
    title: "黑天鹅之父",
    bio: "前华尔街交易员，畅销书作家。著有《黑天鹅》《反脆弱》《随机漫步的傻瓜》。提出「黑天鹅」理论和「反脆弱」概念，深刻揭示了不确定性和风险的本质。",
    born_year: 1960,
    nationality: "美国",
    category: "风险管理",
  },
  {
    id: "m-klarman",
    name_cn: "塞斯·卡拉曼",
    name_en: "Seth Klarman",
    title: "安全边际守护者",
    bio: "波士顿Baupost基金创始人，著有投资经典《安全边际》。坚守格雷厄姆式的价值投资理念，注重风险控制和安全边际，是当代最受尊敬的价值投资者之一。",
    born_year: 1957,
    nationality: "美国",
    category: "价值投资",
  },
];

const tags = [
  { id: "t-value", name: "价值投资", slug: "value-investing", description: "关于内在价值、安全边际、低估买入" },
  { id: "t-longterm", name: "长期主义", slug: "long-term", description: "关于耐心、复利、时间的力量" },
  { id: "t-risk", name: "风险管理", slug: "risk-management", description: "关于风控、止损、分散投资" },
  { id: "t-contrarian", name: "逆向思维", slug: "contrarian", description: "关于独立思考、反人性、逆向投资" },
  { id: "t-circle", name: "能力圈", slug: "circle-of-competence", description: "关于认知边界、专注、知之为知之" },
  { id: "t-market", name: "市场认知", slug: "market-insight", description: "关于市场本质、周期、波动" },
  { id: "t-mindset", name: "心态修炼", slug: "mindset", description: "关于情绪控制、纪律、理性" },
  { id: "t-learning", name: "学习成长", slug: "learning", description: "关于阅读、思维模型、终身学习" },
  { id: "t-business", name: "企业分析", slug: "business-analysis", description: "关于护城河、商业模式、竞争优势" },
  { id: "t-philosophy", name: "人生哲学", slug: "life-philosophy", description: "关于人生、财富、幸福的感悟" },
];

const quotes = [
  // 巴菲特
  { id: v4(), content_cn: "价格是你付出的，价值是你得到的。", content_en: "Price is what you pay. Value is what you get.", master_id: "m-buffett", source: "致股东的信", source_year: 2008, is_featured: 1, tags: ["t-value"] },
  { id: v4(), content_cn: "我们最喜欢的持有期是永远。", content_en: "Our favorite holding period is forever.", master_id: "m-buffett", source: "致股东的信", source_year: 1988, is_featured: 1, tags: ["t-longterm"] },
  { id: v4(), content_cn: "投资的第一条规则是不要亏钱，第二条规则是不要忘记第一条。", content_en: "Rule No.1: Never lose money. Rule No.2: Never forget rule No.1.", master_id: "m-buffett", source: "伯克希尔股东大会", source_year: null, is_featured: 1, tags: ["t-risk"] },
  { id: v4(), content_cn: "别人贪婪时我恐惧，别人恐惧时我贪婪。", content_en: "Be fearful when others are greedy and greedy when others are fearful.", master_id: "m-buffett", source: "致股东的信", source_year: 2004, is_featured: 1, tags: ["t-contrarian", "t-mindset"] },
  { id: v4(), content_cn: "以合理的价格买入伟大的公司，远胜于以便宜的价格买入平庸的公司。", content_en: "It's far better to buy a wonderful company at a fair price than a fair company at a wonderful price.", master_id: "m-buffett", source: "致股东的信", source_year: 1989, is_featured: 1, tags: ["t-value", "t-business"] },
  { id: v4(), content_cn: "永远不要投资你不了解的生意。", content_en: "Never invest in a business you cannot understand.", master_id: "m-buffett", source: "伯克希尔股东大会", source_year: null, is_featured: 0, tags: ["t-circle"] },
  { id: v4(), content_cn: "如果你不愿意持有一只股票十年，那就连十分钟也不要持有。", content_en: "If you aren't willing to own a stock for ten years, don't even think about owning it for ten minutes.", master_id: "m-buffett", source: "致股东的信", source_year: 1996, is_featured: 0, tags: ["t-longterm"] },
  { id: v4(), content_cn: "在投资中，最重要的品质不是智力，而是气质。", content_en: "The most important quality for an investor is temperament, not intellect.", master_id: "m-buffett", source: "访谈", source_year: null, is_featured: 0, tags: ["t-mindset"] },
  { id: v4(), content_cn: "当潮水退去，才知道谁在裸泳。", content_en: "Only when the tide goes out do you discover who's been swimming naked.", master_id: "m-buffett", source: "致股东的信", source_year: 2001, is_featured: 1, tags: ["t-risk", "t-market"] },
  { id: v4(), content_cn: "时间是优秀企业的朋友，是平庸企业的敌人。", content_en: "Time is the friend of the wonderful company, the enemy of the mediocre.", master_id: "m-buffett", source: "致股东的信", source_year: 1989, is_featured: 0, tags: ["t-longterm", "t-business"] },
  { id: v4(), content_cn: "你不需要成为每家公司的专家，甚至不需要了解很多。你只需要能够评估在你能力圈范围内的公司。", content_en: "You don't have to be an expert on every company. You only have to be able to evaluate companies within your circle of competence.", master_id: "m-buffett", source: "致股东的信", source_year: 1996, is_featured: 0, tags: ["t-circle"] },
  { id: v4(), content_cn: "走到生命尽头时，衡量人生的标准不是你赚了多少钱，而是有多少人真心爱你。", content_en: "When you get to my age, you'll measure your success in life by how many of the people you want to have love you actually do love you.", master_id: "m-buffett", source: "佐治亚大学演讲", source_year: 2007, is_featured: 0, tags: ["t-philosophy"] },

  // 芒格
  { id: v4(), content_cn: "知道自己不知道什么，比聪明更重要。", content_en: "Knowing what you don't know is more useful than being brilliant.", master_id: "m-munger", source: "穷查理宝典", source_year: null, is_featured: 1, tags: ["t-circle", "t-learning"] },
  { id: v4(), content_cn: "我这辈子遇到的聪明人，没有不每天阅读的，一个都没有。", content_en: "In my whole life, I have known no wise people who didn't read all the time — none, zero.", master_id: "m-munger", source: "穷查理宝典", source_year: null, is_featured: 1, tags: ["t-learning"] },
  { id: v4(), content_cn: "反过来想，总是反过来想。", content_en: "Invert, always invert.", master_id: "m-munger", source: "穷查理宝典", source_year: null, is_featured: 1, tags: ["t-contrarian", "t-learning"] },
  { id: v4(), content_cn: "如果我知道我会在哪里死去，我就永远不会去那个地方。", content_en: "All I want to know is where I'm going to die, so I'll never go there.", master_id: "m-munger", source: "穷查理宝典", source_year: null, is_featured: 0, tags: ["t-risk", "t-philosophy"] },
  { id: v4(), content_cn: "你得找到你有激情的东西，不能让别人告诉你什么是你的激情。", content_en: "You have to figure out what your own aptitudes are.", master_id: "m-munger", source: "Daily Journal 股东大会", source_year: 2020, is_featured: 0, tags: ["t-circle", "t-philosophy"] },
  { id: v4(), content_cn: "获得智慧是一种道德义务，它不仅是一件为了让你的生活变得更好的事。", content_en: "Acquiring wisdom is a moral duty. It's not something you do just to advance in life.", master_id: "m-munger", source: "穷查理宝典", source_year: null, is_featured: 0, tags: ["t-learning", "t-philosophy"] },
  { id: v4(), content_cn: "投资中最大的风险是无知。", content_en: "The biggest risk in investing is ignorance.", master_id: "m-munger", source: "伯克希尔股东大会", source_year: null, is_featured: 0, tags: ["t-risk", "t-learning"] },
  { id: v4(), content_cn: "如果你买的东西不值你付的价，再怎么分散风险也没用。", content_en: "Diversification is a protection against ignorance. It makes very little sense for those who know what they're doing.", master_id: "m-munger", source: "访谈", source_year: null, is_featured: 0, tags: ["t-value", "t-circle"] },

  // 格雷厄姆
  { id: v4(), content_cn: "市场短期是投票机，长期是称重机。", content_en: "In the short run, the market is a voting machine but in the long run, it is a weighing machine.", master_id: "m-graham", source: "聪明的投资者", source_year: 1949, is_featured: 1, tags: ["t-market", "t-longterm"] },
  { id: v4(), content_cn: "投资者最大的敌人不是股票市场，而是他自己。", content_en: "The investor's chief problem — and even his worst enemy — is likely to be himself.", master_id: "m-graham", source: "聪明的投资者", source_year: 1949, is_featured: 1, tags: ["t-mindset"] },
  { id: v4(), content_cn: "安全边际的目的是让准确的预测变得不必要。", content_en: "The purpose of the margin of safety is to render the forecast unnecessary.", master_id: "m-graham", source: "聪明的投资者", source_year: 1949, is_featured: 1, tags: ["t-value", "t-risk"] },
  { id: v4(), content_cn: "那些不能控制自己情绪的人，不适合从投资中获利。", content_en: "Individuals who cannot master their emotions are ill-suited to profit from the investment process.", master_id: "m-graham", source: "聪明的投资者", source_year: 1949, is_featured: 0, tags: ["t-mindset"] },
  { id: v4(), content_cn: "对待价格波动的正确态度是所有成功投资的试金石。", content_en: "The correct attitude toward price fluctuations is the touchstone of successful investing.", master_id: "m-graham", source: "聪明的投资者", source_year: 1949, is_featured: 0, tags: ["t-mindset", "t-market"] },

  // 彼得·林奇
  { id: v4(), content_cn: "投资你所了解的。", content_en: "Invest in what you know.", master_id: "m-lynch", source: "彼得·林奇的成功投资", source_year: 1989, is_featured: 1, tags: ["t-circle"] },
  { id: v4(), content_cn: "不做研究就投资，和不看牌就玩扑克一样荒唐。", content_en: "Investing without research is like playing stud poker and never looking at the cards.", master_id: "m-lynch", source: "战胜华尔街", source_year: 1993, is_featured: 0, tags: ["t-learning", "t-business"] },
  { id: v4(), content_cn: "股市下跌就像科罗拉多一月的暴风雪一样寻常，如果你有准备，它不会伤害你。", content_en: "A stock market decline is as routine as a January blizzard in Colorado. If you're prepared, it can't hurt you.", master_id: "m-lynch", source: "战胜华尔街", source_year: 1993, is_featured: 1, tags: ["t-market", "t-mindset"] },
  { id: v4(), content_cn: "在股票市场上，最重要的器官是胃而不是脑。", content_en: "The key organ for investing is the stomach, not the brain.", master_id: "m-lynch", source: "访谈", source_year: null, is_featured: 0, tags: ["t-mindset"] },
  { id: v4(), content_cn: "远比试图预测市场时机更有效的方法是，找到被低估的好公司。", content_en: "Far more money has been lost by investors trying to anticipate corrections, than lost in the corrections themselves.", master_id: "m-lynch", source: "彼得·林奇的成功投资", source_year: 1989, is_featured: 0, tags: ["t-market", "t-value"] },

  // 索罗斯
  { id: v4(), content_cn: "世界经济史是一部基于假象和谎言的连续剧。", content_en: "The history of economics is a never-ending series of episodes based on falsehoods and lies.", master_id: "m-soros", source: "金融炼金术", source_year: 1987, is_featured: 0, tags: ["t-market"] },
  { id: v4(), content_cn: "重要的不是你做对或做错了，而是你做对时赚了多少，做错时亏了多少。", content_en: "It's not whether you're right or wrong that's important, but how much money you make when you're right and how much you lose when you're wrong.", master_id: "m-soros", source: "索罗斯谈索罗斯", source_year: 1995, is_featured: 1, tags: ["t-risk", "t-market"] },
  { id: v4(), content_cn: "市场永远处于不确定和波动之中，通过押注出乎意料的事物来赚钱。", content_en: "Markets are constantly in a state of uncertainty and flux, and money is made by discounting the obvious and betting on the unexpected.", master_id: "m-soros", source: "金融炼金术", source_year: 1987, is_featured: 0, tags: ["t-contrarian", "t-market"] },
  { id: v4(), content_cn: "金融市场从来不反映真实状况，它们永远反映的是参与者对真实状况的扭曲看法。", content_en: "Financial markets generally are unpredictable, so that one has to have different scenarios… The idea that you can actually predict what's going to happen contradicts my way of looking at the market.", master_id: "m-soros", source: "索罗斯谈索罗斯", source_year: 1995, is_featured: 1, tags: ["t-market", "t-mindset"] },
  { id: v4(), content_cn: "我比别人更会赚钱，是因为我更快地承认自己的错误。", content_en: "I'm only rich because I know when I'm wrong… I basically have survived by recognizing my mistakes.", master_id: "m-soros", source: "彭博电视访谈", source_year: null, is_featured: 1, tags: ["t-mindset", "t-risk"] },
  { id: v4(), content_cn: "反身性理论的关键在于：参与者的认知和市场本身会相互影响，彼此塑造。", content_en: "Reflexivity sets up a feedback loop between market valuations and the so-called fundamentals which are being valued.", master_id: "m-soros", source: "金融炼金术", source_year: 1987, is_featured: 1, tags: ["t-market", "t-philosophy"] },
  { id: v4(), content_cn: "我们对世界的看法永远是不完整的、有偏见的——我把这叫作『易错性』。", content_en: "All human constructs are flawed. This applies both to our understanding of reality and to our institutions.", master_id: "m-soros", source: "开放社会", source_year: 2000, is_featured: 0, tags: ["t-philosophy", "t-mindset"] },
  { id: v4(), content_cn: "先生存，再赚钱。", content_en: "Survive first and make money afterwards.", master_id: "m-soros", source: "访谈", source_year: null, is_featured: 1, tags: ["t-risk", "t-mindset"] },
  { id: v4(), content_cn: "我不是根据规则玩游戏的，我是在寻找游戏规则的改变。", content_en: "I don't play the game by a particular set of rules; I look for changes in the rules of the game.", master_id: "m-soros", source: "索罗斯谈索罗斯", source_year: 1995, is_featured: 0, tags: ["t-contrarian", "t-market"] },
  { id: v4(), content_cn: "当一个趋势盛行时，它本身就会强化它所依赖的那些条件，直到它们最终走向崩溃。", content_en: "Every bubble consists of a trend and a misconception that interact in a reflexive manner.", master_id: "m-soros", source: "金融市场新范式", source_year: 2008, is_featured: 1, tags: ["t-market", "t-contrarian"] },
  { id: v4(), content_cn: "股市泡沫不会凭空出现，它们有坚实的基础——只是这些基础被认知扭曲了。", content_en: "Stock market bubbles don't grow out of thin air. They have a solid basis in reality, but reality as distorted by a misconception.", master_id: "m-soros", source: "金融市场新范式", source_year: 2008, is_featured: 0, tags: ["t-market"] },
  { id: v4(), content_cn: "如果投资是一件让你觉得有趣的事，那你八成没有赚到钱。好的投资是枯燥的。", content_en: "If investing is entertaining, if you're having fun, you're probably not making any money. Good investing is boring.", master_id: "m-soros", source: "访谈", source_year: null, is_featured: 0, tags: ["t-mindset", "t-philosophy"] },
  { id: v4(), content_cn: "我只在我看到靶心时才开枪。", content_en: "I only go to work on the days that make sense to go to work. And I really do something on that day. But you figure that's one day a month. The rest of the time I'm just hanging out.", master_id: "m-soros", source: "Jim Rogers 访谈回忆", source_year: null, is_featured: 0, tags: ["t-mindset", "t-risk"] },
  { id: v4(), content_cn: "当你看到泡沫正在形成时，正确的做法不是做空它，而是骑上它，然后在破灭前下车。", content_en: "When I see a bubble forming, I rush in to buy, adding fuel to the fire. That is not irrational.", master_id: "m-soros", source: "达沃斯论坛演讲", source_year: 2009, is_featured: 1, tags: ["t-contrarian", "t-market"] },
  { id: v4(), content_cn: "我比大多数人更善于预见趋势的终点，因为我在趋势中始终抱着怀疑。", content_en: "I'm not better at predicting events, as I can't. I'm better at recognizing when I'm wrong.", master_id: "m-soros", source: "访谈", source_year: null, is_featured: 0, tags: ["t-mindset", "t-contrarian"] },
  { id: v4(), content_cn: "错误不会伤害你，拒绝承认错误才会。", content_en: "Once we realize that imperfect understanding is the human condition there is no shame in being wrong, only in failing to correct our mistakes.", master_id: "m-soros", source: "金融市场新范式", source_year: 2008, is_featured: 1, tags: ["t-mindset", "t-learning"] },
  { id: v4(), content_cn: "当我意识到我错了，我会立刻认错、马上行动，其他的情绪都留给之后。", content_en: "My approach works not by making valid predictions but by allowing me to correct false ones.", master_id: "m-soros", source: "金融炼金术", source_year: 1987, is_featured: 0, tags: ["t-mindset", "t-learning"] },
  { id: v4(), content_cn: "市场是一个最极端的『易错性』实验室——它在不断用真实亏损来教你谦卑。", content_en: "Markets are constantly in a state of flux; markets are always wrong.", master_id: "m-soros", source: "索罗斯谈索罗斯", source_year: 1995, is_featured: 0, tags: ["t-market", "t-philosophy"] },
  { id: v4(), content_cn: "我的成功并不来自猜对结果，而来自识别自己最初的假设何时不再成立。", content_en: "My conceptual framework enables me to be both a player and an observer... I recognize that I may be wrong.", master_id: "m-soros", source: "索罗斯谈索罗斯", source_year: 1995, is_featured: 0, tags: ["t-mindset", "t-learning"] },
  { id: v4(), content_cn: "当你对一笔交易没有把握时，最好的位置是场外。", content_en: "The worst mistake you can make is to be caught up in a trend you don't really believe in.", master_id: "m-soros", source: "访谈", source_year: null, is_featured: 0, tags: ["t-risk", "t-mindset"] },
  { id: v4(), content_cn: "我赚大钱的方式从来不是靠细节，而是靠宏大的图景——然后用小仓位去验证它。", content_en: "Whenever I can, I take a broad view. The big money is made by getting the big picture right.", master_id: "m-soros", source: "索罗斯谈索罗斯", source_year: 1995, is_featured: 1, tags: ["t-market", "t-learning"] },
  { id: v4(), content_cn: "金融市场的运作原理，归根结底和自然科学完全不同：它研究的是『正在塑造自身』的现象。", content_en: "Social phenomena are different from natural phenomena because they have thinking participants who influence what happens.", master_id: "m-soros", source: "开放社会", source_year: 2000, is_featured: 0, tags: ["t-philosophy", "t-market"] },
  { id: v4(), content_cn: "当事情明显不对劲却每个人都装作没事，那就是最大的风险信号。", content_en: "The prevailing wisdom is that markets are always right. I take the opposite position. I assume that markets are always wrong.", master_id: "m-soros", source: "金融炼金术", source_year: 1987, is_featured: 1, tags: ["t-risk", "t-contrarian"] },

  // 达利欧
  { id: v4(), content_cn: "痛苦+反思=进步。", content_en: "Pain + Reflection = Progress.", master_id: "m-dalio", source: "原则", source_year: 2017, is_featured: 1, tags: ["t-learning", "t-philosophy"] },
  { id: v4(), content_cn: "如果你不感到担忧，你担忧得还不够；如果你过于担忧，你就做不成任何事。", content_en: "If you're not worried, you need to worry — and if you're worried, you don't need to worry.", master_id: "m-dalio", source: "原则", source_year: 2017, is_featured: 0, tags: ["t-risk", "t-mindset"] },
  { id: v4(), content_cn: "最大的错误是无法看到自己的盲点。", content_en: "The biggest mistake you can make is not seeing your own blind spots.", master_id: "m-dalio", source: "原则", source_year: 2017, is_featured: 0, tags: ["t-circle", "t-learning"] },
  { id: v4(), content_cn: "分散投资是投资中唯一的免费午餐。", content_en: "Diversifying well is the most important thing you need to do in order to invest well.", master_id: "m-dalio", source: "原则", source_year: 2017, is_featured: 1, tags: ["t-risk"] },

  // 霍华德·马克斯
  { id: v4(), content_cn: "投资中最重要的事情是对风险的理解。", content_en: "The most important thing is understanding risk.", master_id: "m-marks", source: "投资最重要的事", source_year: 2011, is_featured: 1, tags: ["t-risk"] },
  { id: v4(), content_cn: "你不能通过做和别人一样的事情来获得卓越的业绩。", content_en: "You can't do the same things others do and expect to outperform.", master_id: "m-marks", source: "投资最重要的事", source_year: 2011, is_featured: 0, tags: ["t-contrarian"] },
  { id: v4(), content_cn: "在投资中，和在生活中一样，很少有确定的事情，价值可以消失，预测可以落空。", content_en: "In investing, as in life, there are very few sure things.", master_id: "m-marks", source: "投资最重要的事", source_year: 2011, is_featured: 0, tags: ["t-risk", "t-market"] },
  { id: v4(), content_cn: "经验就是你没有得到你想要的东西时你得到的东西。", content_en: "Experience is what you got when you didn't get what you wanted.", master_id: "m-marks", source: "投资备忘录", source_year: 2015, is_featured: 0, tags: ["t-philosophy", "t-learning"] },

  // 博格
  { id: v4(), content_cn: "不要在干草堆中找针，把整个干草堆买下来。", content_en: "Don't look for the needle in the haystack. Just buy the haystack!", master_id: "m-bogle", source: "共同基金常识", source_year: 1999, is_featured: 1, tags: ["t-value", "t-market"] },
  { id: v4(), content_cn: "时间是你的朋友，冲动是你的敌人。", content_en: "Time is your friend; impulse is your enemy.", master_id: "m-bogle", source: "共同基金常识", source_year: 1999, is_featured: 1, tags: ["t-longterm", "t-mindset"] },
  { id: v4(), content_cn: "复利的魔力和高成本的暴政：投资的全部就是这两件事。", content_en: "The miracle of compounding returns is overwhelmed by the tyranny of compounding costs.", master_id: "m-bogle", source: "博格谈共同基金", source_year: 2006, is_featured: 0, tags: ["t-longterm", "t-value"] },

  // 费雪
  { id: v4(), content_cn: "股票市场充斥着知道一切的价格但不知道任何东西的价值的人。", content_en: "The stock market is filled with individuals who know the price of everything, but the value of nothing.", master_id: "m-fisher", source: "怎样选择成长股", source_year: 1958, is_featured: 1, tags: ["t-value", "t-market"] },
  { id: v4(), content_cn: "对一家公司了解得太少是一种危险，了解得不多却自以为了解很多更加危险。", content_en: "Knowing a great deal about a few things is better than knowing a little about a lot of things.", master_id: "m-fisher", source: "怎样选择成长股", source_year: 1958, is_featured: 0, tags: ["t-circle", "t-business"] },

  // 利弗莫尔
  { id: v4(), content_cn: "华尔街没有新事物。因为投机像山丘一样古老。", content_en: "There is nothing new in Wall Street. There can't be because speculation is as old as the hills.", master_id: "m-livermore", source: "股票大作手回忆录", source_year: 1923, is_featured: 1, tags: ["t-market"] },
  { id: v4(), content_cn: "赚大钱不在于单个股票的波动，而在于对大势的判断。", content_en: "The big money is not in the individual fluctuations but in the main movements.", master_id: "m-livermore", source: "股票大作手回忆录", source_year: 1923, is_featured: 0, tags: ["t-market"] },
  { id: v4(), content_cn: "经验告诉我，如果一笔交易一上来就亏钱，那么这笔交易多半不会好。", content_en: "If a trade doesn't go right from the start, chances are it won't work at all.", master_id: "m-livermore", source: "股票大作手回忆录", source_year: 1923, is_featured: 0, tags: ["t-risk"] },

  // 塔勒布
  { id: v4(), content_cn: "风吹灭蜡烛，却助长火焰。反脆弱性利用冲击和不确定性。", content_en: "Wind extinguishes a candle and energizes fire. You want to be the fire and wish for the wind.", master_id: "m-taleb", source: "反脆弱", source_year: 2012, is_featured: 1, tags: ["t-risk", "t-philosophy"] },
  { id: v4(), content_cn: "真正的问题不在于预测黑天鹅事件，而在于建立对黑天鹅事件的稳健性。", content_en: "The problem is not predicting black swans, but building robustness to them.", master_id: "m-taleb", source: "黑天鹅", source_year: 2007, is_featured: 0, tags: ["t-risk"] },

  // 卡拉曼
  { id: v4(), content_cn: "价值投资看上去简单，但实践起来很难。", content_en: "Value investing is simple to understand but difficult to implement.", master_id: "m-klarman", source: "安全边际", source_year: 1991, is_featured: 1, tags: ["t-value"] },
  { id: v4(), content_cn: "耐心是价值投资者最宝贵的资产。", content_en: "Patience is one of the most valuable assets a value investor can have.", master_id: "m-klarman", source: "安全边际", source_year: 1991, is_featured: 0, tags: ["t-value", "t-longterm", "t-mindset"] },
];

export function seedData() {
  const db = initDb();

  const masterCount = (db.prepare("SELECT COUNT(*) as count FROM masters").get() as { count: number }).count;
  if (masterCount > 0) return;

  const insertMaster = db.prepare(`
    INSERT OR IGNORE INTO masters (id, name_cn, name_en, title, bio, born_year, nationality, category)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertTag = db.prepare(`
    INSERT OR IGNORE INTO tags (id, name, slug, description)
    VALUES (?, ?, ?, ?)
  `);

  const insertQuote = db.prepare(`
    INSERT OR IGNORE INTO quotes (id, content_cn, content_en, master_id, source, source_year, is_featured)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertQuoteTag = db.prepare(`
    INSERT OR IGNORE INTO quote_tags (quote_id, tag_id) VALUES (?, ?)
  `);

  const insertDaily = db.prepare(`
    INSERT OR IGNORE INTO daily_quotes (id, quote_id, display_date) VALUES (?, ?, ?)
  `);

  const transaction = db.transaction(() => {
    for (const m of masters) {
      insertMaster.run(m.id, m.name_cn, m.name_en, m.title, m.bio, m.born_year, m.nationality, m.category);
    }
    for (const t of tags) {
      insertTag.run(t.id, t.name, t.slug, t.description);
    }
    const featuredQuoteIds: string[] = [];
    for (const q of quotes) {
      insertQuote.run(q.id, q.content_cn, q.content_en, q.master_id, q.source, q.source_year, q.is_featured);
      for (const tagId of q.tags) {
        insertQuoteTag.run(q.id, tagId);
      }
      if (q.is_featured) featuredQuoteIds.push(q.id);
    }
    // Seed 30 days of daily quotes
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const quoteId = featuredQuoteIds[i % featuredQuoteIds.length];
      insertDaily.run(v4(), quoteId, dateStr);
    }
  });

  transaction();
}
