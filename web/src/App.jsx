import { useEffect, useState } from 'react';
import { Routes, Route, NavLink, Link, useParams } from 'react-router-dom';
import { api } from './api.js';
import { ThemeProvider } from './theme.jsx';
import Icon from './components/Icon.jsx';
import GlobalMetrics from './components/GlobalMetrics.jsx';
import CommandPalette from './components/CommandPalette.jsx';
import useGlobalMetrics from './hooks/useGlobalMetrics.js';
import GuildPanel from './pages/GuildPanel.jsx';
import PluginCenter from './pages/PluginCenter.jsx';
import WebhookTester from './pages/WebhookTester.jsx';
import DocsPage from './pages/DocsPage.jsx';

const NAV = [
  { to: '/dashboard', label: '全域看板', icon: 'chart' },
  { to: '/guilds', label: '伺服器管理', icon: 'server' },
  { to: '/plugins', label: '插件發佈中心', icon: 'puzzle' },
  { to: '/webhooks', label: 'Webhook 測試', icon: 'webhook' },
  { to: '/docs', label: '技術文件', icon: 'book' },
];

function Shell() {
  const [me, setMe] = useState(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { metrics, status } = useGlobalMetrics(me != null);

  useEffect(() => {
    api.me().then(setMe).catch(() => setMe(null));
  }, []);

  const handleInvite = async () => {
    try {
      const { url } = await api.invite();
      window.open(url, '_blank', 'noopener');
    } catch {
      window.open('/api/oauth/invite', '_blank', 'noopener');
    }
  };

  // Ctrl+K / Cmd+K 全域搜尋
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!me) return <Login />;

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <img src="/logo.png" alt="CHubbMan" className="brand-logo" />
          <span>CHubbMan小幫手</span>
        </div>
        <nav>
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} className="nav-link">
              <Icon name={n.icon} size={16} />
              <span>{n.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="palette-trigger" onClick={() => setPaletteOpen(true)}>
            <span className="palette-label">
              <Icon name="search" size={15} />
              搜尋
            </span>
            <kbd>Ctrl K</kbd>
          </button>
          <button className="invite-btn" onClick={handleInvite}>
            <Icon name="link" size={15} />
            邀請機器人
          </button>
          <div className="user-chip">
            <span>{me.username}</span>
            <button className="ghost" onClick={api.logout}>登出</button>
          </div>
        </div>
      </aside>

      <main className="content">
        <Routes>
          <Route path="/" element={<GlobalMetrics metrics={metrics} status={status} />} />
          <Route path="/dashboard" element={<GlobalMetrics metrics={metrics} status={status} />} />
          <Route path="/guilds" element={<GuildList />} />
          <Route path="/guilds/:guildId" element={<GuildPanelRoute />} />
          <Route path="/plugins" element={<PluginCenter />} />
          <Route path="/webhooks" element={<WebhookTester />} />
          <Route path="/docs" element={<DocsPage />} />
        </Routes>
      </main>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}

function GuildList() {
  const [guilds, setGuilds] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.guilds().then((d) => setGuilds(d.guilds)).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="banner">{error}</div>;
  if (!guilds) return <div className="loading">載入中…</div>;

  return (
    <div className="page">
      <h1>伺服器管理</h1>
      <p className="muted">僅顯示你具備管理員權限的伺服器。</p>
      <div className="guild-grid">
        {guilds.map((g) => (
          <Link key={g.id} to={`/guilds/${g.id}`} className="guild-card">
            {g.icon ? (
              <img src={`https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png`} alt="" />
            ) : (
              <span className="guild-avatar">{g.name[0]}</span>
            )}
            <div>
              <strong>{g.name}</strong>
              <span className="muted">成員約 {g.approximate_member_count?.toLocaleString()}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function GuildPanelRoute() {
  const { guildId } = useParams();
  return <GuildPanel guildId={guildId} />;
}

function Login() {
  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <img src="/logo.png" alt="CHubbMan" className="brand-logo lg" />
          <h1 className="login-title">CHubbMan小幫手</h1>
          <p className="login-sub">社群營運 · 極簡管理 · 活力無限</p>
        </div>

        <div className="login-divider" />

        <button className="discord-btn" onClick={api.login}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M20.32 4.37a19.8 19.8 0 0 0-4.93-1.51.07.07 0 0 0-.08.04c-.21.38-.45.87-.61 1.25a18.3 18.3 0 0 0-5.49 0c-.17-.38-.4-.87-.62-1.25a.08.08 0 0 0-.08-.04A19.75 19.75 0 0 0 3.68 4.4a.07.07 0 0 0-.03.03C.53 9.05-.32 13.58.1 18.06a.08.08 0 0 0 .03.05 19.9 19.9 0 0 0 6 3.03.08.08 0 0 0 .08-.03c.46-.63.87-1.3 1.22-2a.08.08 0 0 0-.04-.1 13.1 13.1 0 0 1-1.87-.9.08.08 0 0 1-.01-.12c.13-.09.25-.19.37-.29a.07.07 0 0 1 .08-.01 14.2 14.2 0 0 0 12.08 0 .07.07 0 0 1 .08.01c.12.1.24.2.37.3a.08.08 0 0 1-.01.12c-.6.35-1.22.65-1.87.89a.08.08 0 0 0-.04.1c.36.7.77 1.37 1.22 2a.08.08 0 0 0 .09.03 19.85 19.85 0 0 0 6-3.03.08.08 0 0 0 .03-.05c.5-5.18-.84-9.68-3.55-13.62a.07.07 0 0 0-.03-.03ZM8.02 15.33c-1.18 0-2.16-1.08-2.16-2.42s.95-2.42 2.16-2.42 2.18 1.09 2.16 2.42c0 1.34-.96 2.42-2.16 2.42Zm7.97 0c-1.18 0-2.15-1.08-2.15-2.42s.95-2.42 2.15-2.42 2.18 1.09 2.16 2.42c0 1.34-.96 2.42-2.16 2.42Z" />
          </svg>
          使用 Discord 登入
        </button>

        <p className="login-hint">登入即同意以 Discord 身份驗證並授權本服務管理你的伺服器。</p>
      </div>

      <footer className="login-footer">CHubbMan小幫手 © 2026</footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <Shell />
    </ThemeProvider>
  );
}
