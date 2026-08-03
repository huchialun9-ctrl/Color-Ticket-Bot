# 工程技術文件

樹狀結構導覽：

```
docs/
├── README.md          # 本文
├── ARCHITECTURE.md    # 系統架構、模組邊界、擴充方案
├── COMMANDS.md        # 核心指令與參數規範
├── AUTOMOD.md         # AutoMod 規則引擎協定（權杖桶、Anti-Raid）
├── WEBHOOKS.md        # Webhook JSON 規範與 HMAC 簽章
└── PLUGINS.md         # 插件 zip 格式與 hot-reload 協定
```

## 快速索引

| 主題 | 文件 |
| --- | --- |
| 三端架構與資料流 | `ARCHITECTURE.md` |
| Slash 指令參數表 | `COMMANDS.md` |
| 防洗版權杖桶演算法 | `AUTOMOD.md` |
| 緊急安全警報 Webhook | `AUTOMOD.md` / `WEBHOOKS.md` |
| 審查日誌事件 Payload | `WEBHOOKS.md` |
| HTML Transcript 匯出 | `ARCHITECTURE.md` |
| 插件 manifest / hot-reload | `PLUGINS.md` |
