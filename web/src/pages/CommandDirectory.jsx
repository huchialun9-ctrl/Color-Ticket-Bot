import React, { useState } from 'react';
import Icon from '../components/Icon.jsx';

const COMMANDS = [
  {
    category: '經濟與娛樂',
    icon: 'puzzle',
    items: [
      { name: '/daily', desc: '每日簽到領取隨機金幣與經驗值。', usage: '/daily' },
      { name: '/blindbox', desc: '購買並開啟驚喜盲盒，有機會獲得稀有獎勵！', usage: '/blindbox' },
      { name: '/fortune', desc: '抽取每日運勢籤，看看今天的運氣如何。', usage: '/fortune' },
      { name: '/pet', desc: '領養、餵食並與你的專屬電子寵物互動。', usage: '/pet [action]' },
      { name: '/trivia', desc: '參加隨機問答遊戲，答對可獲得獎勵。', usage: '/trivia' },
    ]
  },
  {
    category: '社群與個人',
    icon: 'users',
    items: [
      { name: '/profile', desc: '查看你的個人檔案、等級、經驗值與錢包餘額。', usage: '/profile [@user]' },
      { name: '/birthday', desc: '設定你的生日，系統會在當天給予特別驚喜。', usage: '/birthday set [MM/DD]' },
      { name: '/poll', desc: '快速建立社群投票，支援多個選項。', usage: '/poll [question] [opts...]' },
      { name: '/predict', desc: '參與社群預測活動，下注贏得獎金。', usage: '/predict' },
    ]
  },
  {
    category: '客服與工具',
    icon: 'ticket',
    items: [
      { name: '/ticket', desc: '手動開啟一個新的私密客服工單。', usage: '/ticket' },
      { name: '/voicecreator', desc: '動態語音控制（鎖定、解鎖、踢出成員）。', usage: '/voicecreator [action]' },
      { name: '/help', desc: '獲取機器人的完整說明與求助選單。', usage: '/help' },
    ]
  },
  {
    category: '安全與管理',
    icon: 'shield',
    items: [
      { name: '/warn', desc: '警告違規成員，累積達到閾值將自動禁言。', usage: '/warn [@user] [reason]' },
      { name: '/purge', desc: '大量清理頻道內的近期訊息。', usage: '/purge [amount]' },
      { name: '/lockdown', desc: '緊急鎖定或解鎖當前頻道。', usage: '/lockdown' },
      { name: '/automod', desc: '快速切換或查詢自動防護系統狀態。', usage: '/automod' },
      { name: '/logchannel', desc: '設定全域日誌的發送頻道。', usage: '/logchannel [#channel]' },
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
