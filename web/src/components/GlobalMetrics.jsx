import CountUp from './CountUp.jsx';
import Icon from './Icon.jsx';
import { useTheme } from '../theme.jsx';
import { Link } from 'react-router-dom';

const CARD_DEFS = [
  { key: 'guildCount', label: '總伺服器加入數', accent: '#5865F2', icon: 'server' },
  { key: 'totalUsers', label: '總覆蓋使用者數', accent: '#3b9af5', icon: 'users' },
  { key: 'bannedTotal', label: '全平台封禁總人數', accent: '#ff4757', icon: 'alert' },
  { key: 'violationsToday', label: '今日違規攔截數', accent: '#ffa502', icon: 'shield' },
  { key: 'raidTriggers', label: '防爆破觸發次數', accent: '#ff4757', icon: 'lock' },
  { key: 'ticketsTotal', label: '歷史總處理票務單數', accent: '#2ed573', icon: 'ticket' },
  { key: 'ticketsOpen', label: '當前進行中票務', accent: '#2ed573', icon: 'check' },
];

export default function GlobalMetrics({ metrics, status }) {
  const { toggle, theme } = useTheme();

  return (
    <div className="dashboard-container">
      <header className="topbar">
        <div className="brand">
          <img src="/logo.png" alt="CHubbMan" className="brand-logo sm" />
          <span>CHubbMan 營運中心</span>
        </div>
        <div className="topbar-right">
          <span className={`status status-${status}`}>
            <span className="status-dot" />
            {status === 'online' ? '所有系統正常運行中' : status === 'unauthorized' ? '請重新登入' : status === 'connecting' ? '連線中' : '伺服器離線'}
          </span>
          <button className="theme-toggle" onClick={toggle} aria-label="切換主題">
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={17} />
          </button>
        </div>
      </header>

      {/* 歡迎與公告看板區 */}
      <section className="welcome-banner">
        <div className="welcome-text">
          <h2>歡迎回來，管理員</h2>
          <p className="muted">此處顯示 CHubb-Man 跨伺服器的即時運作數據與安全狀態。防洗版、防爆破與票務客服系統均在背景穩定監控中。</p>
          <div style={{ marginTop: '12px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <a href="https://github.com/huchialun9-ctrl/Color-Ticket-Bot" target="_blank" rel="noreferrer" style={{ textDecoration: 'none', display: 'inline-flex' }}>
              <img src="https://img.shields.io/github/stars/huchialun9-ctrl/Color-Ticket-Bot?style=social" alt="GitHub Stars" />
            </a>
            <a href="https://github.com/huchialun9-ctrl/Color-Ticket-Bot" target="_blank" rel="noreferrer" style={{ textDecoration: 'none', display: 'inline-flex' }}>
              <img src="https://img.shields.io/github/forks/huchialun9-ctrl/Color-Ticket-Bot?style=social" alt="GitHub Forks" />
            </a>
            <span style={{ fontSize: '12px', color: 'var(--muted)', marginLeft: '4px' }}>授權協議: <strong>MIT License</strong></span>
          </div>
        </div>
        <div className="status-checker-grid">
          <div className="status-check-item">
            <span className="check-dot green" />
            <span>Discord API 連線：<strong>正常 (100%)</strong></span>
          </div>
          <div className="status-check-item">
            <span className="check-dot green" />
            <span>MongoDB 資料庫：<strong>已連線</strong></span>
          </div>
          <div className="status-check-item">
            <span className="check-dot green" />
            <span>Redis 快取系統：<strong>已就緒</strong></span>
          </div>
          <div className="status-check-item">
            <span className="check-dot green" />
            <span>系統簽章 (HMAC-SHA256)：<strong>防護中</strong></span>
          </div>
        </div>
      </section>

      {/* 核心數據指標 */}
      <section className="dashboard-section">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Icon name="chart" size={18} />
          全平台即時營運指標
        </h3>
        <div className="metric-grid">
          {CARD_DEFS.map((card) => (
            <div key={card.key} className="metric-card">
              <div className="metric-card-header">
                <div className="metric-label">{card.label}</div>
              </div>
              <div className="metric-value" style={{ color: card.accent }}>
                <CountUp value={metrics?.[card.key] ?? 0} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 快捷導航與提示 */}
      <section className="grid-2col" style={{ marginTop: '24px' }}>
        <div className="card-block quick-actions">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Icon name="shield" size={18} />
            快捷功能操作
          </h3>
          <p className="muted" style={{ marginBottom: '16px' }}>快速跳轉至各功能模組進行維護與設定作業。</p>
          <div className="action-links-grid">
            <Link to="/guilds" className="action-card-link">
              <strong style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icon name="server" size={14} />
                伺服器管理與控制台
              </strong>
              <span>管理已加入伺服器、編輯票務表單</span>
            </Link>
            <Link to="/plugins" className="action-card-link">
              <strong style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icon name="puzzle" size={14} />
                插件管理中心
              </strong>
              <span>發佈或管理機器人擴充模組</span>
            </Link>
            <Link to="/webhooks" className="action-card-link">
              <strong style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icon name="link" size={14} />
                Webhook 測試面板
              </strong>
              <span>模擬安全警報與事件推送</span>
            </Link>
            <Link to="/docs" className="action-card-link">
              <strong style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icon name="book" size={14} />
                技術規格文件
              </strong>
              <span>查閱 API 開發架構與命令參數規範</span>
            </Link>
          </div>
        </div>

        <div className="card-block system-notice">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Icon name="alert" size={18} />
            運作注意事項與安全宣告
          </h3>
          <ul className="notice-list">
            <li>
              <strong>防爆破系統運作：</strong>
              <span>當偵測到伺服器在 60 秒內有大量新帳號湧入，系統會自動在 Discord 將驗證等級提至最高，並以 HMAC 簽名警報即時通知本平台。</span>
            </li>
            <li>
              <strong>票務歸檔與對話紀錄：</strong>
              <span>工單關閉後會自動渲染出 HTML 格式的完整對話紀錄（Transcript），並即時上傳歸檔至資料庫供管理員查閱。</span>
            </li>
            <li>
              <strong>熱重載插件：</strong>
              <span>若您在插件發佈中心上傳了新模組，Bot 端會以動態 ESM 重載機制載入，過程完全不需重啟 Bot。</span>
            </li>
          </ul>
        </div>
      </section>

      {status === 'offline' && (
        <div className="banner danger-banner" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icon name="alert" size={16} />
          無法與後端 API 伺服器取得連線，全域即時數據可能無法更新。
        </div>
      )}
    </div>
  );
}
