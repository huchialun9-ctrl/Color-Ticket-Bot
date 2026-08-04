import { useState, useEffect } from 'react';
import { api } from '../api.js';
import Icon from './Icon.jsx';

export default function AuditLogViewer({ guildId }) {
  const [logs, setLogs] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.request = (path) => fetch(`/api${path}`, { credentials: 'include' }).then((r) => r.json()); // Backup direct request helper
    
    // Fetch logs
    fetch(`/api/guilds/${guildId}/audit-logs`, { credentials: 'include' })
      .then((r) => r.json())
      .then((res) => {
        setLogs(res.logs || []);
      })
      .catch((e) => console.error('[AuditLogViewer] failed to load logs', e))
      .finally(() => setLoading(false));
  }, [guildId]);

  const filteredLogs = logs.filter((log) => {
    if (filterType === 'all') return true;
    if (filterType === 'security') return ['security_alert', 'mod_action', 'lockdown', 'warn'].includes(log.type);
    if (filterType === 'tickets') return ['ticket_created', 'ticket_closed', 'ticket_rating'].includes(log.type);
    return log.type === filterType;
  });

  const getLogStyle = (type) => {
    if (type.includes('alert') || type === 'ban') return { borderLeft: '4px solid var(--danger)', bg: 'rgba(255, 71, 87, 0.04)' };
    if (type.includes('ticket')) return { borderLeft: '4px solid #2ed573', bg: 'rgba(46, 213, 115, 0.04)' };
    return { borderLeft: '4px solid var(--accent)', bg: 'transparent' };
  };

  return (
    <div style={{ textAlign: 'left' }}>
      <div className="table-toolbar" style={{ marginBottom: '20px' }}>
        <div>
          <h3>🛡️ 安全事件與稽核日誌</h3>
          <p className="muted">即時監控伺服器管理、AutoMod 警告禁言與防爆破警報紀錄。</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--fg)' }}>
            <option value="all">所有事件</option>
            <option value="security">僅安全與 AutoMod 警告</option>
            <option value="tickets">僅工單事件</option>
            <option value="ticket_rating">僅工單滿意度評分</option>
          </select>
        </div>
      </div>

      {loading && <div className="loading">加載安全日誌中…</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredLogs.map((log) => {
          const style = getLogStyle(log.type);
          return (
            <div
              key={log._id}
              style={{
                background: style.bg || 'var(--card)',
                border: '1px solid var(--border)',
                borderLeft: style.borderLeft,
                borderRadius: '8px',
                padding: '16px',
                boxShadow: 'var(--shadow)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '16px'
              }}
            >
              <div>
                <strong style={{ textTransform: 'uppercase', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--fg)' }}>
                  <Icon name={log.type.includes('ticket') ? 'ticket' : 'shield'} size={14} />
                  {log.type}
                </strong>
                <div style={{ marginTop: '8px', fontSize: '14px', lineHeight: '1.5' }}>
                  {Object.entries(log.details || {}).map(([k, v]) => (
                    <span key={k} style={{ marginRight: '16px', display: 'inline-block' }}>
                      <strong className="muted">{k}:</strong> <code style={{ background: 'var(--code-bg)', padding: '2px 6px', borderRadius: '4px', fontSize: '13px' }}>{JSON.stringify(v)}</code>
                    </span>
                  ))}
                </div>
              </div>
              <span className="muted" style={{ fontSize: '12px', flexShrink: 0 }}>
                {new Date(log.loggedAt).toLocaleString('zh-TW')}
              </span>
            </div>
          );
        })}

        {!loading && filteredLogs.length === 0 && (
          <div className="empty" style={{ background: 'var(--code-bg)', borderRadius: '8px' }}>
            目前無符合條件的安全稽核日誌
          </div>
        )}
      </div>
    </div>
  );
}
