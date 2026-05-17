# 名言数据库扩充说明

## 概述
本目录包含用于扩充投资名言数据库的SQL脚本，已成功从原来的约192条名言扩充到702条。

## ⚠️ 已执行扩充

**扩充已完成！** 当前数据库包含 702 条名言，分布在 12 位投资大师名下。

## 名言分布
- 巴菲特 (Buffett): 100条
- 查理·芒格 (Munger): 50条
- 本杰明·格雷厄姆 (Graham): 50条
- 彼得·林奇 (Lynch): 50条
- 乔治·索罗斯 (Soros): 50条
- 瑞·达利欧 (Dalio): 50条
- 霍华德·马克斯 (Marks): 50条
- 约翰·博格 (Bogle): 50条
- 菲利普·费雪 (Fisher): 40条
- 杰西·利弗莫尔 (Livermore): 40条
- 纳西姆·塔勒布 (Taleb): 40条
- 塞斯·卡拉曼 (Klarman): 40条

**总计: 约650条新名言**

## 文件说明

| 文件名 | 说明 |
|--------|------|
| `expand_quotes.sql` | 芒格(50条) + 格雷厄姆(50条) + 林奇(50条) |
| `expand_quotes_part2.sql` | 索罗斯(50条) + 达利欧(50条) + 马克斯(50条) |
| `expand_quotes_part3.sql` | 博格(50条) + 费雪(40条) + 利弗莫尔(40条) |
| `expand_quotes_part4.sql` | 塔勒布(40条) + 卡拉曼(40条) |
| `expand_quotes_full.sql` | 完整合并文件，包含所有名言 |
| `expand-data.js` | 原始JavaScript脚本模板 |

## 使用方法

### 方法一：使用SQLite命令直接导入
```bash
# 进入项目目录
cd /path/to/investmentQuotes

# 执行SQL文件
sqlite3 .next/data.db < scripts/expand_quotes_full.sql
```

### 方法二：在SQLite命令行中执行
```bash
# 进入数据库目录
cd /path/to/investmentQuotes/.next

# 启动SQLite
sqlite3 data.db

# 在SQLite命令行中执行SQL
sqlite> .read ../scripts/expand_quotes_full.sql

# 验证名言数量
sqlite> SELECT COUNT(*) FROM quotes;
```

### 方法三：分批导入
如果您想分批导入，可以分别执行各个文件：
```bash
sqlite3 .next/data.db < scripts/expand_quotes.sql
sqlite3 .next/data.db < scripts/expand_quotes_part2.sql
sqlite3 .next/data.db < scripts/expand_quotes_part3.sql
sqlite3 .next/data.db < scripts/expand_quotes_part4.sql
```

## 验证导入结果

执行以下SQL查询验证导入结果：

```sql
-- 查看名言总数
SELECT COUNT(*) as total_quotes FROM quotes;

-- 查看各大师名言数量
SELECT m.name_cn, COUNT(q.id) as quote_count 
FROM masters m 
LEFT JOIN quotes q ON m.id = q.master_id 
GROUP BY m.id;

-- 查看标签分布
SELECT t.name, COUNT(qt.quote_id) as tag_count 
FROM tags t 
LEFT JOIN quote_tags qt ON t.id = qt.tag_id 
GROUP BY t.id;
```

## 注意事项

1. **INSERT OR IGNORE**: 所有INSERT语句都使用了`INSERT OR IGNORE`，这意味着如果名言ID已存在，则不会重复插入。
2. **数据库位置**: 默认数据库位置为`.next/data.db`，请根据实际情况调整路径。
3. **备份建议**: 在执行导入前，建议先备份数据库。
4. **重新部署**: 如果您使用的是Docker部署，可能需要重新构建并启动容器。

## 在Docker环境中执行

如果您使用的是Docker部署：

```bash
# 1. 进入运行中的容器
docker exec -it investmentQuotes-db-1 /bin/bash

# 2. 进入数据库目录
cd /app/.next

# 3. 执行SQL文件
sqlite3 data.db < /app/scripts/expand_quotes_full.sql

# 4. 验证
sqlite3 data.db "SELECT COUNT(*) FROM quotes;"
```

## 预计结果
- 原有名言: ~115条
- 新增名言: ~650条
- 预计总数: ~765条
