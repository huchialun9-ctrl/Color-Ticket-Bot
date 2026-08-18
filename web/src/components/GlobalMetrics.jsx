import { useState, useEffect } from 'react';
import CountUp from './CountUp.jsx';
import InfoBadge from './InfoBadge.jsx';
import Icon from './Icon.jsx';
import { useTheme } from '../theme.jsx';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import Heatmap from './Heatmap.jsx';
import ModStats from './ModStats.jsx';

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
  
  const [nexusTickets, setNexusTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  
  const [feedbackType, setFeedbackType] = useState('feedback');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => {
    api.fetchNexusTickets()
      .then(data => setNexusTickets((data?.tickets || []).slice(0, 5)))
      .catch(err => console.error('Failed to fetch nexus tickets:', err))
      .finally(() => setLoadingTickets(false));
  }, []);

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackMessage.trim()) return;
    setSubmittingFeedback(true);
    try {
      await api.submitFeedback({ type: feedbackType, message: feedbackMessage });
      alert('感謝您的回饋！我們已經收到您的訊息。');
      setFeedbackMessage('');
    } catch (err) {
      alert('發送失敗，請稍後再試。');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  return (
    <div className="dashboard-container">
      <header className="topbar">
        <div className="brand">
          <img src="/logo.png" alt="CHubbMan" className="brand-logo sm" />
          <span>胖達CHubbMan 運營中心</span>
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

      {/* 開服宣傳廣播 Banner */}
      <section className="welcome-banner" style={{ background: 'linear-gradient(135deg, rgba(88, 101, 242, 0.12), rgba(162, 89, 255, 0.12))', border: '1px solid rgba(88, 101, 242, 0.25)', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', textAlign: 'left' }}>
          <img src="/emoji1.png" style={{ height: '64px', width: '64px', objectFit: 'contain' }} alt="" />
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: 'var(--fg)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              胖達CHubbMan 伺服器管理系統已啟動
            </h3>
            <p className="muted" style={{ margin: '4px 0 0 0', fontSize: '13px' }}>
              模組化 Discord 管理系統，程式碼完全開源。支援工單客服與防護爆破功能，點選右方按鈕即可邀請機器人加入。
            </p>
          </div>
        </div>
        <a 
          className="button primary" 
          href="https://discord.com/oauth2/authorize?client_id=1533040341014417491&permissions=8&scope=bot%20applications.commands"
          target="_blank" 
          rel="noopener noreferrer" 
          style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '8px 16px', whiteSpace: 'nowrap' }}
        >
          <Icon name="link" size={14} /> 立即邀請進駐
        </a>
      </section>

      {/* 歡迎與公告看板區 */}
      <section className="welcome-banner">
        <div className="welcome-text">
          <h2>歡迎回來，管理員</h2>
          <p className="muted">此處顯示 胖達CHubbMan 伺服器的運作數據與安全狀態。防防護爆破與客服工單系統均在背景監控中。</p>
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
        <div className="status-checker-grid" style={{ minWidth: '280px' }}>
          <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', borderBottom: '1px solid var(--border)', paddingBottom: '6px', marginBottom: '4px', textAlign: 'left', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Icon name="webhook" size={12} />
            運行公告與系統動態
          </span>
          <div className="status-check-item" style={{ alignItems: 'flex-start' }}>
            <Icon name="git" size={14} style={{ color: 'var(--accent)', marginTop: '2px' }} />
            <span style={{ fontSize: '12px', lineHeight: '1.4' }}>
              <strong>24/7 常駐守護已啟動</strong>
              <div className="muted" style={{ fontSize: '11px', marginTop: '2px' }}>結合心跳偵測，Bot 全天候守護已託管的 Discord 伺服器。</div>
            </span>
          </div>
          <div className="status-check-item" style={{ alignItems: 'flex-start' }}>
            <Icon name="shield" size={14} style={{ color: '#0c8a6e', marginTop: '2px' }} />
            <span style={{ fontSize: '12px', lineHeight: '1.4' }}>
              <strong>全域黑名單聯防同步</strong>
              <div className="muted" style={{ fontSize: '11px', marginTop: '2px' }}>當前已連結至中央資料庫，實時阻截惡意爆破與詐騙帳號。</div>
            </span>
          </div>
          <div className="status-check-item" style={{ alignItems: 'flex-start' }}>
            <Icon name="puzzle" size={14} style={{ color: '#ffa502', marginTop: '2px' }} />
            <span style={{ fontSize: '12px', lineHeight: '1.4' }}>
              <strong>娛樂與經濟模組已就緒</strong>
              <div className="muted" style={{ fontSize: '11px', marginTop: '2px' }}>盲盒身份組分派、預測押注結算已就緒，成員可在頻道內輸入指令參與。</div>
            </span>
          </div>
        </div>
      </section>

      {/* 核心數據指標：改用非對稱分欄 (Split Dashboard Panel) 以取代枯燥的網格 */}
      <section className="dashboard-section">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
          <Icon name="chart" size={18} />
          全台伺服器累計數據
        </h3>
        
        <div className="grid-2col" style={{ gap: '20px' }}>
          {/* 左側：平台總體規模特大卡片 */}
          <div className="metric-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '32px', textAlign: 'left', background: 'linear-gradient(135deg, var(--card), var(--code-bg))' }}>
            <div style={{ marginBottom: '24px' }}>
              <span className="muted" style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                <Icon name="server" size={14} /> 正在服務的伺服器數量
              </span>
              <h2 style={{ fontSize: '42px', margin: '8px 0 0 0', fontWeight: '800', color: 'var(--accent)' }}>
                <CountUp value={metrics?.guildCount ?? 0} />
              </h2>
            </div>
            <div>
              <span className="muted" style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                <Icon name="users" size={14} /> 累計保護的 Discord 成員數
              </span>
              <h2 style={{ fontSize: '42px', margin: '8px 0 0 0', fontWeight: '800', color: '#3b9af5' }}>
                <CountUp value={metrics?.totalUsers ?? 0} />
              </h2>
            </div>
          </div>

          {/* 右側：列表式細節指標 */}
          <div className="card-block" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500' }}>
                <Icon name="alert" size={15} style={{ color: '#ff4757' }} /> 
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  被踢出或封鎖的人數
                  <InfoBadge text="被系統 AutoMod 自動封禁 (Ban) 或踢出 (Kick) 的惡意使用者總數。" />
                </span>
              </span>
              <strong style={{ fontSize: '20px' }}><CountUp value={metrics?.bannedTotal ?? 0} /></strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500' }}>
                <Icon name="shield" size={15} style={{ color: '#ffa502' }} /> 
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  今日自動擋下的違規發言
                  <InfoBadge text="過去 24 小時內，被系統偵測並自動刪除的洗頻、詐騙連結或不雅字眼訊息數量。" />
                </span>
              </span>
              <strong style={{ fontSize: '20px' }}><CountUp value={metrics?.violationsToday ?? 0} /></strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500' }}>
                <Icon name="lock" size={15} style={{ color: '#ff4757' }} /> 
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  今日防爆破保護啟動次數
                  <InfoBadge text="過去 24 小時內，因為大量成員湧入而觸發「防爆破模式」並暫停新成員驗證的次數。" />
                </span>
              </span>
              <strong style={{ fontSize: '20px' }}><CountUp value={metrics?.raidTriggers ?? 0} /></strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '4px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500' }}>
                <Icon name="ticket" size={15} style={{ color: '#2ed573' }} /> 歷史處理過的客服單總數 (處理中: {metrics?.ticketsOpen ?? 0})
              </span>
              <strong style={{ fontSize: '20px' }}><CountUp value={metrics?.ticketsTotal ?? 0} /></strong>
            </div>
          </div>
        </div>

        {/* 新增的視覺化圖表與績效面板 */}
        <div className="grid-2col" style={{ gap: '20px', marginTop: '24px' }}>
          <div className="card-block" style={{ padding: '24px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
              <Icon name="chart" size={16} /> 伺服器尖峰時段熱力圖
            </h3>
            <p className="muted" style={{ marginBottom: '16px', fontSize: '13px' }}>
              分析成員在每週各時段的活躍程度，有助於安排活動與公告時間。
            </p>
            <Heatmap />
          </div>

          <div className="card-block" style={{ padding: '24px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
              <Icon name="users" size={16} /> 全域管理員績效排名
            </h3>
            <p className="muted" style={{ marginBottom: '16px', fontSize: '13px' }}>
              顯示活躍管理員處理客服單與執行裁罰的績效總覽。
            </p>
            <ModStats />
          </div>
        </div>
      </section>

      {/* 個人動態與專屬支援中心 */}
      <section className="grid-2col" style={{ marginTop: '24px', alignItems: 'stretch' }}>
        {/* 左側：My Open Tickets */}
        <div className="card-block" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
            <Icon name="ticket" size={18} />
            近期待辦工單 (My Open Tickets)
          </h3>
          <p className="muted" style={{ marginBottom: '16px', fontSize: '13px' }}>
            顯示您管理的所有伺服器中，最新開啟的客服工單。
          </p>
          
          <div style={{ flex: 1, overflowY: 'auto', minHeight: '200px' }}>
            {loadingTickets ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--muted)' }}>載入中...</div>
            ) : nexusTickets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--muted)', background: 'var(--code-bg)', borderRadius: '6px' }}>
                目前沒有待辦工單 🎉
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--muted)' }}>
                    <th style={{ padding: '8px 4px' }}>工單編號</th>
                    <th style={{ padding: '8px 4px' }}>開啟時間</th>
                    <th style={{ padding: '8px 4px' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {nexusTickets.map(ticket => (
                    <tr key={ticket.ticketId} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 4px', fontWeight: '500' }}>#{ticket.ticketId}</td>
                      <td style={{ padding: '12px 4px', color: 'var(--muted)' }}>
                        {new Date(ticket.createdAt).toLocaleString('zh-TW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '12px 4px' }}>
                        <Link to={`/guilds/${ticket.guildId}`} style={{ color: 'var(--accent)', textDecoration: 'none' }}>查看詳情</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* 右側：Changelog & Feedback */}
        <div className="card-block" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
            <Icon name="message" size={18} />
            最新動態與問題回報
          </h3>
          
          <div style={{ background: 'var(--code-bg)', padding: '16px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>
            <strong style={{ display: 'block', marginBottom: '4px', color: 'var(--accent)' }}>🚀 最新更新 (v0.1.0)</strong>
            <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--muted)' }}>
              <li style={{ marginBottom: '4px' }}>修復了 /roles/panels 發送身分組時發生的 500 錯誤。</li>
              <li style={{ marginBottom: '4px' }}>優化了 Discord 連線核心，解決 Render 部署上的連線限制。</li>
              <li>全新設計的個人動態儀表板上線。</li>
            </ul>
          </div>

          <form onSubmit={handleFeedbackSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                <input type="radio" name="feedbackType" value="feedback" checked={feedbackType === 'feedback'} onChange={() => setFeedbackType('feedback')} />
                💡 功能許願
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                <input type="radio" name="feedbackType" value="bug" checked={feedbackType === 'bug'} onChange={() => setFeedbackType('bug')} />
                🐛 Bug 回報
              </label>
            </div>
            
            <textarea
              value={feedbackMessage}
              onChange={(e) => setFeedbackMessage(e.target.value)}
              placeholder="有什麼想告訴開發者的嗎？（例如：我想要新增 OOO 功能！）"
              required
              rows={4}
              style={{
                flex: 1,
                resize: 'none',
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--fg)',
                fontFamily: 'inherit',
                fontSize: '13px'
              }}
            />
            
            <button 
              type="submit" 
              className="button primary" 
              disabled={submittingFeedback || !feedbackMessage.trim()}
              style={{ alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 24px' }}
            >
              {submittingFeedback ? '傳送中...' : (
                <>
                  <Icon name="send" size={14} /> 送出回饋
                </>
              )}
            </button>
          </form>
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
