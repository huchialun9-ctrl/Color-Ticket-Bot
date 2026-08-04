# syntax=docker/dockerfile:1
# ============================================================
# CHubbMan小幫手 — 單一容器部署（API + 已建置前端，Bot 可選）
# 建置：npm run build:web  →  啟動：/entrypoint.sh
# 環境變數：.env.example 中的所有變數皆可由平台注入
# ============================================================

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY bot/package.json bot/package.json
COPY api/package.json api/package.json
COPY web/package.json web/package.json
# 臨時改為 npm install 以繞過 lockfile mismatch（請在有電腦時用 npm install --workspace=api 產生正式 lockfile，並把此行改回 npm ci）
RUN npm install --no-audit --no-fund

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# 依賴（含 devDeps 以進行前端建置）
COPY --from=deps /app/node_modules ./node_modules
# 原始碼
COPY . .
# 建置前端（Vite → web/dist，由 API 直接託管）
RUN npm run build:web
# 啟動腳本
RUN apk add --no-cache bash
COPY scripts/docker-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 4000
ENTRYPOINT ["/entrypoint.sh"]
