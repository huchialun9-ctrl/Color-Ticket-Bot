# Color-Ticket-Bot

# 炫彩票務小幫手 (CHubb-Man)

專為華語圈 Discord 伺服器打造的專業級管理、票務客服與網頁儀表板一體化解決方案。

> 極簡美學 · 自動審查 · 私密票務 · 網頁控制台 · 插件發佈中心

## 功能總覽

| 模組 | 說明 |
| --- | --- |
| **Advanced AutoMod** | `/warn` 累積警告、`/purge` 批次清理、`/lockdown` 一鍵鎖頻道、權杖桶滑動視窗防洗版、Anti-Raid 防爆破、結構化審查日誌 |
| **Ticketing Engine** | 網頁自訂表單 + Modal 彈出式表單、私密隔離頻道、HTML Transcript 匯出、1–5 星滿意度評分 |
| **Plugin Hot-Reload** | 模組化插件，指令或後台上傳 .zip，後台驗證後熱重載，免重啟套用 |
| **網頁儀表板** | Discord OAuth2 登入、全域數據即時看板、單一伺服器控制台、批次票務管理、表單 WYSIWYG 預覽、Webhook 測試面板、Ctrl+K 全域搜尋、深淺主題 |
| **Plugin Release Center** | Smart File Scan 解析 zip、論壇貼文自動生成、一鍵複製與版本狀態追蹤 |
| **後端 API** | Express RESTful API、MongoDB/PostgreSQL、複合索引、Redis 快取、軟刪除歸檔、HMAC-SHA256 簽章 |

## 技術架構

```
胖達/
├── bot/    # Discord.js v14 機器人（事件、指令、AutoMod、票務、插件引擎）
├── api/    # Express 後端（OAuth2、REST API、MongoDB、Redis、插件解析）
├── web/    # Vite + React Notion 風格儀表板
└── docs/   # 工程級技術文件
```

## 快速開始

```bash
# 1. 複製環境變數並填寫 Discord Bot Token / OAuth2 資訊
cp .env.example .env

# 2. 安裝全部 workspace 依賴
npm install

# 3. 同時啟動 bot / api / web
npm run dev
```

- Bot: 連線至 Discord Gateway，註冊 Slash 指令
- API: http://localhost:4000
- Web: http://localhost:5173（開發模式；若已 `npm run build`，API 的 `:4000` 會直接託管前端）

詳細設定請見 [docs/](docs/README.md)。

## 目錄導覽

- [架構總覽](docs/ARCHITECTURE.md)
- [核心指令與參數規範](docs/COMMANDS.md)
- [AutoMod 規則引擎協定](docs/AUTOMOD.md)
- [Webhook JSON 規範](docs/WEBHOOKS.md)
- [插件格式規範](docs/PLUGINS.md)
