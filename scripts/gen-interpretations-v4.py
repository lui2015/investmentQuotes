#!/usr/bin/env python3
"""
v4: 混合匹配策略 - 内容匹配(高置信) + 顺序配对(兜底)

Phase 1: 内容匹配
  - 对每条解释，提取 core+story+master_view 的 3-gram
  - 与同 master 的名言计算 coverage (名言3-gram中有多少出现在解释中)
  - 贪心1:1匹配，阈值 ≥0.15

Phase 2: 顺序配对(兜底)
  - 剩余未匹配的解释按 quote_id 排序
  - 与同 master 的未使用名言顺序配对

用法：python3 scripts/gen-interpretations-v4.py
"""

import json
import os
import re
import sqlite3
import sys

DB_PATH = os.environ.get("DB_PATH", os.path.join(os.path.dirname(__file__), "..", "data", "quotes.db"))
INTERP_DIR = os.path.join(os.path.dirname(__file__), "interpretations")
COVERAGE_THRESHOLD = 0.15

FILE_TO_MASTER = {
    "buffett": "m-buffett", "munger": "m-munger", "graham": "m-graham",
    "lynch": "m-lynch", "soros": "m-soros", "dalio": "m-dalio",
    "marks": "m-marks", "bogle": "m-bogle", "fisher": "m-fisher",
    "livermore": "m-livermore", "taleb": "m-taleb", "klarman": "m-klarman",
}

def get_ngrams(text, n=3):
    clean = re.sub(r'[^\u4e00-\u9fff]', '', text or '')
    if len(clean) < n:
        return set()
    return {clean[i:i+n] for i in range(len(clean) - n + 1)}

def coverage(quote_text, interp_text):
    q_ngrams = get_ngrams(quote_text, 3)
    i_ngrams = get_ngrams(interp_text, 3)
    if not q_ngrams:
        return 0.0
    return len(q_ngrams & i_ngrams) / len(q_ngrams)

def interp_full_text(item):
    parts = [item.get('core', '') or '',
             item.get('story', '') or '',
             item.get('master_view', '') or '']
    if item.get('practice'):
        parts.append(' '.join(item['practice']) if isinstance(item['practice'], list) else str(item['practice']))
    return ' '.join(parts)

