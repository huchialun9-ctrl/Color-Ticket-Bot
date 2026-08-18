import React, { useState } from 'react';
import Icon from '../components/Icon.jsx';

const COMMANDS = [
  {
    category: '經濟與娛樂',
    icon: 'puzzle',
    items: [
      { name: '/daily', desc: '每日簽到領取隨機金幣與經驗值。', usage: '/daily' },
      { name: '/blindbox', desc: '購買並開啟驚喜盲盒，有機會獲得稀有獎勵！管理員可新增/移除。', usage: '/blindbox [action]' },
      { name: '/fortune', desc: '抽取每日運勢籤，看看今天的運氣如何。', usage: '/fortune' },
      { name: '/pet', desc: '領養、餵食、陪玩並與你的專屬電子寵物互動。', usage: '/pet [status|feed|play|rename]' },
      { name: '/trivia', desc: '參加隨機問答遊戲，最快答對可獲得代幣獎勵。', usage: '/trivia' },
    ]
  },
  {
    category: '社群與個人',
    icon: 'users',
    items: [
      { name: '/profile', desc: '查看你的個人檔案、等級、經驗值與錢包餘額。', usage: '/profile [@user]' },
      { name: '/birthday', desc: '設定你的生日，系統會在當天給予特別驚喜與代幣。', usage: '/birthday [MM-DD]' },
      { name: '/poll', desc: '快速建立社群投票，支援最多 10 個選項。', usage: '/poll [question] [options]' },
      { name: '/predict', desc: '參與社群預測活動下注贏得獎金。管理員可發起與結算派彩。', usage: '/predict [list|bet|create|resolve]' },
      { name: '/team', desc: '一鍵打散並隨機分組語音頻道內的成員。', usage: '/team [語音頻道] [隊伍數量]' },
      { name: '/globalchat', desc: '設定跨群聊天頻道，與全網其他伺服器的成員即時交流！', usage: '/globalchat [set|disable]' },
    ]
  },
  {
    category: '客服與實用工具',
    icon: 'ticket',
    items: [
      { name: '/ticket', desc: '客服單系統。建立面板、新增內部備忘錄、評分與結算。', usage: '/ticket [panel|close|rating|memo]' },
      { name: '/voicecreator', desc: '設定動態語音 (Join to Create) 母頻道。', usage: '/voicecreator [set|disable]' },
      { name: '/giveaway', desc: '發起限時抽獎活動，自動抽出幸運兒。', usage: '/giveaway [prize] [duration] [winners]' },
      { name: '/countdown', desc: '設定一個全球倒數計時板。', usage: '/countdown [name] [timestamp]' },
      { name: '/report', desc: '向管理員發送匿名檢舉或回報。', usage: '/report' },
      { name: '/help', desc: '獲取機器人的完整說明與求助選單。', usage: '/help' },
    ]
  },
  {
    category: '安全與進階管理',
    icon: 'shield',
    items: [
      { name: '/ban', desc: '封鎖並從伺服器移除違規成員。', usage: '/ban [@user] [reason]' },
      { name: '/kick', desc: '踢出違規成員。', usage: '/kick [@user] [reason]' },
      { name: '/temprole', desc: '發放限時身份組，時間到自動回收。', usage: '/temprole [@user] [@role] [minutes]' },
      { name: '/warn', desc: '警告違規成員，累積達到閾值將自動禁言。', usage: '/warn [@user] [reason]' },
      { name: '/prune', desc: '根據不活躍天數與條件踢除幽靈人口。', usage: '/prune [days] [has_role]' },
      { name: '/purge', desc: '大量清理頻道內的近期訊息。', usage: '/purge [amount]' },
      { name: '/lockdown', desc: '緊急鎖定或解鎖當前頻道。', usage: '/lockdown' },
      { name: '/export_bans', desc: '將目前所有黑名單匯出成 CSV 檔案。', usage: '/export_bans' },
      { name: '/health', desc: '為伺服器進行資安與防爆破健康檢查評分。', usage: '/health' },
      { name: '/plugin', desc: '管理外掛程式。', usage: '/plugin [list|load|unload]' },
    ]
  }
];

export default function CommandDirectory() {
  const [activeCategory, setActiveCategory] = useState(COMMANDS[0].category);

  return (
    <div className="page" style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'left' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <Icon name="book" size={28} style={{ color: 'var(--accent)' }} />
        <h1 style={{ margin: 0 }}>指令圖鑑與功能指南</h1>
      </div>
      <p className="muted" style={{ marginBottom: '32px' }}>
        探索胖達CHubbMan的所有超能力！這裡列出了所有的斜線指令 (Slash Commands) 及其用法說明。
      </p>

      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
        {/* 左側導覽列 */}
        <aside style={{ 
          flex: '0 0 220px', 
          background: 'var(--card)', 
          border: '1px solid var(--border)', 
          borderRadius: '10px', 
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {COMMANDS.map((cat) => (
            <button
              key={cat.category}
              className={activeCategory === cat.category ? 'primary' : 'ghost'}
              onClick={() => setActiveCategory(cat.category)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                fontSize: '14px',
                fontWeight: activeCategory === cat.category ? '600' : '500',
                borderRadius: '6px',
                justifyContent: 'flex-start',
                border: 'none',
                background: activeCategory === cat.category ? 'var(--accent)' : 'transparent',
                color: activeCategory === cat.category ? 'var(--accent-fg)' : 'var(--fg)',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon name={cat.icon} size={16} />
              {cat.category}
            </button>
          ))}
        </aside>

        {/* 右側內容區 */}
        <div style={{ flex: 1 }}>
          {COMMANDS.map((cat) => (
            <div key={cat.category} style={{ display: activeCategory === cat.category ? 'block' : 'none' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '20px', marginBottom: '20px' }}>
                <Icon name={cat.icon} size={20} />
                {cat.category}
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {cat.items.map((cmd) => (
                  <div key={cmd.name} style={{ 
                    background: 'var(--card)', 
                    border: '1px solid var(--border)', 
                    borderRadius: '8px', 
                    padding: '16px 20px',
                    transition: 'border-color 0.2s',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <span style={{ 
                        background: 'var(--code-bg)', 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        fontFamily: 'monospace', 
                        fontSize: '15px', 
                        fontWeight: 'bold',
                        color: 'var(--accent)'
                      }}>
                        {cmd.name}
                      </span>
                    </div>
                    <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--fg)' }}>
                      {cmd.desc}
                    </p>
                    <div style={{ background: 'var(--bg)', padding: '8px 12px', borderRadius: '4px', fontSize: '13px', color: 'var(--muted)', display: 'inline-block' }}>
                      <Icon name="webhook" size={12} style={{ marginRight: '6px', opacity: 0.6 }} />
                      <code style={{ background: 'transparent', padding: 0 }}>{cmd.usage}</code>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
