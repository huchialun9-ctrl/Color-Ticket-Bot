# 核心指令與參數規範

所有指令以 Slash Command 註冊，`guild.id` 用於資料隔離。

## 管理類

### /warn `<user> [reason] [amount]`
- 累積警告協定。超過閾值（預設 3，可於 guild 設定調整）自動執行禁言。
- 事件寫入 `warns`（guildId + userId 複合索引）並推送審查日誌。

### /purge `<amount> [user] [filter]`
- 批次清理訊息。`filter`: `all | bot | attachments | embeds`。
- 檢查 `MESSAGE_MANAGE` 權限，並限制單次 ≤ 100 則、舊訊息 ≤ 14 天（Discord 限制）。

### /lockdown `<on|off> [channel] [reason]`
- 一鍵鎖定/解鎖頻道：對該頻道全員撤銷 `SEND_MESSAGES`，並保留管理員例外。

### /config `<key> [value]`
- 讀取/寫入 guild 設定（warn 閾值、防洗版參數、日誌頻道、客服 role）。

## 票務類

### /ticket panel
- 建立票務面板（按鈕 + 可選下拉表單）。

### /ticket close
- 關閉當前票務頻道 → 標記 `closed` + 軟刪除 → 產出 HTML Transcript。

### /ticket rating `<stars>`
- 1–5 星滿意度評分，寫入票務單。

### /ticket export
- 匯出當前頻道對話為 HTML Transcript 附件。

## 插件類

### /plugin list
- 列出已載入插件（名稱 / 版本 / 啟用狀態）。

### /plugin reload `<name>`
- 熱重載單一插件，免重啟 Bot。

### /plugin load `<name>`
- 從已驗證的上傳目錄載入插件。

## 權限模型

| 指令 | 最低權限 |
| --- | --- |
| warn / purge / lockdown / config | `MANAGE_MESSAGES` 或 `MANAGE_GUILD` |
| ticket panel / close / export | 管理員或客服 role（guild 設定） |
| plugin * | 管理員 |
