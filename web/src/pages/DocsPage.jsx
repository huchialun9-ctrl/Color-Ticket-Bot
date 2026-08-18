import { useState } from 'react';

const DOCS = [
  {
    id: 'commands',
    group: '核心指令',
    items: [
      {
        title: '/warn <user> [reason]',
        desc: '累積警告，達閾值自動禁言。',
        body: [
          '對成員施加警告。當單一成員累積警告達 `automod.warnThreshold`（預設 3）時，自動執行禁言處分。',
          '權限：需要 `ModerateMembers`。',
          '```\n/warn @user 頻繁刷屏\n```',
          '每次警告會寫入 API 審查日誌，並同步至全域統計。',
        ],
      },
      {
        title: '/purge <amount> [user] [filter]',
        desc: '批次清理訊息（≤100、14 天內）。',
        body: [
          '批次刪除頻道訊息，支援按使用者或關鍵字過濾。',
          '限制：單次最多 100 則、且僅能刪除 14 天內的訊息（Discord API 限制）。',
          '```\n/purge 50\n/purge 30 @user\n/purge 20 filter: 廣告\n```',
        ],
      },
      {
        title: '/lockdown <lock|unlock>',
        desc: '一鍵鎖定/解鎖頻道。',
        body: [
          '鎖定頻道時，對 `@everyone` 關閉 SendMessages；解鎖時還原。',
          '適用於災害控管或活動暫停。',
          '```\n/lockdown lock\n/lockdown unlock\n```',
        ],
      },
      {
        title: '/ticket panel | close | rating',
        desc: '票務面板、關閉與評分。',
        body: [
          '`/ticket panel` 於目前頻道建立客服面板；點擊按鈕會依 Guild 表單結構彈出 Modal。',
          '關閉後自動產出 HTML Transcript 並提供 1–5 星評分。',
        ],
      },
      {
        title: '/plugin list | reload <name>',
        desc: '插件熱重載。',
        body: [
          '`/plugin list` 列出已載入插件與其生命週期狀態。',
          '`/plugin reload <name>` 從磁碟重新載入插件，不需重啟 Bot。',
        ],
      },
      {
        title: '/status',
        desc: '檢視閘道延遲、運行時間與系統資訊。',
        body: [
          '回報 Gateway 延遲（ping）、連線狀態、運行時間、伺服器數、覆蓋用戶數與已載入插件數。',
          '全域看板的「線上運行狀態」即以此為依據。',
        ],
      },
      {
        title: '/invite',
        desc: '產生機器人邀請連結。',
        body: [
          '產生標準 Discord 授權連結（`bot` + `applications.commands` scope），可直接將機器人加入其他伺服器。',
        ],
      },
    ],
  },
  {
    id: 'economy',
    group: '社群與經濟娛樂指令',
    items: [
      {
        title: '/daily',
        desc: '每日簽到，賺取伺服器代幣。',
        body: [
          '每 24 小時可執行一次，隨機獲得一定數量的伺服器專屬代幣。',
          '可用於參與盲盒抽獎、預測下注或餵養虛擬寵物。',
          '```\n/daily\n```'
        ]
      },
      {
        title: '/blindbox [action: view|draw] [prize_id]',
        desc: '盲盒抽獎系統。',
        body: [
          '檢視當前可抽取的盲盒獎項列表，或消耗代幣進行盲盒抽卡。',
          '獎品可包含 Discord 稀有身份組（中獎時自動賦予）、專屬代幣等。',
          '```\n/blindbox action: view\n/blindbox action: draw prize_id: prize-id\n```'
        ]
      },
      {
        title: '/predict [action: create|view|resolve|bet]',
        desc: '社群預測押注系統（代幣彩池分紅）。',
        body: [
          '• `create`：發起一個新預測話題（如：今晚打團會不會滅？）。',
          '• `bet`：成員押注代幣在指定選項上。',
          '• `resolve`：當事件結果出爐後，由管理員結算，所有獲勝的下注者將按比例平分彩池！',
          '```\n/predict action: view\n/predict action: bet id: 1 option: 會滅 amount: 100\n```'
        ]
      },
      {
        title: '/profile [user]',
        desc: '查看成員積分、活躍等級與名片。',
        body: [
          '顯示該成員在伺服器的經驗值 (XP)、等級 (Level)、目前代幣餘額以及伺服器排名名片。',
          '```\n/profile\n/profile @user\n```'
        ]
      },
      {
        title: '/pet [action: status|feed|rename]',
        desc: '伺服器專屬虛擬電子雞寵物。',
        body: [
          '• `status`：查看寵物健康度、飢餓度與等級。',
          '• `feed`：消耗代幣餵食寵物。若寵物過於飢餓會生病，影響親密度！',
          '• `rename`：為寵物進行個性化改名。',
          '```\n/pet action: status\n/pet action: feed\n```'
        ]
      },
      {
        title: '/fortune',
        desc: '每日運勢占卜。',
        body: [
          '占卜今日綜合運勢、幸運指數與每日指引，增強社群成員每日互動頻率。',
          '```\n/fortune\n```'
        ]
      },
      {
        title: '/trivia',
        desc: '限時益智問答搶答。',
        body: [
          '發起隨機趣味益智問答題，第一個答對的成員將會獲得額外代幣獎勵！',
          '```\n/trivia\n```'
        ]
      }
    ]
  },
  {
    id: 'automod',
    group: 'AutoMod 規則引擎',
    items: [
      {
        title: '權杖桶演算法',
        desc: '容量 + 補充速率，耗盡自動攔截並短暫禁言（exponential backoff）。',
        body: [
          '每個成員擁有一個權杖桶，容量由 `automod.tokenCapacity` 決定（預設 8）。',
          '訊息事件消耗 1 枚權杖；桶耗盡時攔截該訊息，並執行短暫禁言，禁言時長依違規次數指數成長。',
          '桶以固定速率補充，長期間歇型刷屏會被識別為異常。',
        ],
      },
      {
        title: 'Anti-Raid',
        desc: '60 秒視窗內 10 個新帳號 → 緊急安全鎖定 + Webhook 警報。',
        body: [
          '偵測短時間內大量低帳齡成員加入（`raid.windowMs` / `raid.threshold`，預設 60s / 10 人）。',
          '觸發時啟用驗證門檻（verification_gate），並推送 `security_alert` 事件至 API 與日誌頻道。',
          '全域看板「防爆破觸發次數」即由此事件累計。',
        ],
      },
      {
        title: '審查日誌',
        desc: '訊息刪改、成員進出、語音動態 → 結構化推播至日誌頻道。',
        body: [
          '監聽 messageDelete / messageUpdate / guildMemberAdd / voiceStateUpdate 等事件。',
          '事件以結構化 payload 寫入 `logChannelId` 指定的日誌頻道，並同步至 API（HMAC 簽章）。',
          'payload 格式遵循 Webhook 規範，供外部系統介接。',
        ],
      },
    ],
  },
  {
    id: 'webhooks',
    group: 'Webhook 規範',
    items: [
      {
        title: 'HMAC-SHA256 簽章',
        desc: 'X-Chubbman-Signature: sha256=<hex>，時戳 300 秒防重放。',
        body: [
          '所有 `/api/internal/*` 請求必須帶簽章標頭，防止偽造事件。',
          '```\nX-Chubbman-Signature: sha256=<hex>\nX-Chubbman-Timestamp: <epoch_ms>\n```',
          '簽章計算：`HMAC_SHA256(HMAC_SECRET, ${timestamp}.${method}.${path}.${body})`。',
          '時戳與伺服器差異超過 300 秒將被拒絕（防重放）。',
        ],
      },
      {
        title: 'security_alert payload',
        desc: '防爆破緊急警報（joinsInWindow / threshold / actionTaken）。',
        body: [
          '```json\n{\n  "type": "security_alert",\n  "guild": { "id": "...", "name": "..." },\n  "triggeredAt": "ISO8601",\n  "metric": { "joinsInWindow": 14, "threshold": 10 },\n  "actionTaken": ["verification_gate"]\n}\n```',
        ],
      },
      {
        title: 'message_delete payload',
        desc: '審查日誌結構化事件。',
        body: [
          '```json\n{\n  "type": "audit",\n  "guild": { "id": "...", "name": "..." },\n  "loggedAt": "ISO8601",\n  "action": "message_delete",\n  "channelId": "...",\n  "authorId": "..."\n}\n```',
        ],
      },
      {
        title: 'ticket_* payload',
        desc: '票務建立/關閉事件，feeding 全域票務統計。',
        body: [
          '`ticket_created`：`{ guild, ticketId, channelId, userId, fields }` → 新增 open 票務。',
          '`ticket_closed`：`{ guild, ticketId, rating? }` → 標記 archived 並紀錄評分。',
        ],
      },
    ],
  },
  {
    id: 'plugins',
    group: '插件格式',
    items: [
      {
        title: 'manifest.json',
        desc: 'name / version / description / main / runtime / permissions。',
        body: [
          '```json\n{\n  "name": "my-plugin",\n  "version": "1.0.0",\n  "description": "...",\n  "main": "index.js",\n  "runtime": "node >=18",\n  "permissions": ["send_messages"]\n}\n```',
          '`name` 用於 `/plugin reload <name>` 的唯一識別。',
        ],
      },
      {
        title: 'Hot-Reload',
        desc: 'delete require.cache 後重新載入，onLoad / onUnload 生命週期。',
        body: [
          '插件可匯出 `onLoad(client)` 與 `onUnload()` 生命週期函式。',
          '重載時先呼叫 `onUnload`，清除模組快取（URL query cache-busting），再重新載入並呼叫 `onLoad`。',
        ],
      },
      {
        title: 'Smart File Scan',
        desc: '後台自動解析 zip → 自動填入名稱/版本/環境/描述。',
        body: [
          '插件發佈中心上傳 .zip 後，後端解析 `package.json` 或 `manifest.json` 自動帶入元資料。',
          '並驗證 zip 結構合法性與檔案大小（≤10MB）。',
        ],
      },
    ],
  },
];

