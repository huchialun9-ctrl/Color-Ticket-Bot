# 插件格式與 Hot-Reload 協定

## zip 規範

開發者上傳 `.zip`，根目錄需包含：

```
plugin-name-1.0.0/
├── manifest.json        # 必填
├── package.json         # 可選（Smart File Scan 優先讀取）
├── index.js             # 進入點，必需
└── ...                  # 其餘資源
```

### manifest.json

```json
{
  "name": "announce-manager",
  "version": "1.0.0",
  "description": "批次公告與排程貼文",
  "author": "developer",
  "main": "index.js",
  "runtime": "discord.js",
  "permissions": ["MANAGE_MESSAGES"],
  "commands": [
    { "name": "announce", "description": "發送公告", "defaultPermissions": ["MANAGE_GUILD"] }
  ]
}
```

## Smart File Scan

後台上傳 zip 後，`api/services/pluginScanner.js`：

1. 以 `yauzl` 流式解壓（避免 zip-bomb），限定檔名白名單與大小。
2. 解析 `package.json`（name/version/main）優先，其次 `manifest.json`。
3. 自動填入外掛名稱、版本號、適用環境與簡短描述。
4. 整合 ClamAV / 沙盒掃描（`PLUGIN_SCAN_ENABLED`），掃描失敗 → 拒絕上傳。

## 熱重載協定（bot/plugin-manager）

- 載入目錄：`bot/plugins/`（由 API 下載驗證後的 zip）。
- `plugin reload <name>` → 移除 cache → `require` 重新載入 → 重新註冊指令。
- 插件暴露 `module.exports = { name, commands, handlers, onLoad(ctx), onUnload(ctx) }`。
- 使用 `delete require.cache` + 弱依賴設計，確保可反覆重載。

## 版本發佈狀態（api）

| 狀態 | 意義 |
| --- | --- |
| `pending` | 上傳後待驗證 |
| `scanning` | 沙盒/掃描中 |
| `approved` | 驗證通過，可下載 |
| `rejected` | 掃描失敗 |
| `published` | 論壇貼文已生成 |

儀表板追蹤版本紀錄與發佈狀態，並提供一鍵複製論壇貼文內容。
