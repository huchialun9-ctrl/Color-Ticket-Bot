import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';

const PAGES = [
  { id: 'dashboard', label: '全域看板 📊', path: '/dashboard', group: '首頁' },
  { id: 'guilds', label: '伺服器管理 🤖', path: '/guilds', group: '管理' },
  { id: 'plugins', label: '插件發佈中心 🧩', path: '/plugins', group: '開發' },
  { id: 'webhooks', label: 'Webhook 測試 🔗', path: '/webhooks', group: '設定' },
  { id: 'docs', label: '技術文件 📖', path: '/docs', group: '文件' },
  { id: 'privacy', label: '隱私與 Cookies 政策 🔒', path: '/privacy', group: '政策' },
];

export default function CommandPalette({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const [guilds, setGuilds] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      api.guilds()
        .then((d) => setGuilds(d.guilds || []))
        .catch(() => {});
      setQuery('');
      setIndex(0);
    }
  }, [open]);

  if (!open) return null;

  const serverItems = guilds.map((g) => ({
    id: `guild-${g.id}`,
    label: `管理：${g.name}`,
    path: `/guilds/${g.id}`,
    group: '伺服器',
  }));

  const allItems = [...PAGES, ...serverItems];

  const results = allItems.filter((item) => {
    if (!query) return true;
    return `${item.label}${item.group}${item.path}`.toLowerCase().includes(query.toLowerCase());
  });

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter') {
      if (results[index]) {
        navigate(results[index].path);
        onClose();
      }
    }
  };

  return (
    <div className="palette-backdrop" onClick={onClose}>
      <div
        className="palette"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <input
          autoFocus
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIndex(0);
          }}
          placeholder="搜尋伺服器、說明文件或系統功能…"
          className="palette-input"
        />
        <div className="palette-results">
          {results.map((r, i) => (
            <Link
              key={r.id}
              to={r.path}
              className={`palette-item ${i === index ? 'active' : ''}`}
              onMouseEnter={() => setIndex(i)}
              onClick={onClose}
            >
              <span className="palette-group">{r.group}</span>
              <span>{r.label}</span>
            </Link>
          ))}
          {results.length === 0 && <div className="palette-empty">沒有相符項目</div>}
        </div>
      </div>
    </div>
  );
}
