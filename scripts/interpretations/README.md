README - 名言解读数据生成流程
=============================

目标：给每条名言补 4 块解读 —— 核心解读 / 应用实操 / 生动案例 / 大师视角

## 数据流向

```
12 个 JSON 文件 (scripts/interpretations/<master_id>.json)
        ↓
gen-interpretations.mjs
        ↓
quote_interpretations 表 (SQLite)
        ↓
详情页 4 块结构渲染
```

## 文件清单（按 master_id 命名）

| 文件 | 名言条数 | 状态 |
|---|---|---|
| buffett.json | 86 | ⏳ 待生成 |
| munger.json | 34 | ⏳ 待生成 |
| lynch.json | 30 | ⏳ 待生成 |
| graham.json | 30 | ⏳ 待生成 |
| marks.json | 29 | ⏳ 待生成 |
| soros.json | 28 | ⏳ 待生成 |
| bogle.json | 28 | ⏳ 待生成 |
| klarman.json | 27 | ⏳ 待生成 |
| fisher.json | 27 | ⏳ 待生成 |
| dalio.json | 4 | ⏳ 待生成 |
| livermore.json | 3 | ⏳ 待生成 |
| taleb.json | 2 | ⏳ 待生成 |
| **合计** | **328** | |

## JSON 单条结构

```json
{
  "quote_id": "uq-xxxx-xxxx-0001",
  "core": "60-120 字说人话的解读",
  "practice": ["实操 1", "实操 2", "实操 3", "实操 4"],
  "story": "1-2 段真实故事或场景化情节（80-180 字）",
  "master_view": "这句话在该大师思想体系里的位置（40-80 字）"
}
```

## 执行

```bash
# 容器内 / 服务器上跑
node scripts/gen-interpretations.mjs

# 自定义库路径
DB_PATH=/path/to/quotes.db node scripts/gen-interpretations.mjs
```

脚本会输出"新插入 / 覆盖 / 跳过 / 实际写入 / 表内总条数 / 仍未覆盖"统计。
