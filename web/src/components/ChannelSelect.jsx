import { useState, useRef, useEffect } from 'react';
import Icon from './Icon.jsx';

/**
 * 胖達CHubbMan 專屬高質感自訂頻道選單 (Notion / Discord 風格)
 * 支援類別分組、縮排顯示，完全拋棄原生瀏覽器醜陋下拉選單。
 */
export default function ChannelSelect({ value, onChange, channels = [], placeholder = '-- 選擇頻道 --' }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // 關閉點擊外部選單
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // 取得目前選取項目的標籤名稱
  const channelList = channels || [];
  const selectedChannel = channelList.find((c) => c.id === value);
  const triggerLabel = selectedChannel ? `# ${selectedChannel.name}` : placeholder;

  // 對頻道進行排序與分類分組 (Notion & Discord 結構化)
  // 分類 (type === 4) 為父群組，其他頻道依 parentId 歸入
  const categories = channelList.filter((c) => c.type === 4);
  const uncategorized = channelList.filter((c) => c.type !== 4 && !c.parentId);

  const getChildren = (catId) => {
    return channelList.filter((c) => c.type !== 4 && c.parentId === catId);
  };

  const handleSelect = (channelId) => {
    onChange(channelId);
    setOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* 觸發按鈕 */}
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--card)',
          color: value ? 'var(--fg)' : 'var(--muted)',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          padding: '10px 14px',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: '500',
          userSelect: 'none',
          transition: 'all 0.15s ease',
          boxShadow: 'var(--shadow)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
        onMouseLeave={(e) => {
          if (!open) e.currentTarget.style.borderColor = 'var(--border)';
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icon name="webhook" size={14} style={{ opacity: 0.6 }} />
          {triggerLabel}
        </span>
        <Icon
          name="arrowDown"
          size={12}
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            opacity: 0.6,
          }}
        />
      </div>

      {/* 下拉浮動面板 */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            boxShadow: 'var(--shadow)',
            zIndex: 999,
            maxHeight: '300px',
            overflowY: 'auto',
            padding: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          {/* 未分類的根頻道 */}
          {uncategorized.map((c) => (
            <div
              key={c.id}
              onClick={() => handleSelect(c.id)}
              style={{
                padding: '8px 12px',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: value === c.id ? 'var(--accent-fg)' : 'var(--fg)',
                background: value === c.id ? 'var(--accent)' : 'transparent',
                transition: 'background 0.1s ease',
              }}
              onMouseEnter={(e) => {
                if (value !== c.id) e.currentTarget.style.background = 'var(--hover)';
              }}
              onMouseLeave={(e) => {
                if (value !== c.id) e.currentTarget.style.background = 'transparent';
              }}
            >
              <span>{c.type === 2 ? '🔊' : '#'}</span>
              <strong>{c.name}</strong>
            </div>
          ))}

          {/* 分類群組頻道 */}
          {categories.map((cat) => {
            const children = getChildren(cat.id);
            if (children.length === 0) return null;

            return (
              <div key={cat.id} style={{ display: 'flex', flexDirection: 'column', marginTop: '6px' }}>
                {/* 類別標頭（不可點選） */}
                <div
                  style={{
                    padding: '6px 12px',
                    fontSize: '11px',
                    fontWeight: '700',
                    color: 'var(--muted)',
                    letterSpacing: '0.04em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    userSelect: 'none',
                  }}
                >
                  📁 {cat.name}
                </div>
                {/* 類別子頻道 */}
                {children.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleSelect(c.id)}
                    style={{
                      padding: '8px 12px 8px 24px',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: value === c.id ? 'var(--accent-fg)' : 'var(--fg)',
                      background: value === c.id ? 'var(--accent)' : 'transparent',
                      transition: 'background 0.1s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (value !== c.id) e.currentTarget.style.background = 'var(--hover)';
                    }}
                    onMouseLeave={(e) => {
                      if (value !== c.id) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <span>{c.type === 2 ? '🔊' : '#'}</span>
                    <strong>{c.name}</strong>
                  </div>
                ))}
              </div>
            );
          })}

          {channelList.length === 0 && (
            <div style={{ padding: '16px', color: 'var(--muted)', fontSize: '13px', textAlign: 'center' }}>
              尚無可用頻道
            </div>
          )}
        </div>
      )}
    </div>
  );
}
