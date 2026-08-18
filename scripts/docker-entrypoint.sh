#!/usr/bin/env bash
# CHubbMan 容器啟動腳本：API 必啟，Bot 在有 token 時啟用。
set -e

echo "[docker] CHubbMan 啟動中…"

node api/src/index.js &
API_PID=$!

if [ -n "${DISCORD_BOT_TOKEN:-}" ]; then
  echo "[docker] 偵測到 DISCORD_BOT_TOKEN，啟動 BOT…"
  node bot/src/index.js &
  BOT_PID=$!
else
  echo "[docker] 未設定 DISCORD_BOT_TOKEN，僅啟動 API（儀表板/Webhook）。"
  BOT_PID=$API_PID
fi

trap 'kill $API_PID $BOT_PID 2>/dev/null || true' SIGINT SIGTERM EXIT

# 任一程序結束即退出容器，交由平台重啟
wait -n $API_PID $BOT_PID
