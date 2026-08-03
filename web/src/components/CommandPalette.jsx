import { useState } from 'react';

const PAGES = [
  { id: 'dashboard', label: '全域看板', path: '/dashboard', group: '首頁' },
  { id: 'guilds', label: '伺服器管理', path: '/guilds', group: '管理' },
  { id: 'plugins', label: '插件發佈中心', path: '/plugins', group: '開發' },
  { id: 'webhooks', label: 'Webhook 測試', path: '/webhooks', group: '設定' },
  { id: 'docs', label: '技術文件', path: '/docs', group: '文件' },
];

/**
 * 全域搜尋與快速導航列（Global Command Palette）。
 * 快捷鍵：Ctrl+K / Cmd+K（由 App 監聽）。
 */
export default function CommandPalette({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);

  if (!open) return null;

  const results = PAGES.filter((p) => {
    if (!query) return true;
    return `${p.label}${p.group}${p.path}`.toLowerCase().includes(query.toLowerCase());
  });

  return (
    <div className="palette-backdrop" onClick={onClose}>
      <div
        className="palette"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') setIndex((i) => Math.min(i + 1, results.length - 1));
          if (e.key === 'ArrowUp') setIndex((i) => Math.max(i - 1, 0));
          if (e.key === 'Escape') onClose();
        }}
      >
        <input
          autoFocus
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIndex(0);
          }}
          placeholder="搜尋伺服器、票務或功能…"
          className="palette-input"
        />
        <div className="palette-results">
          {results.map((r, i) => (
            <a
              key={r.id}
              href={r.path}
              className={`palette-item ${i === index ? 'active' : ''}`}
              onMouseEnter={() => setIndex(i)}
              onClick={onClose}
            >
              <span className="palette-group">{r.group}</span>
              <span>{r.label}</span>
            </a>
          ))}
          {results.length === 0 && <div className="palette-empty">沒有相符項目</div>}
        </div>
      </div>
    </div>
  );
}
