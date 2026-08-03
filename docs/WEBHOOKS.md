# Webhook JSON 規範

所有推送 Payload 為 UTF-8 JSON，`Content-Type: application/json`。

## 緊急安全警報（Anti-Raid）

```json
{
  "type": "security_alert",
  "version": 1,
  "guild": { "id": "123456789", "name": "炫彩社群" },
  "triggeredAt": "2026-08-03T12:00:00.000Z",
  "metric": { "joinsInWindow": 23, "threshold": 10, "windowMs": 60000 },
  "actionTaken": ["verification_gate", "channel_lockdown"],
  "detected": ["user123", "user456"]
}
```

## 審查日誌（message_delete 範例）

```json
{
  "type": "message_delete",
  "version": 1,
  "guild": { "id": "123456789", "name": "炫彩社群" },
  "channel": { "id": "111", "name": "general" },
  "message": { "id": "999", "authorId": "author_id", "content": "被刪除內容" },
  "loggedAt": "2026-08-03T12:05:00.000Z"
}
```

## 跨服務簽章（HMAC-SHA256）

Bot → API 的請求需帶上簽章：

```
Header: X-Chubbman-Signature: sha256=<hex>
計算: hex( HMAC_SHA256( HMAC_SECRET, `${timestamp}.${method}.${path}.${body}` ) )
Header: X-Chubbman-Timestamp: <epoch_ms>
```

接收端：
1. 檢查 `|now - timestamp| ≤ 300s`（防重放）。
2. 重算簽章比對（constant-time compare），不符 → 401。
3. 通過後才處理 body。

## 儀表板 Webhook 測試面板

後台「設定 → Webhook 測試」可手動輸入訊息並點擊發送，即時驗證 Discord 頻道能否正確收到結構化推送。

```json
POST /api/webhooks/test
{
  "webhookUrl": "https://discord.com/api/webhooks/...",
  "title": "測試推播",
  "description": "驗證結構化訊息",
  "fields": [{ "name": "狀態", "value": "OK", "inline": true }]
}
```
