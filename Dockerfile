FROM node:20-slim AS builder
WORKDIR /app
# Use Tencent Cloud mirror for faster apt in ap-guangzhou
RUN sed -i 's|http://deb.debian.org|http://mirrors.tencentyun.com|g; s|http://security.debian.org|http://mirrors.tencentyun.com|g' /etc/apt/sources.list.d/debian.sources 2>/dev/null || \
    sed -i 's|http://deb.debian.org|http://mirrors.tencentyun.com|g; s|http://security.debian.org|http://mirrors.tencentyun.com|g' /etc/apt/sources.list 2>/dev/null || true
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
 && rm -rf /var/lib/apt/lists/*
# Use npm China mirror
RUN npm config set registry https://registry.npmmirror.com
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN mkdir -p data && npx next build

FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/src ./src
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/tsconfig.json ./
RUN mkdir -p data
EXPOSE 3000
CMD ["npx", "next", "start", "-p", "3000"]