/** 工程級技術文件系統：樹狀導覽 + 內容面板 */
export default function DocsPage() {
  const [open, setOpen] = useState(() => DOCS.map((g) => g.id));
  const [active, setActive] = useState(() => ({ group: DOCS[0].id, title: DOCS[0].items[0].title }));

  const toggleGroup = (id) =>
    setOpen((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]));

  const findItem = () =>
    DOCS.find((g) => g.id === active.group)?.items.find((i) => i.title === active.title);

  const item = findItem();

  return (
    <div className="docs-layout">
      <aside className="docs-tree">
        <div className="docs-tree-search">
          <input placeholder="搜尋文件…" onInput={(e) => {
            const q = e.target.value.trim();
            const match = DOCS.flatMap((g) => g.items).find((i) => i.title.includes(q));
            if (match) {
              const g = DOCS.find((gr) => gr.items.includes(match));
              setActive({ group: g.id, title: match.title });
              setOpen((o) => (o.includes(g.id) ? o : [...o, g.id]));
            }
          }} />
        </div>
        {DOCS.map((group) => (
          <div key={group.id} className="tree-group">
            <button className="tree-toggle" onClick={() => toggleGroup(group.id)}>
              <span className={`caret ${open.includes(group.id) ? 'open' : ''}`}>▸</span>
              {group.group}
            </button>
            {open.includes(group.id) && (
              <ul className="tree-children">
                {group.items.map((i) => (
                  <li key={i.title}>
                    <button
                      className={`tree-item ${active.group === group.id && active.title === i.title ? 'active' : ''}`}
                      onClick={() => setActive({ group: group.id, title: i.title })}
                    >
                      {i.title}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </aside>

      <section className="docs-content">
        <div className="docs-crumb">
          {item ? `${DOCS.find((g) => g.id === active.group).group} / ${item.title}` : ''}
        </div>
        <h1>{item?.title}</h1>
        <p className="muted">{item?.desc}</p>
        <div className="doc-body">
          {item?.body.map((line, i) =>
            line.startsWith('```') && line.endsWith('```') ? (
              <pre key={i} className="doc-code">{line}</pre>
            ) : (
              <p key={i}>{line}</p>
            ),
          )}
        </div>
      </section>
    </div>
  );
}
