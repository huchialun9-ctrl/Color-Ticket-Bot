import { useEffect, useState } from 'react';
import { api } from '../api.js';
import BarChart from '../components/BarChart.jsx';
import FormBuilder from '../components/FormBuilder.jsx';
import Icon from '../components/Icon.jsx';
import ChannelSelect from '../components/ChannelSelect.jsx';
import EmbedSender from '../components/EmbedSender.jsx';
import TicketPanelDeployer from '../components/TicketPanelDeployer.jsx';
import AutoResponseBuilder from '../components/AutoResponseBuilder.jsx';
import AuditLogViewer from '../components/AuditLogViewer.jsx';
import RolePanelManager from '../components/RolePanelManager.jsx';
import SchedulerManager from '../components/SchedulerManager.jsx';
import XPLeaderboard from '../components/XPLeaderboard.jsx';
import BlacklistFederation from '../components/BlacklistFederation.jsx';
import WorkflowEngine from '../components/WorkflowEngine.jsx';
import UtilityHelpers from '../components/UtilityHelpers.jsx';
import EconomyManager from '../components/EconomyManager.jsx';
import CommandSettings from '../components/CommandSettings.jsx';
import Heatmap from '../components/Heatmap.jsx';
import ModStats from '../components/ModStats.jsx';

/**
 * 伺服器控制台：整合表單、自動回覆、身分組、預約公告、等級排行與日誌數據。
 */
