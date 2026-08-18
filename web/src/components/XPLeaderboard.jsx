import { useState, useEffect } from 'react';
import { api } from '../api.js';
import Icon from './Icon.jsx';

export default function XPLeaderboard({ guildId }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await api.fetchLeaderboard(guildId);
      setList(res.leaderboard || []);
    } catch (e) {
      console.error('[leaderboard] failed to load rankings', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, [guildId]);

  return (
    <div style={{ textAlign: 'left' }}>
      <div className="table-toolbar">
        <div>
          <h3>活躍等級與積分排行榜</h3>
          <p className="muted">展示此伺服器最活躍的成員，依據文字聊天訊息與語音發言累計的經驗值排行。</p>
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        {loading ? (
          <div className="loading">排行載入中...</div>
        ) : list.length === 0 ? (
          <div className="empty">目前尚無活躍成員排行記錄</div>
        ) : (
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ width: '80px', textAlign: 'center' }}>名次</th>
                <th>成員 ID</th>
                <th style={{ textAlign: 'center' }}>等級</th>
                <th style={{ textAlign: 'right' }}>總經驗值 (XP)</th>
                <th style={{ textAlign: 'right' }}>發送訊息數</th>
                <th style={{ textAlign: 'right' }}>語音聊天時間</th>
              </tr>
            </thead>
            <tbody>
              {list.map((row, idx) => (
                <tr key={row._id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                    {idx === 0 ? '🏆 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : idx + 1}
                  </td>
                  <td>
                    <span className="code">{row.userId}</span>
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--accent)' }}>
                    LV {row.level ?? 1}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: '600' }}>
                    {(row.xp ?? 0).toLocaleString()} XP
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--muted)' }}>
                    {row.messageCount ?? 0} 則
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--muted)' }}>
                    {row.voiceMinutes ?? 0} 分鐘
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
