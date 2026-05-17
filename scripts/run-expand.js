/**
 * 名言扩充脚本
 * 运行方法: node scripts/run-expand.js
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'quotes.db');

// 各部分SQL文件
const SQL_FILES = [
  'scripts/expand_quotes.sql',
  'scripts/expand_quotes_part2.sql',
  'scripts/expand_quotes_part3.sql',
  'scripts/expand_quotes_part4.sql'
];

console.log('开始扩充名言数据库...\n');

function executeSqlFile(db, filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // 分割成单独的语句
  const lines = content.split('\n');
  let currentStatement = '';
  let statementCount = 0;
  let insertCount = 0;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // 跳过注释和空行
    if (trimmed.startsWith('--') || trimmed.startsWith('/*') || trimmed === '') {
      continue;
    }
    
    currentStatement += line + '\n';
    
    // 检测语句结束
    if (trimmed.endsWith(');') || trimmed.endsWith(');')) {
      try {
        // 检查是否是INSERT语句
        const upperStmt = currentStatement.toUpperCase().trim();
        if (upperStmt.startsWith('INSERT')) {
          db.exec(currentStatement);
          insertCount++;
        }
        statementCount++;
      } catch (e) {
        // 忽略错误（可能是重复插入）
      }
      currentStatement = '';
    }
  }
  
  return { statementCount, insertCount };
}

try {
  // 连接数据库
  const db = new Database(DB_PATH);
  
  // 检查当前名言数量
  const beforeCount = db.prepare('SELECT COUNT(*) as count FROM quotes').get();
  console.log(`扩充前名言数量: ${beforeCount.count}`);
  
  let totalInserted = 0;
  
  // 执行每个SQL文件
  for (const file of SQL_FILES) {
    const fullPath = path.join(__dirname, '..', file);
    if (fs.existsSync(fullPath)) {
      console.log(`\n执行 ${path.basename(file)}...`);
      const result = executeSqlFile(db, fullPath);
      console.log(`  处理语句: ${result.statementCount}, 插入: ${result.insertCount}`);
      totalInserted += result.insertCount;
    }
  }
  
  // 检查扩充后名言数量
  const afterCount = db.prepare('SELECT COUNT(*) as count FROM quotes').get();
  console.log(`\n扩充后名言数量: ${afterCount.count}`);
  console.log(`新增名言数量: ${afterCount.count - beforeCount.count}`);
  
  // 按大师统计
  console.log('\n各大师名言数量:');
  const masterStats = db.prepare(`
    SELECT m.name_cn, COUNT(q.id) as count 
    FROM masters m 
    LEFT JOIN quotes q ON m.id = q.master_id 
    GROUP BY m.id 
    ORDER BY count DESC
  `).all();
  
  masterStats.forEach(row => {
    console.log(`  ${row.name_cn}: ${row.count}`);
  });
  
  // 标签统计
  console.log('\n标签分布:');
  const tagStats = db.prepare(`
    SELECT t.name, COUNT(qt.quote_id) as count 
    FROM tags t 
    LEFT JOIN quote_tags qt ON t.id = qt.tag_id 
    GROUP BY t.id 
    ORDER BY count DESC
    LIMIT 10
  `).all();
  
  tagStats.forEach(row => {
    console.log(`  ${row.name}: ${row.count}`);
  });
  
  db.close();
  
  console.log('\n✅ 名言扩充完成!');
  console.log('刷新页面即可看到新增的名言。');
  
} catch (error) {
  console.error('❌ 扩充失败:', error.message);
  process.exit(1);
}