export default function GuildPanel({ guildId }) {
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [error, setError] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [channels, setChannels] = useState([]);
  const [voiceCreatorId, setVoiceCreatorId] = useState('');
  const [saved, setSaved] = useState(false);

  const [serverRoles, setServerRoles] = useState([]);

  useEffect(() => {
    api.guild(guildId).then(setData).catch((e) => setError(e.message));
    api.channels(guildId).then((res) => setChannels(res.channels || [])).catch(() => {});
    api.roles(guildId).then((res) => setServerRoles(res.roles || [])).catch(() => {});
  }, [guildId]);

  useEffect(() => {
    if (data?.settings) {
      setVoiceCreatorId(data.settings.voiceCreatorChannelId || '');
    }
  }, [data]);

  if (error) return <div className="banner">載入失敗：{error}</div>;
  if (!data) return <div className="loading">載入中…</div>;

  const { guild, settings, openTickets, recentTickets, stats } = data;

  const handleSettingsUpdate = (newSettings) => {
    setData((prev) => (prev ? { ...prev, settings: newSettings } : prev));
  };

  const saveVoiceCreator = async () => {
    try {
      await api.saveSettings(guildId, { voiceCreatorChannelId: voiceCreatorId || null });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      alert(`儲存失敗：${e.message}`);
    }
  };

  const toggle = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const batch = async (action) => {
    if (selected.size === 0) return;
    try {
      await api.batchTickets(guildId, [...selected], action, 'dashboard');
      setSelected(new Set());
      const fresh = await api.guild(guildId);
      setData(fresh);
    } catch (e) {
      alert(`批次操作失敗：${e.message}`);
    }
  };

  const openList = (recentTickets || []).filter((t) => t.status === 'open');
  const warns = stats?.warns ?? {};

  const groups = [
    {
      title: '客服工單系統',
      icon: 'ticket',
      items: [
        { idx: 0, label: '1. 設計表單欄位', icon: 'puzzle' },
        { idx: 1, label: '2. 設定自動回覆', icon: 'users' },
        { idx: 2, label: '3. 發布按鈕面板', icon: 'ticket' },
        { idx: 9, label: '10. 網頁工作流', icon: 'webhook' },
      ]
    },
    {
      title: '自動化與廣播',
      icon: 'webhook',
      items: [
        { idx: 3, label: '4. 傳送公告廣播', icon: 'webhook' },
        { idx: 6, label: '7. 預約排程公告', icon: 'webhook' },
        { idx: 4, label: '5. 語音動態管理', icon: 'server' },
      ]
    },
    {
      title: '社群活躍與娛樂',
      icon: 'puzzle',
      items: [
        { idx: 5, label: '6. 自助身分組領取', icon: 'puzzle' },
        { idx: 7, label: '8. 活躍等級排行', icon: 'chart' },
        { idx: 11, label: '12. 娛樂經濟與盲盒', icon: 'chart' },
      ]
    },
    {
      title: '全域安全聯防',
      icon: 'lock',
      items: [
        { idx: 14, label: '9. 基礎指令與系統設定', icon: 'settings' },
        { idx: 8, label: '10. 聯防黑名單', icon: 'lock' },
        { idx: 10, label: '11. 社群實用工具', icon: 'puzzle' },
        { idx: 12, label: '12. 防護日誌與管理', icon: 'shield' },
      ]
    },
    {
      title: '數據分析與決策',
      icon: 'chart',
      items: [
        { idx: 13, label: '14. 數據與客服單管理', icon: 'chart' },
      ]
    }
  ];

  return (
    <div className="panel" style={{ maxWidth: '1200px' }}>
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

      {/* 雙欄版面：左側分層分類導航，右側設定主視窗 */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '32px', marginTop: '24px', alignItems: 'start' }}>
        
        {/* 左側選單 */}
        <aside style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '20px', position: 'sticky', top: '24px', textAlign: 'left' }}>
          {groups.map((group, gIdx) => (
            <div key={gIdx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', paddingLeft: '8px', marginBottom: '6px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Icon name={group.icon} size={12} />
                {group.title}
              </span>
              {group.items.map((item) => (
                <button
                  key={item.idx}
                  onClick={() => setActiveStep(item.idx)}
                  className={activeStep === item.idx ? 'primary' : 'ghost'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    fontSize: '13px',
                    fontWeight: activeStep === item.idx ? '600' : '500',
                    borderRadius: '6px',
                    width: '100%',
                    justifyContent: 'flex-start',
                    textAlign: 'left',
                    border: 'none',
                    background: activeStep === item.idx ? 'var(--accent)' : 'transparent',
                    color: activeStep === item.idx ? 'var(--accent-fg)' : 'var(--fg)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Icon name={item.icon} size={14} />
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </aside>

        {/* 右側主設定區 */}
        <div style={{ minWidth: 0 }}>
          {activeStep === 0 && (
            <section className="settings-preview">
              <FormBuilder guildId={guildId} initialForm={settings?.ticketing?.form} />
            </section>
          )}

          {activeStep === 1 && (
            <section className="settings-preview">
              <AutoResponseBuilder guildId={guildId} initialResponses={settings?.ticketing?.autoResponses || []} />
            </section>
          )}

          {activeStep === 2 && (
            <section className="settings-preview">
              <TicketPanelDeployer guildId={guildId} />
            </section>
          )}

          {activeStep === 3 && (
            <section className="settings-preview">
              <EmbedSender guildId={guildId} />
            </section>
          )}

          {activeStep === 4 && (
            <section className="settings-preview" style={{ textAlign: 'left' }}>
              <h3>語音頻道動態管理</h3>
              <p className="muted" style={{ marginBottom: '20px' }}>設定創作者頻道。當成員加入此語音頻道時，系統會自動在下方為其建立獨立子語音房，並在成員全數離開後自動刪除。</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
                <div className="field">
                  <span>動態語音建立母頻道 (Join to Create)</span>
                  <ChannelSelect
                    value={voiceCreatorId}
                    onChange={setVoiceCreatorId}
                    channels={channels.filter((c) => c.type === 2)}
                    placeholder="-- 未設定（停用功能） --"
                  />
                </div>
                <button className="primary" onClick={saveVoiceCreator} style={{ alignSelf: 'flex-start' }}>
                  <Icon name="check" size={15} /> {saved ? '設定已成功儲存！' : '儲存語音配置'}
                </button>
              </div>
            </section>
          )}

          {activeStep === 5 && (
            <section className="settings-preview">
              <RolePanelManager guildId={guildId} channels={channels.filter((c) => c.type === 0 || c.type === 4)} serverRoles={serverRoles} />
            </section>
          )}

          {activeStep === 6 && (
            <section className="settings-preview">
              <SchedulerManager guildId={guildId} channels={channels.filter((c) => c.type === 0 || c.type === 4)} />
            </section>
          )}

          {activeStep === 7 && (
            <section className="settings-preview">
              <XPLeaderboard guildId={guildId} />
            </section>
          )}

          {activeStep === 8 && (
            <section className="settings-preview">
              <BlacklistFederation guildId={guildId} />
            </section>
          )}

          {activeStep === 9 && (
            <section className="settings-preview">
              <WorkflowEngine guildId={guildId} channels={channels.filter((c) => c.type === 0 || c.type === 4)} />
            </section>
          )}

          {activeStep === 10 && (
            <section className="settings-preview">
              <UtilityHelpers guildId={guildId} channels={channels.filter((c) => c.type === 0 || c.type === 4)} settings={settings} onSettingsUpdate={handleSettingsUpdate} serverRoles={serverRoles} />
            </section>
          )}

          {activeStep === 11 && (
            <section className="settings-preview">
              <EconomyManager guildId={guildId} />
            </section>
          )}

          {activeStep === 12 && (
            <section className="settings-preview">
              <AuditLogViewer guildId={guildId} />
            </section>
          )}

          {activeStep === 14 && (
            <section className="settings-preview">
              <CommandSettings guildId={guildId} channels={channels.filter((c) => c.type === 0 || c.type === 4)} settings={settings} onSettingsUpdate={handleSettingsUpdate} />
            </section>
          )}

          {activeStep === 13 && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '20px', textAlign: 'left' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '700', color: 'var(--fg)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Icon name="shield" size={16} /> AutoMod 安全事件統計
                  </h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'center', flex: 1 }}>
                      <span className="muted" style={{ fontSize: '11px', display: 'block' }}>累積警告</span>
                      <strong style={{ fontSize: '20px', color: 'var(--fg)' }}>{stats?.warns?.warn || 0}</strong>
                    </div>
                    <div style={{ textAlign: 'center', flex: 1, borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
                      <span className="muted" style={{ fontSize: '11px', display: 'block' }}>自動禁言</span>
                      <strong style={{ fontSize: '20px', color: 'var(--accent)' }}>{stats?.warns?.timeout || 0}</strong>
                    </div>
                    <div style={{ textAlign: 'center', flex: 1 }}>
                      <span className="muted" style={{ fontSize: '11px', display: 'block' }}>封鎖攔截</span>
                      <strong style={{ fontSize: '20px', color: 'var(--danger)' }}>{stats?.warns?.ban || 0}</strong>
                    </div>
                  </div>
                </div>

                <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '20px', textAlign: 'left' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '700', color: 'var(--fg)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Icon name="check" size={16} /> 客服工單滿意度評分
                  </h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '24px', fontWeight: '800', color: '#ffac33', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        ⭐ {stats?.rating?.average || 0}
                      </span>
                      <span className="muted" style={{ fontSize: '12px', marginLeft: '6px' }}>/ 5.0 平均分</span>
                    </div>
                    <div style={{ textAlign: 'right', borderLeft: '1px solid var(--border)', paddingLeft: '16px' }}>
                      <span className="muted" style={{ fontSize: '11px', display: 'block' }}>已評價客服單</span>
                      <strong style={{ fontSize: '16px', color: 'var(--fg)' }}>{stats?.rating?.total || 0} 件</strong>
                    </div>
                  </div>
                </div>
              </div>

              <section className="grid-2col" style={{ marginTop: 0 }}>
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

          <section className="grid-2col" style={{ marginTop: '24px' }}>
            <div className="card-block">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}><Icon name="chart" size={16} /> 發言尖峰時段熱力圖</h3>
              <Heatmap data={stats?.heatmap || []} />
            </div>
            <div className="card-block">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}><Icon name="users" size={16} /> 管理員績效統計</h3>
              <ModStats data={stats?.modStats || []} />
            </div>
          </section>

          <section className="table-section" style={{ marginTop: '24px' }}>
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
        </>
      )}
        </div>
      </div>

    </div>
  );
}
