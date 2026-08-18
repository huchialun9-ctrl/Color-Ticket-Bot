import { useState, useRef } from 'react';
import Icon from './Icon.jsx';

export default function InfoBadge({ text, size = 14 }) {
  const [show, setShow] = useState(false);
  const triggerRef = useRef(null);

  // 當文字含有 \n 時，切換成多行
  const lines = typeof text === 'string' ? text.split('\n') : [text];

  return (
    <div 
      className="info-badge-container" 
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', marginLeft: '6px' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onClick={(e) => {
        // 在行動裝置上，點擊也可以觸發
        e.preventDefault();
        setShow(!show);
      }}
    >
      <span 
        ref={triggerRef}
        style={{ 
          cursor: 'help', 
          color: 'var(--muted)', 
          display: 'inline-flex', 
          alignItems: 'center',
          transition: 'color 0.2s ease'
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent)'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}
      >
        <Icon name="help" size={size} />
      </span>

      {show && (
        <div 
          className="info-tooltip"
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'max-content',
            maxWidth: '280px',
            background: 'var(--card)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow)',
            padding: '10px 14px',
            borderRadius: '8px',
            zIndex: 1000,
            fontSize: '12px',
            lineHeight: '1.5',
            color: 'var(--fg)',
            fontWeight: '400',
            textAlign: 'left',
            animation: 'fadeInUp 0.15s ease-out forwards',
            pointerEvents: 'none'
          }}
        >
          {lines.map((line, idx) => (
            <span key={idx} style={{ display: 'block', marginBottom: idx !== lines.length - 1 ? '4px' : 0 }}>
              {line}
            </span>
          ))}
          {/* 小三角形箭頭 */}
          <div 
            style={{
              position: 'absolute',
              bottom: '-5px',
              left: '50%',
              transform: 'translateX(-50%) rotate(45deg)',
              width: '10px',
              height: '10px',
              background: 'var(--card)',
              borderBottom: '1px solid var(--border)',
              borderRight: '1px solid var(--border)',
            }}
          />
        </div>
      )}
    </div>
  );
}
