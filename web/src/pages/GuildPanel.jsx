import { useEffect, useState } from 'react';
import { api } from '../api.js';
import BarChart from '../components/BarChart.jsx';
import FormBuilder from '../components/FormBuilder.jsx';
import Icon from '../components/Icon.jsx';
import EmbedSender from '../components/EmbedSender.jsx';

/**
 * 單一伺服器控制台：
 * 營運狀態總覽、近期未結案票務、營運數據圖表、批次票務管理 + 動態表單預覽器。
 */
export default function GuildPanel({ guildId }) {
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [error, setError] = useState(null);

  useEffect(() => {
    api.guild(guildId).then(setData).catch((e) => setError(e.message));
  }, [guildId]);

  if (error) return <div className="banner">載入失敗：{error}</div>;
  if (!data) return <div className="loading">載入中…</div>;

  const { guild, settings, openTickets, recentTickets, stats } = data;

  const toggle = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const batch = async (action) => {
    if (selected.size === 0) return;
    await api.batchTickets(guildId, [...selected], action, 'dashboard');
    setSelected(new Set());
    const fresh = await api.guild(guildId);
    setData(fresh);
  };

  const openList = recentTickets.filter((t) => t.status === 'open');
  const warns = stats?.warns ?? {};

  return (
    <div className="panel">
      <section className="panel-head">
        <h2>
          {guild.icon ? (
            <img className="guild-icon" src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`} alt="" />
          ) : (
            <span className="guild-icon placeholder">{guild.name[0]}</span>
          )}
          {guild.name}
        </h2>
        <div className="stat-row">
          <span className="stat-item"><Icon name="users" size={15} /> 成員 {guild.memberCount?.toLocaleString()}</span>
          <span className="stat-item"><Icon name="ticket" size={15} /> 進行中票務 {openTickets}</span>
          <span className="stat-item"><Icon name="alert" size={15} /> 警告 {warns.warn ?? 0} · 禁言 {warns.timeout ?? 0} · 封禁 {warns.ban ?? 0}</span>
          <span className="status status-online"><span className="status-dot" />Bot 運行中</span>
        </div>
      </section>

      <section className="grid-2col">
        <div className="card-block">
          <h3>營運數據圖表（近 14 日）</h3>
          <BarChart data={stats?.ticketSeries} />
        </div>
        <div className="card-block">
          <h3>近期未結案票務</h3>
          {openList.length === 0 ? (
            <div className="empty">沒有待處理票務</div>
          ) : (
            <ul className="open-list">
              {openList.map((t) => (
                <li key={t.ticketId}>
                  <span className="badge badge-open">進行中</span>
                  <span>{t.subject || t.fields?.subject || t.ticketId}</span>
                  <span className="muted">{new Date(t.createdAt).toLocaleString('zh-TW')}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="table-section">
        <div className="table-toolbar">
          <h3>全部票務（批次管理）</h3>
          <div className="batch-actions">
            <button disabled={selected.size === 0} onClick={() => batch('close')}>
              批次關閉（{selected.size}）
            </button>
            <button disabled={selected.size === 0} onClick={() => batch('archive')}>
              批次歸檔（{selected.size}）
            </button>
          </div>
        </div>
        <table className="ticket-table">
          <thead>
            <tr>
              <th />
              <th>Ticket</th>
              <th>主旨</th>
              <th>狀態</th>
              <th>評分</th>
              <th>建立時間</th>
            </tr>
          </thead>
          <tbody>
            {recentTickets.map((t) => (
              <tr key={t.ticketId}>
                <td>
                  <input
                    type="checkbox"
                    checked={selected.has(t.ticketId)}
                    onChange={() => toggle(t.ticketId)}
                  />
                </td>
                <td>{t.ticketId}</td>
                <td>{t.subject || t.fields?.subject || '—'}</td>
                <td><span className={`badge badge-${t.status}`}>{t.status}</span></td>
                <td>{t.rating ? `${t.rating} / 5` : '—'}</td>
                <td>{new Date(t.createdAt).toLocaleString('zh-TW')}</td>
              </tr>
            ))}
            {recentTickets.length === 0 && (
              <tr><td colSpan={6} className="empty">尚無票務資料</td></tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="settings-preview">
        <FormBuilder guildId={guildId} initialForm={settings?.ticketing?.form} />
      </section>

      <section className="settings-preview">
        <EmbedSender guildId={guildId} />
      </section>

      <details className="raw-settings">
        <summary>AutoMod / 系統設定（JSON）</summary>
        <code>{JSON.stringify(settings ?? {}, null, 2)}</code>
      </details>
    </div>
  );
}
