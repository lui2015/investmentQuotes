#!/bin/sh
# 初始化数据库数据
node scripts/init-data.mjs
# 启动 Next.js
exec npx next start -p 3000
