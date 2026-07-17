#!/usr/bin/env node
/**
 * 在容器内执行：docker exec -w /app iq node scripts/restore.mjs
 * 
 * 恢复名言 + 解读数据
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const D = require('better-sqlite3');
const db = new D('/app/data/quotes.db');

const INTERP_DIR = '/app/scripts/interpretations';
const EXPAND_DIR = '/app/scripts';
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
  const unmatchedInterps = interps.filter(item => !matched.values().includes(item));
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

db.commit();

const totalInterp = db.prepare('SELECT COUNT(*) c FROM quote_interpretations').get().c;
const totalQ = db.prepare('SELECT COUNT(*) c FROM quotes').get().c;

console.log('\n=== Summary ===');
console.log(`Quotes: ${totalQ}, Interpretations: ${totalInterp}`);
console.log(`Inserted this run: ${inserted}`);
