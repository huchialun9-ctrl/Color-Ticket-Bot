# AutoMod 規則引擎協定

## 1. 權杖桶滑動視窗防洗版（Token Bucket）

每位用戶對每個 guild 配置一個權杖池：

```
容量 capacity       : guild 設定（預設 8 權杖/分鐘）
補充速率 refillRate : 每秒補充權杖數 = capacity / 60
目前權杖 tokens     : 依時間線性補充，上限 = capacity
```

- 每則訊息發送消耗 `1 + cost(message)` 權杖（長訊息/附件/提及加權）。
- 權杖耗盡 → 攔截訊息 → 依累積違規觸發：`warn` → 短暫禁言（exponential backoff）。
- 滑動視窗：補充與檢查皆基於 `Date.now()` 時間差，非固定視窗重置。

### 狀態計算

```
now = Date.now()
elapsed = (now - lastRefill) / 1000
tokens = min(capacity, tokens + elapsed * refillRate)
lastRefill = now

if tokens - cost < 0 → BLOCK
else tokens -= cost
```

## 2. Anti-Raid 防爆破

監聽 `guildMemberAdd`：

- 滑動視窗（預設 60 秒）內新帳號加入數 ≥ 閾值（預設 10）→ 觸發 RAID。
- 新帳號判定：帳號建立時間 < 30 天。
- 觸發後自動執行：
  1. 伺服器安全鎖定（全頻道撤銷 join 權限或啟用 `VERIFICATION_GATE`）。
  2. 推送緊急安全警報 Webhook（見 `WEBHOOKS.md`，`type: "security_alert"`）。
  3. 記錄至 `globalstats.raidTriggers`（全域防爆破觸發次數 +1）。

## 3. 審查日誌（Audit Logging）

監聽事件並以結構化 Payload 推送至指定日誌頻道：

| 事件 | Payload type |
| --- | --- |
| messageDelete / messageBulkDelete | `message_delete` |
| messageUpdate | `message_edit` |
| guildMemberAdd / guildMemberRemove | `member_join` / `member_leave` |
| voiceStateUpdate | `voice_state` |
| warn / purge / lockdown | `mod_action` |

## 4. 規則引擎設定（guild 設定）

| Key | 預設 | 說明 |
| --- | --- | --- |
| `automod.tokenCapacity` | 8 | 權杖池容量 |
| `automod.warnThreshold` | 3 | 累積警告禁言閾值 |
| `automod.raid.windowMs` | 60000 | Anti-Raid 偵測視窗 |
| `automod.raid.threshold` | 10 | 觸發閾值 |
| `automod.logChannel` | — | 日誌頻道 ID |
| `automod.securityWebhook` | — | 緊急警報 Webhook URL |
