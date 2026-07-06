# 后台去重定时任务配置

投资名言的后台去重任务需要每天凌晨自动执行。以下三种部署方案任选一种。

---

## 方案一：Linux 服务器 Crontab（推荐用于当前的轻量应用服务器）

### 1. 在服务器上生成一个随机 token

```bash
# 生成 32 位随机字符串
openssl rand -hex 32
# 例如：a1b2c3d4e5f6...（把结果记为 <TOKEN>）
```

### 2. 在 Docker 容器中注入 `CRON_TOKEN` 环境变量

修改容器启动命令，加入 `-e CRON_TOKEN=<TOKEN>`：

```bash
# 停掉旧容器
docker rm -f investment-quotes

# 用新环境变量重新启动
docker run -d \
  --name investment-quotes \
  --restart always \
  -p 9090:3000 \
  -e CRON_TOKEN=<TOKEN> \
  -v /root/iq-data:/app/data \
  investment-quotes:latest
```

### 3. 添加 crontab（每天凌晨 3 点执行）

```bash
crontab -e
```

追加一行：

```cron
0 3 * * * curl -sS -X POST -H "X-Cron-Token: <TOKEN>" https://www.luliming.xyz/investmentQuotes/api/dedupe >> /var/log/quotes-dedupe.log 2>&1
```

保存后，任务将在每天 3:00 自动运行，日志追加到 `/var/log/quotes-dedupe.log`。

### 4. 手动测试

```bash
curl -sS -X POST -H "X-Cron-Token: <TOKEN>" \
  https://www.luliming.xyz/investmentQuotes/api/dedupe | jq
```

---

## 方案二：GitHub Actions（免服务器，需公开访问的域名）

在仓库根目录创建 `.github/workflows/dedupe.yml`：

```yaml
name: Daily Dedupe

on:
  schedule:
    - cron: "0 19 * * *"  # UTC 19:00 = 北京时间 3:00
  workflow_dispatch:       # 支持手动触发

jobs:
  dedupe:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger dedupe API
        run: |
          curl -sSf -X POST \
            -H "X-Cron-Token: ${{ secrets.CRON_TOKEN }}" \
            https://www.luliming.xyz/investmentQuotes/api/dedupe
```

在 GitHub 仓库 `Settings → Secrets and variables → Actions` 中添加 `CRON_TOKEN` secret。

---

## 方案三：Docker Compose + 内建 cron

如果使用 docker-compose，可在同一网络内加一个 cron 容器：

```yaml
services:
  app:
    image: investment-quotes:latest
    environment:
      CRON_TOKEN: ${CRON_TOKEN}
    ports:
      - "9090:3000"
    restart: always

  cron:
    image: alpine:latest
    depends_on:
      - app
    environment:
      CRON_TOKEN: ${CRON_TOKEN}
    command: |
      sh -c "apk add --no-cache curl tzdata && \
             echo '0 3 * * * curl -sS -X POST -H \"X-Cron-Token: $$CRON_TOKEN\" http://app:3000/investmentQuotes/api/dedupe' | crontab - && \
             crond -f -l 2"
    restart: always
```

---

## 手动运行去重任务

管理员可随时手动触发：

```bash
curl -X POST \
  -H "X-Cron-Token: <TOKEN>" \
  https://www.luliming.xyz/investmentQuotes/api/dedupe
```

**返回示例**：

```json
{
  "code": 0,
  "message": "去重任务完成：处理 5 条，入库 3，去重 1，跳过 1",
  "data": {
    "processed": 5,
    "approved": 3,
    "rejected": 1,
    "skipped": 1,
    "details": [
      { "id": "sub-...", "action": "approved", "score": 0.32, "matchedQuoteId": "uq-..." },
      { "id": "sub-...", "action": "rejected", "score": 0.93, "reason": "duplicate" },
      { "id": "sub-...", "action": "skipped", "reason": "master-not-found" }
    ],
    "duration_ms": 15
  }
}
```

---

## 状态说明

用户提交后的处理路径：

| status      | 触发条件                                                | 说明                                     |
| ----------- | ------------------------------------------------------- | ---------------------------------------- |
| `pending`   | 提交成功，等待后台任务处理                              | 每天凌晨会被 `/api/dedupe` 扫描          |
| `approved`  | 大师存在 & 相似度 &lt; 85%                              | 已成功入库为正式名言                     |
| `rejected`  | 相似度 &ge; 85%                                         | 自动去重，被拒绝入库                     |
| `pending`（保留） | 大师未在库中                                       | 保持 pending，需管理员人工审核后创建大师 |

即时快速查重（提交时）：明显重复（相似度 &ge; 85%）会直接返回 `HTTP 409` 拒收，不进 pending 队列。
