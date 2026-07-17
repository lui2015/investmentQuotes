#!/usr/bin/env python3
"""
v4: 恢复线上数据库 — 名言 + 解读

在容器内执行：
  docker exec -w /app iq python3 scripts/restore-data.py
"""

import json, os, re, sqlite3, sys

DB_PATH = os.environ.get("DB_PATH", os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "quotes.db"))
INTERP_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "interpretations")
EXPAND_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
NGRAM_THRESHOLD = 0.15

MASTER_MAP = {
    "buffett": "m-buffett", "munger": "m-munger", "graham": "m-graham",
    "lynch": "m-lynch", "soros": "m-soros", "dalio": "m-dalio",
    "marks": "m-marks", "bogle": "m-bogle", "fisher": "m-fisher",
    "livermore": "m-livermore", "taleb": "m-taleb", "klarman": "m-klarman",
}

def get_ngrams(text, n=3):
    clean = re.sub(r'[^\u4e00-\u9fff]', '', text or '')
    if len(clean) < n:
        return set()
    return {clean[i:i+n] for i in range(len(clean)-n+1)}

def coverage(quote_text, interp_text):
    q_ngrams = get_ngrams(quote_text, 3)
    i_ngrams = get_ngrams(interp_text, 3)
    if not q_ngrams: return 0.0
    return len(q_ngrams & i_ngrams) / len(q_ngrams)

def interp_full_text(item):
    parts = []
    if item.get("core"): parts.append(item["core"])
    if item.get("story"): parts.append(item["story"])
    if item.get("master_view"): parts.append(item["master_view"])
    if item.get("practice"):
        parts.append(" ".join(item["practice"]) if isinstance(item["practice"], list) else str(item["practice"]))
    return " ".join(parts)

def main():
    if not os.path.exists(DB_PATH):
        print(f"[v4] DB not found: {DB_PATH}", file=sys.stderr)
        sys.exit(1)
    
    db = sqlite3.connect(DB_PATH)
    
    # Step 1: Apply expand SQL files
    expand_files = [
        "expand_quotes.sql", "expand_quotes_part2.sql",
        "expand_quotes_part3.sql", "expand_quotes_part4.sql"
    ]
    quotes_added = 0
    for f in expand_files:
        path_f = os.path.join(EXPAND_DIR, f)
        if not os.path.exists(path_f):
            print(f"  Skip: {f} not found")
            continue
        try:
            sql = open(path_f).read()
            db.executescript(sql)
            print(f"  Applied: {f}")
            quotes_added += 1
        except Exception as e:
            print(f"  Error in {f}: {e}")
    
    # Step 2: Load all quotes
    quotes = {row[0]: {"content": row[1], "master_id": row[2]}
              for row in db.execute("SELECT id, content_cn, master_id FROM quotes")}
    quotes_by_master = {}
    for qid, q in quotes.items():
        quotes_by_master.setdefault(q["master_id"], []).append(q)
    
    # Step 3: Match interpretations
    inserted, skipped = 0, 0
    for master_slug, master_id in MASTER_MAP.items():
        interp_file = os.path.join(INTERP_DIR, f"{master_slug}.json")
        if not os.path.exists(interp_file):
            continue
        
        with open(interp_file) as f:
            interps = json.load(f)
        
        master_quotes = quotes_by_master.get(master_id, [])
        if not master_quotes:
            continue
        
        # Phase 1: Content matching
        matched = {}
        for item in interps:
            text = interp_full_text(item)
            best_score, best_id = 0, None
            for q in master_quotes:
                if q["id"] in matched:
                    continue
                score = coverage(q["content"], text)
                if score > best_score:
                    best_score = score
                    best_id = q["id"]
            if best_score >= NGRAM_THRESHOLD and best_id:
                matched[best_id] = item
        
        # Phase 2: Sequential fallback
        unmatched_interps = [it for it in interps if it not in matched.values()]
        unmatched_quotes = [q for q in master_quotes if q["id"] not in matched]
        pairs = unmatched_interps[:len(unmatched_quotes)]
        for i, item in enumerate(pairs):
            matched[unmatched_quotes[i]["id"]] = item
        
        # Insert
        for qid, item in matched.items():
            practice = item.get("practice", [])
            if isinstance(practice, list):
                practice = json.dumps(practice)
            db.execute(
                """INSERT OR REPLACE INTO quote_interpretations
                   (quote_id, core, practice, story, master_view)
                   VALUES (?, ?, ?, ?, ?)""",
                (qid, item.get("core", ""), practice,
                 item.get("story", ""), item.get("master_view") or None)
            )
            inserted += 1
    
    db.commit()
    
    total_interp = db.execute("SELECT COUNT(*) FROM quote_interpretations").fetchone()[0]
    total_q = db.execute("SELECT COUNT(*) FROM quotes").fetchone()[0]
    
    print("\n=== Summary ===")
    print(f"Quotes: {total_q}, Interpretations: {total_interp}")
    print(f"Inserted this run: {inserted}")
    
    db.close()

if __name__ == "__main__":
    main()
