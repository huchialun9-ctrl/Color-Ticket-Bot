# 系統架構

## 高階拓撲

```
┌──────────────┐      Gateway/Intent      ┌──────────────────┐
│  Discord     │ ◄──────────────────────► │  bot/ (discord.js)│
│  (伺服器/論壇) │                           └────────┬─────────┘
└──────┬───────┘                                    │ HMAC-SHA256
       │ OAuth2                                       ▼
┌──────▼───────┐   REST (express)   ┌──────────────────┐
│  web/ (儀表板)│ ◄────────────────► │  api/ (Express)   │
└──────────────┘                    └──┬───────┬───────┘
                                       │       │
                              ┌────────▼──┐  ┌▼─────────┐
                              │ MongoDB/  │  │ Redis    │
                              │ PostgreSQL│  │ (TTL 快取)│
                              └───────────┘  └──────────┘
```

## 模組邊界

### bot/ — 即時執行引擎
- `events/`：Gateway 事件監聽（ready / messageCreate / guildMemberAdd / interactionCreate / messageDelete / messageUpdate / voiceStateUpdate）
- `commands/`：Slash 指令（見 `COMMANDS.md`）
- `modules/automod/`：權杖桶防洗版、Anti-Raid、審查日誌（見 `AUTOMOD.md`）
- `modules/ticketing/`：票務頻道生命週期、Transcript、滿意度評分
- `modules/plugins/`：插件熱重載引擎（見 `PLUGINS.md`）

### api/ — 控制平面
- `routes/oauth.*`：Discord OAuth2 授權 + Session
- `routes/guilds.*`：伺服器控制台資料
- `routes/metrics.*`：全域數據看板（Redis 快取，TTL 30s）
- `routes/tickets.*`：批次關閉/批次標記、表單 CRUD、WYSIWYG 預覽 schema
- `routes/plugins.*`：zip 解析（Smart File Scan）、發佈狀態、版本紀錄
- `routes/webhooks.*`：bot 事件接收端（HMAC 驗證）

### web/ — 展示層
- Notion 風格極簡扁平幾何佈局，深/淺主題動態切換
- Ctrl+K / Cmd+K 全域命令面板
- 30 秒輪詢全域數據，數字平滑滾動動畫

## 資料模型（MongoDB 對照）

| Collection | 用途 | 複合索引 |
| --- | --- | --- |
| `guilds` | 每伺服器設定/表單結構 | `guildId + settings` |
| `warns` | 警告紀錄 | `guildId + userId` |
| `tickets` | 票務單（狀態/歸檔） | `guildId + status + createdAt` |
| `plugins` | 插件與版本紀錄 | `guildId + name + version` |
| `globalstats` | 全域計數（可聚合或推送） | `date` |

高頻讀寫欄位一律建立複合索引，確保查詢維持毫秒級。

## 資料流範例：票務建立

1. 用戶在 Discord 點擊面板按鈕 → `interactionCreate`
2. bot 依 guild 設定（來自 `api` 或本地 cache）產生 Modal
3. 提交後建立私密頻道（覆蓋權限：當事人 + 客服 role）
4. `POST /api/tickets` 建立資料列（HMAC 簽章）
5. 關閉時 `status: closed` + 軟刪除旗標 `archived: true`，產出 HTML Transcript
6. 用戶評分 1–5 星寫入 `tickets.rating`

## 擴充優化方案（已納入設計）

- **Sharding**：`bot/src/cluster.js` 提供 `ShardingManager` 啟用叢集分片
- **非同步佇列**：高頻 AutoMod 事件可切換 BullMQ / RabbitMQ 防止 DB 寫入過載
- **沙盒掃描**：`api/services/pluginScanner.js` 整合 ClamAV / 雲端沙盒驗證 zip
- **HMAC-SHA256**：跨服務請求標頭 `X-Chubbman-Signature`（見 `WEBHOOKS.md`）

## 部署（建議）

```bash
# docker-compose.yml 可選：mongodb / redis / api / bot / web
docker compose up -d
```
