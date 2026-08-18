import React from 'react';
import Icon from './Icon.jsx';

// 模擬管理員績效數據
const modData = [
  { name: 'Admin_Allen', resolved: 145, rating: 4.8, warns: 12, bans: 3 },
  { name: 'Mod_Bella', resolved: 89, rating: 4.9, warns: 5, bans: 1 },
  { name: 'Helper_Carl', resolved: 210, rating: 4.5, warns: 45, bans: 8 },
];

export default function ModStats() {
  return (
    <div className="mod-stats-container">
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--muted)' }}>
            <th style={{ padding: '12px 8px' }}>管理員 / 巡查員</th>
            <th style={{ padding: '12px 8px' }}>結案數量</th>
            <th style={{ padding: '12px 8px' }}>滿意度評分</th>
            <th style={{ padding: '12px 8px' }}>開罰次數 (警告/封鎖)</th>
          </tr>
        </thead>
        <tbody>
          {modData.map((mod, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '12px 8px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon name="users" size={14} style={{ color: 'var(--accent)' }} />
                {mod.name}
              </td>
              <td style={{ padding: '12px 8px', color: 'var(--fg)' }}>{mod.resolved} 件</td>
              <td style={{ padding: '12px 8px', color: '#ffac33', fontWeight: '700' }}>⭐ {mod.rating.toFixed(1)}</td>
              <td style={{ padding: '12px 8px', color: 'var(--muted)' }}>
                <span style={{ color: '#ffa502' }}>{mod.warns}</span> / <span style={{ color: '#ff4757' }}>{mod.bans}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
