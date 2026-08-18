import { useState, useRef, useEffect } from 'react';
import Icon from './Icon.jsx';

/**
 * 胖達CHubbMan 專屬高質感自訂身分組選單
 * 支援 Discord 角色顏色渲染、滑順過渡，徹底取代手動輸入 Role ID 的糟糕體驗。
 */
export default function RoleSelect({ value, onChange, roles = [], placeholder = '-- 選擇身分組 --' }) {
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

  const roleList = roles || [];
  const selectedRole = roleList.find((r) => r.id === value);
  
  // 轉化角色顏色為 Hex 格式
  const getRoleColor = (colorDecimal) => {
    if (!colorDecimal) return 'var(--fg)';
    return '#' + colorDecimal.toString(16).padStart(6, '0');
  };

  const triggerLabel = selectedRole ? selectedRole.name : placeholder;
  const triggerColor = selectedRole ? getRoleColor(selectedRole.color) : 'var(--muted)';

  const handleSelect = (roleId) => {
    onChange(roleId);
    setOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* 觸發選單按鈕 */}
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--card)',
          color: triggerColor,
          border: '1px solid var(--border)',
          borderRadius: '6px',
          padding: '10px 14px',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: '600',
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
          <span style={{ 
            display: 'inline-block', 
            width: '8px', 
            height: '8px', 
            borderRadius: '50%', 
            background: selectedRole ? getRoleColor(selectedRole.color) : 'var(--muted)',
            opacity: 0.8
          }} />
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

      {/* 下拉面板 */}
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
            maxHeight: '260px',
            overflowY: 'auto',
            padding: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          {roleList.map((r) => {
            const isSelected = value === r.id;
            const roleCol = getRoleColor(r.color);
            return (
              <div
                key={r.id}
                onClick={() => handleSelect(r.id)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: isSelected ? 'var(--accent-fg)' : roleCol,
                  background: isSelected ? 'var(--accent)' : 'transparent',
                  transition: 'background 0.1s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'var(--hover)';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'transparent';
                }}
              >
                <span style={{ 
                  display: 'inline-block', 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  background: isSelected ? 'var(--accent-fg)' : roleCol, 
                  opacity: 0.8
                }} />
                <strong>{r.name}</strong>
              </div>
            );
          })}

          {roles.length === 0 && (
            <div style={{ padding: '16px', color: 'var(--muted)', fontSize: '13px', textAlign: 'center' }}>
              尚無可用身分組
            </div>
          )}
        </div>
      )}
    </div>
  );
}
