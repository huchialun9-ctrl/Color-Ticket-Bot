import CountUp from './CountUp.jsx';
import Icon from './Icon.jsx';
import { useTheme } from '../theme.jsx';

const CARD_DEFS = [
  { key: 'guildCount', label: '總伺服器加入數', accent: 'var(--accent)' },
  { key: 'totalUsers', label: '總覆蓋使用者數', accent: 'var(--accent)' },
  { key: 'bannedTotal', label: '全平台封禁總人數', accent: 'var(--accent)' },
  { key: 'violationsToday', label: '今日違規攔截數', accent: 'var(--accent)' },
  { key: 'raidTriggers', label: '防爆破觸發次數', accent: 'var(--accent)' },
  { key: 'ticketsTotal', label: '歷史總處理票務單數', accent: 'var(--accent)' },
  { key: 'ticketsOpen', label: '當前進行中票務', accent: 'var(--accent)' },
];

/** 首頁全域數據即時看板卡片 + 線上狀態 */
export default function GlobalMetrics({ metrics, status }) {
  const { toggle, theme } = useTheme();

  return (
    <>
      <header className="topbar">
        <div className="brand">
          <img src="/logo.png" alt="CHubbMan" className="brand-logo sm" />
          <span>CHubbMan小幫手</span>
        </div>
        <div className="topbar-right">
          <span className={`status status-${status}`}>
            <span className="status-dot" />
            {status === 'online' ? '線上運行' : status === 'unauthorized' ? '請重新登入' : status === 'connecting' ? '連線中' : '離線'}
          </span>
          <button className="theme-toggle" onClick={toggle} aria-label="切換主題">
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={17} />
          </button>
        </div>
      </header>

      <div className="metric-grid">
        {CARD_DEFS.map((card) => (
          <div key={card.key} className="metric-card">
            <div className="metric-label">{card.label}</div>
            <div className="metric-value" style={{ color: card.accent }}>
              <CountUp value={metrics?.[card.key] ?? 0} />
            </div>
          </div>
        ))}
      </div>

      {status === 'offline' && (
        <div className="banner">無法連線至 API，全域數據無法更新。</div>
      )}
    </>
  );
}
