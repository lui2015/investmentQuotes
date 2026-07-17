#!/usr/bin/env node
/**
 * v4: 恢复线上数据库 — 名言 + 解读
 * 
 * 在容器内执行：
 *   docker exec iq node scripts/restore-data.mjs
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data/quotes.db');
const INTERP_DIR = path.join(process.cwd(), 'scripts/interpretations');
const EXPAND_DIR = path.join(process.cwd(), 'scripts');
const NGRAM_THRESHOLD = 0.15;

const MASTER_MAP = {
  'buffett': 'm-buffett', 'munger': 'm-munger', 'graham': 'm-graham',
  'lynch': 'm-lynch', 'soros': 'm-soros', 'dalio': 'm-dalio',
  'marks': 'm-marks', 'bogle': 'm-bogle', 'fisher': 'm-fisher',
  'livermore': 'm-livermore', 'taleb': 'm-taleb', 'klarman': 'm-klarman',
};

function getNgrams(text, n = 3) {
  const clean = text.replace(/[^\u4e00-\u9fff]/g, '');
  if (len(clean) < n) return new Set();
  const result = new Set();
  for (let i = 0; i <= clean.length - n; i++) result.add(clean.slice(i, i + n));
  return result;
}

function coverage(quoteText, interpText) {
  const q = getNgrams(quoteText, 3);
  const i = getNgrams(interpText, 3);
  if (!q.size) return 0;
  return q.size === 0 ? 0 : (q.size + i.size - new Set([...q, ...i]).size) / q.size;
}

function interpFullText(item) {
  const parts = [item.get('core', '') || '', item.get('story', '') || '', item.get('master_view', '') || ''];
  if (item.get('practice')) parts.push(' '.join(item['practice'] if isinstance(item['practice'], list) else [str(item['practice'])]));
  return ' '.join(parts);
}

// Fix: Node doesn't have Python-style get(). Let's use a proper approach.
function interpFullText2(item) {
  const parts = [];
  if (item.core) parts.push(item.core);
  if (item.story) parts.push(item.story);
  if (item.master_view) parts.push(item.master_view);
  if (item.practice) {
    parts.push(Array.isArray(item.practice) ? item.practice.join(' ') : String(item.practice));
  }
  return parts.join(' ');
}

function main() {
  const D = require('better-sqlite3');
  const db = new D(DB_PATH);
  
  // Check DB exists
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('Tables:', tables.map(t => t.name).join(', '));
  
  // Step 1: Apply expand SQL files
  const expandFiles = ['expand_quotes.sql', 'expand_quotes_part2.sql', 'expand_quotes_part3.sql', 'expand_quotes_part4.sql'];
  let quotesAdded = 0;
  
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
  
  // Step 2: Match interpretations
  const quotes = db.prepare('SELECT id, content_cn, master_id FROM quotes').all();
  quotesByMaster = new Map();
  for (const q of quotes) {
    if (!quotesByMaster.has(q.master_id)) quotesByMaster.set(q.master_id, []);
    quotesByMaster.get(q.master_id).push(q);
  }
  
  let inserted = 0, skipped = 0;
  
  for (const [masterSlug, masterId] of Object.entries(MASTER_MAP)) {
    const interpFile = path.join(INTERP_DIR, `${masterSlug}.json`);
    if (!fs.existsSync(interpFile)) continue;
    
    const interps = JSON.parse(fs.readFileSync(interpFile, 'utf-8'));
    const masterQuotes = quotesByMaster.get(masterId) || [];
    if (masterQuotes.length === 0) continue;
    
    // Phase 1: Content matching
    const matched = new Map();
    for (const item of interps) {
      const text = interpFullText2(item);
      let bestScore = 0, bestId = null;
      for (const q of masterQuotes) {
        if (matched.has(q.id)) continue;
        const score = coverage(q.content_cn, text);
        if (score > bestScore) { bestScore = score; bestId = q.id; }
      }
      if (bestScore >= NGRAM_THRESHOLD && bestId) {
        matched.set(bestId, item);
      }
    }
    
    // Phase 2: Sequential fallback
    const unmatchedInterps = interps.filter(item => !matched.values().includes(item));
    const unmatchedQuotes = masterQuotes.filter(q => !matched.has(q.id));
    const pairs = unmatchedInterps.slice(0, unmatchedQuotes.length);
    for (let i = 0; i < pairs.length; i++) {
      matched.set(unmatchedQuotes[i].id, pairs[i]);
    }
    
    // Insert
    for (const [qid, item] of matched) {
      try {
        db.prepare(`
          INSERT OR REPLACE INTO quote_interpretations (quote_id, core, practice, story, master_view)
          VALUES (?, ?, ?, ?, ?)
        `).run(
          qid,
          item.core,
          JSON.stringify(item.practice || []),
          item.story || '',
          item.master_view || null
        );
        inserted++;
      } catch (e) {
        skipped++;
      }
    }
  }
  
  db.close();
  
  const totalInterp = db.prepare('SELECT COUNT(*) c FROM quote_interpretations').get().c;
  const totalQuotes = db.prepare('SELECT COUNT(*) c FROM quotes').get().c;
  
  console.log('\n=== Summary ===');
  console.log(`Quotes: ${totalQuotes}`);
  console.log(`Interpretations: ${totalInterp}`);
  console.log(`Inserted this run: ${inserted}, skipped: ${skipped}`);
}

if (__name__ === "main") main();
