import React from 'react';

export default function Heatmap({ data = [] }) {
  const days = ['日', '一', '二', '三', '四', '五', '六'];

  const getColor = (count) => {
    if (count > 80) return '#ff4757';
    if (count > 50) return '#ffa502';
    if (count > 20) return '#2ed573';
    return 'var(--code-bg)';
  };

  return (
    <div className="heatmap-container" style={{ overflowX: 'auto' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
        <div style={{ width: '30px' }}></div>
        {Array.from({ length: 24 }).map((_, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: '10px', color: 'var(--muted)' }}>
            {i}
          </div>
        ))}
      </div>
      {days.map((day, dIdx) => (
        <div key={day} style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
          <div style={{ width: '30px', fontSize: '12px', color: 'var(--muted)', display: 'flex', alignItems: 'center' }}>
            {day}
          </div>
          {Array.from({ length: 24 }).map((_, hIdx) => {
            const cell = data.find(item => item.day === day && item.hour === hIdx) || { count: 0 };
            return (
              <div 
                key={`${day}-${hIdx}`} 
                style={{ 
                  flex: 1, 
                  height: '24px', 
                  backgroundColor: getColor(cell.count),
                  borderRadius: '3px',
                  opacity: 0.8
                }} 
                title={`${day} ${hIdx}:00 - 訊息數: ${cell.count}`}
              />
            );
          })}
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px', fontSize: '11px', color: 'var(--muted)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '12px', height: '12px', background: 'var(--code-bg)', borderRadius: '2px' }}></span> 冷清
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '12px', height: '12px', background: '#2ed573', borderRadius: '2px' }}></span> 活躍
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '12px', height: '12px', background: '#ffa502', borderRadius: '2px' }}></span> 尖峰
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '12px', height: '12px', background: '#ff4757', borderRadius: '2px' }}></span> 爆破
        </span>
      </div>
    </div>
  );
}
