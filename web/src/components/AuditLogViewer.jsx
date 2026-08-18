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

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return alert('沒有可導出的日誌！');
    
    const headers = ['時間', '事件類型', '主體/成員', '行為', '詳細說明'];
    const rows = filteredLogs.map((log) => [
      new Date(log.createdAt).toLocaleString('zh-TW'),
      log.type,
      log.member || log.guildId || '',
      log.action || '',
      log.detail || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `panda-audit-logs-${guildId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLogs = logs.filter((log) => {
    if (!log) return false;
    const type = log.type || '';
    if (filterType === 'all') return true;
    if (filterType === 'security') return ['security_alert', 'mod_action', 'lockdown', 'warn'].includes(type);
    if (filterType === 'tickets') return ['ticket_created', 'ticket_closed', 'ticket_rating'].includes(type);
    return type === filterType;
  });

  const getLogStyle = (type = '') => {
    const t = String(type || '');
    if (t.includes('alert') || t === 'ban') return { borderLeft: '4px solid var(--danger)', bg: 'rgba(255, 71, 87, 0.04)' };
    if (t.includes('ticket')) return { borderLeft: '4px solid #2ed573', bg: 'rgba(46, 213, 115, 0.04)' };
    return { borderLeft: '4px solid var(--accent)', bg: 'transparent' };
  };

  return (
    <div style={{ textAlign: 'left' }}>
      <div className="table-toolbar" style={{ marginBottom: '20px' }}>
        <div>
          <h3>🛡️ 安全事件與稽核日誌</h3>
          <p className="muted">即時監控伺服器管理、AutoMod 警告禁言與防爆破警報紀錄。</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--fg)', fontSize: '13px' }}>
            <option value="all">所有事件</option>
            <option value="security">僅安全與 AutoMod 警告</option>
            <option value="tickets">僅工單事件</option>
            <option value="ticket_rating">僅工單滿意度評分</option>
          </select>
          <button className="ghost" onClick={handleExportCSV} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '13px', background: 'var(--code-bg)', border: '1px solid var(--border)' }}>
            <Icon name="link" size={14} style={{ transform: 'rotate(180deg)' }} /> 匯出 CSV 報表
          </button>
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
                  <Icon name={(log.type || '').includes('ticket') ? 'ticket' : 'shield'} size={14} />
                  {log.type || 'UNKNOWN'}
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
                {new Date(log.loggedAt || log.createdAt || Date.now()).toLocaleString('zh-TW')}
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
