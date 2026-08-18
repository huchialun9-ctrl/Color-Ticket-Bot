import React, { useState, useEffect } from 'react';
import { api } from '../api.js';
import Icon from '../components/Icon.jsx';
import CountUp from '../components/CountUp.jsx';

export default function GlobalLeaderboard() {
  const [data, setData] = useState({ wealth: [], xp: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('wealth'); // 'wealth' | 'xp'

  useEffect(() => {
    api.fetchGlobalLeaderboard()
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(e => {
        console.error('Failed to load global leaderboard', e);
        setLoading(false);
      });
  }, []);

  const currentList = (activeTab === 'wealth' ? data?.wealth : data?.xp) || [];

  return (
    <div className="page" style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'left' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <Icon name="star" size={28} style={{ color: 'var(--accent)' }} />
        <h1 style={{ margin: 0 }}>全域社群風雲榜</h1>
      </div>
      <p className="muted" style={{ marginBottom: '24px' }}>
        跨越伺服器的界線！這裡是所有胖達用戶的最高殿堂，看看誰是全宇宙最富有或最活躍的成員。
      </p>

      {/* 玩法說明區塊 */}
      <div style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', marginBottom: '24px', fontSize: '14px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 12px 0', fontSize: '15px' }}>
          <Icon name="book" size={16} style={{ color: 'var(--accent)' }} /> 榜單規則與玩法說明
        </h3>
        <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--muted)' }}>
          <li><strong>跨服財富榜：</strong> 結算您在「所有伺服器」的錢包餘額總和。透過每天使用 <code style={{ padding: '2px 6px', background: 'var(--bg)', borderRadius: '4px' }}>/daily</code> 簽到、購買 <code style={{ padding: '2px 6px', background: 'var(--bg)', borderRadius: '4px' }}>/blindbox</code> 或參與預測，就能快速累積財富！</li>
          <li><strong>跨服活躍榜：</strong> 結算您在「所有伺服器」獲得的總經驗值 (XP)。多在群組與大家聊天互動，或是使用指令，就能穩定提升您的排名！</li>
          <li><em>註：排行榜資料為即時跨伺服器彙整，前三名將獲得專屬的榮耀邊框展示。</em></li>
        </ul>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
        <button
          className={activeTab === 'wealth' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('wealth')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}
        >
          <Icon name="puzzle" size={16} /> 跨服財富榜
        </button>
        <button
          className={activeTab === 'xp' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('xp')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}
        >
          <Icon name="pulse" size={16} /> 跨服活躍榜
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>載入資料中...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {currentList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)', background: 'var(--card)', borderRadius: '8px' }}>
              目前沒有排行資料。
            </div>
          ) : (
            currentList.map((user, idx) => (
              <div key={user.userId} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '16px 24px',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {idx < 3 && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '4px',
                    height: '100%',
                    background: idx === 0 ? '#f1c40f' : idx === 1 ? '#bdc3c7' : '#cd7f32'
                  }} />
                )}
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{ 
                    fontSize: '24px', 
                    fontWeight: '800', 
                    color: idx < 3 ? (idx === 0 ? '#f1c40f' : idx === 1 ? '#bdc3c7' : '#cd7f32') : 'var(--muted)',
                    minWidth: '40px',
                    textAlign: 'center'
                  }}>
                    #{idx + 1}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '18px', fontWeight: 'bold' }}>用戶ID: {user.userId}</span>
                  </div>
                </div>

                <div style={{ fontSize: '20px', fontWeight: '800', color: activeTab === 'wealth' ? '#f1c40f' : '#3498db' }}>
                  {activeTab === 'wealth' ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Icon name="puzzle" size={20} /> <CountUp value={user.balance} />
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Icon name="pulse" size={20} /> <CountUp value={user.xp} /> XP
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
