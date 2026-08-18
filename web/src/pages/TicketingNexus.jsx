import { useState, useEffect } from 'react';
import { api } from '../api.js';
import Icon from '../components/Icon.jsx';

export default function TicketingNexus() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterGuild, setFilterGuild] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const loadNexusTickets = async () => {
    setLoading(true);
    try {
      const res = await api.fetchNexusTickets();
      setTickets(res.tickets || []);
    } catch (e) {
      console.error('[nexus] failed to load tickets', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNexusTickets();
  }, []);

  // 取得不重複的 Guild 列表以供過濾
  const uniqueGuilds = Array.from(new Set(tickets.filter((t) => t && t.guildId).map((t) => t.guildId)));

  const filteredTickets = tickets.filter((t) => {
    if (!t) return false;
    const matchesGuild = !filterGuild || t.guildId === filterGuild;
    const matchesStatus = !filterStatus || t.status === filterStatus;
    return matchesGuild && matchesStatus;
  });

  return (
    <div className="panel" style={{ textAlign: 'left' }}>
      <section className="panel-head" style={{ display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '20px' }}>
        <img src="/emoji3.png" style={{ height: '64px', width: '64px', objectFit: 'contain' }} alt="" />
        <div>
          <h2 style={{ margin: 0 }}>跨伺服器統一客服中心 (Cross-Guild Ticketing Nexus)</h2>
          <p className="muted" style={{ margin: '4px 0 0 0' }}>此處為中央化客服調度中心，您可以在此統一管理與審查來自不同 Discord 伺服器的所有客訴與工單進度。</p>
        </div>
      </section>

      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', marginBottom: '20px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: 'var(--muted)' }}>過濾伺服器:</span>
          <select value={filterGuild} onChange={(e) => setFilterGuild(e.target.value)}>
            <option value="">-- 全部伺服器 --</option>
            {uniqueGuilds.map((gid) => (
              <option key={gid} value={gid}>
                ID: {gid}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: 'var(--muted)' }}>過濾狀態:</span>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">-- 全部狀態 --</option>
            <option value="open">進行中 (Open)</option>
            <option value="closed">已關閉 (Closed)</option>
            <option value="archived">已歸檔 (Archived)</option>
          </select>
        </div>

        <button className="ghost" onClick={loadNexusTickets} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Icon name="webhook" size={14} /> 重新整理
        </button>
      </div>

      {loading ? (
        <div className="loading">加載跨伺服器工單中...</div>
      ) : filteredTickets.length === 0 ? (
        <div className="empty" style={{ padding: '40px' }}>目前沒有符合過濾條件的工單</div>
      ) : (
        <table className="ticket-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>工單 ID</th>
              <th>所屬伺服器</th>
              <th>申請人</th>
              <th>工單主旨</th>
              <th>當前狀態</th>
              <th>建立日期</th>
            </tr>
          </thead>
          <tbody>
            {filteredTickets.map((t) => (
              <tr key={t.ticketId}>
                <td className="code" style={{ fontWeight: '600' }}>#{t.ticketId}</td>
                <td>
                  <span className="code" style={{ fontSize: '12px' }}>{t.guildId}</span>
                </td>
                <td>
                  <span className="code">{t.creatorId}</span>
                </td>
                <td>{t.subject || t.fields?.subject || '—'}</td>
                <td>
                  <span className={`badge badge-${t.status}`}>
                    {t.status === 'open' ? '進行中' : t.status === 'closed' ? '已關閉' : '已歸檔'}
                  </span>
                </td>
                <td className="muted">{new Date(t.createdAt).toLocaleString('zh-TW')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