def main():
    if not os.path.exists(DB_PATH):
        print(f"[v4] DB not found: {DB_PATH}", file=sys.stderr)
        sys.exit(1)
    if not os.path.exists(INTERP_DIR):
        print(f"[v4] interpretations dir not found: {INTERP_DIR}", file=sys.stderr)
        sys.exit(1)

    db = sqlite3.connect(DB_PATH)
    db.execute("PRAGMA foreign_keys = ON")
    db.execute("""
        CREATE TABLE IF NOT EXISTS quote_interpretations (
            quote_id TEXT PRIMARY KEY,
            core TEXT NOT NULL,
            practice TEXT NOT NULL,
            story TEXT NOT NULL,
            master_view TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (quote_id) REFERENCES quotes(id)
        );
    """)

    # 加载名言
    quotes_by_master = {}
    for row in db.execute("SELECT id, content_cn, master_id FROM quotes"):
        qid, content, mid = row
        quotes_by_master.setdefault(mid, []).append({"id": qid, "content": content})

    # 加载解释：(file_key, index_in_file, item_dict)
    all_interps = {}
    interp_index = {}  # global_index -> (master_id, file_key, idx)
    gi = 0
    for fname in sorted(os.listdir(INTERP_DIR)):
        if not fname.endswith('.json'):
            continue
        file_key = fname.replace('.json', '')
        master_id = FILE_TO_MASTER.get(file_key)
        if not master_id:
            continue
        with open(os.path.join(INTERP_DIR, fname), 'r') as f:
            arr = json.load(f)
        if not isinstance(arr, list):
            continue
        for idx, item in enumerate(arr):
            all_interps.setdefault(master_id, []).append((file_key, idx, gi, item))
            interp_index[gi] = (master_id, file_key, idx)
            gi += 1

    total_interps = gi
    print(f"[v4] 名言: {sum(len(v) for v in quotes_by_master.values())} 条, 解释: {total_interps} 条\n")

    # Phase 1: 内容匹配
    print("── Phase 1: 内容匹配 ──")
    matched_pairs = []  # [(global_index, quote_id)]
    used_quotes = set()

    for master_id, interps in sorted(all_interps.items()):
        candidates = quotes_by_master.get(master_id, [])
        if not candidates:
            continue

        # 每条解释找最佳匹配
        scored = []
        for file_key, idx, gi, item in interps:
            text = interp_full_text(item)
            best_score, best_qid = 0.0, None
            for q in candidates:
                s = coverage(q['content'], text)
                if s > best_score:
                    best_score, best_qid = s, q['id']
            if best_score >= COVERAGE_THRESHOLD:
                scored.append((best_score, best_qid, gi))

        # 贪心1:1
        scored.sort(key=lambda x: -x[0])
        master_matched = 0
        for score, qid, gi in scored:
            if qid in used_quotes:
                continue
            matched_pairs.append((gi, qid))
            used_quotes.add(qid)
            master_matched += 1

        total = len(interps)
        if total > 0 and master_matched > 0:
            print(f"  {master_id}: {master_matched}/{total} 内容匹配 ({master_matched/total*100:.0f}%)")
        elif total > 0:
            print(f"  {master_id}: 0/{total} 内容匹配")

    phase1_count = len(matched_pairs)
    matched_gis = {gi for gi, _ in matched_pairs}
    print(f"  Phase1 合计: {phase1_count} 条\n")

    # Phase 2: 顺序配对
    print("── Phase 2: 顺序配对兜底 ──")
    phase2_count = 0

    for master_id, interps in sorted(all_interps.items()):
        available = [q for q in quotes_by_master.get(master_id, []) if q['id'] not in used_quotes]
        remaining = [(gi, item) for _, _, gi, item in interps if gi not in matched_gis]

        if not available or not remaining:
            if remaining:
                print(f"  {master_id}: {len(remaining)} 条解释无可用名言（跳过）")
            continue

        # 排序配对
        remaining.sort(key=lambda x: x[1].get('quote_id', ''))
        available.sort(key=lambda q: q['id'])

        n = min(len(remaining), len(available))
        for i in range(n):
            gi, _ = remaining[i]
            qid = available[i]['id']
            matched_pairs.append((gi, qid))
            used_quotes.add(qid)
            matched_gis.add(gi)
            phase2_count += 1

        print(f"  {master_id}: +{n} 顺序配对 (剩余{len(remaining)-n}条跳过)")

    print(f"  Phase2 合计: +{phase2_count} 条\n")

    # 写入数据库
    print(f"── 写入数据库 ──")
    matched_by_id = {gi: qid for gi, qid in matched_pairs}
    inserted, replaced, skipped = 0, 0, 0

    for master_id, interps in all_interps.items():
        for _, _, gi, item in interps:
            qid = matched_by_id.get(gi)
            if not qid:
                skipped += 1
                continue
            practice_json = json.dumps(
                item['practice'] if isinstance(item.get('practice'), list)
                else [str(item.get('practice', ''))]
            )
            mv = item.get('master_view') or None
            existed = db.execute("SELECT 1 FROM quote_interpretations WHERE quote_id = ?", (qid,)).fetchone()
            db.execute(
                "INSERT OR REPLACE INTO quote_interpretations (quote_id, core, practice, story, master_view) VALUES (?, ?, ?, ?, ?)",
                (qid, item['core'], practice_json, item.get('story', ''), mv)
            )
            if existed:
                replaced += 1
            else:
                inserted += 1

    db.commit()
    print(f"  新插入: {inserted}, 覆盖: {replaced}, 跳过: {skipped}")

    # 最终统计
    total_int = db.execute("SELECT COUNT(*) FROM quote_interpretations").fetchone()[0]
    total_q = sum(len(v) for v in quotes_by_master.values())
    remaining_q = db.execute("""
        SELECT COUNT(*) FROM quotes q
        WHERE NOT EXISTS (SELECT 1 FROM quote_interpretations i WHERE i.quote_id = q.id)
    """).fetchone()[0]

    print(f"\n── 最终统计 ──")
    print(f"  解读总数: {total_int} / 名言总数: {total_q}")
    print(f"  有解读的名言: {total_q - remaining_q}, 仍未覆盖: {remaining_q}")

    stats = db.execute("""
        SELECT m.name_cn, COUNT(q.id), COUNT(i.quote_id)
        FROM quotes q JOIN masters m ON q.master_id = m.id
        LEFT JOIN quote_interpretations i ON q.id = i.quote_id
        GROUP BY m.name_cn ORDER BY m.name_cn
    """).fetchall()

    print(f"\n  按大师:")
    for name, total, w_int in stats:
        pct = f"{w_int/total*100:.0f}%" if total > 0 else "-"
        print(f"    {name}: {w_int}/{total} ({pct})")

    print(f"\n[v4] 完成!")

if __name__ == "__main__":
    main()
