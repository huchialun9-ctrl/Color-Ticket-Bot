import { useState, useEffect } from 'react';
import { api } from '../api.js';
import Icon from './Icon.jsx';
import ChannelSelect from './ChannelSelect.jsx';

export default function SchedulerManager({ guildId, channels = [] }) {
  const [channelId, setChannelId] = useState('');
  const [content, setContent] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadScheduled = async () => {
    try {
      const res = await api.fetchScheduledAnnouncements(guildId);
      setList(res.list || []);
    } catch (e) {
      console.error('[scheduler] failed to load scheduled list', e);
    }
  };

  useEffect(() => {
    loadScheduled();
  }, [guildId]);

  const handleSchedule = async () => {
    if (!channelId) return alert('請選擇要發送的頻道！');
    if (!content.trim()) return alert('請輸入公告內容！');
    if (!scheduledAt) return alert('請選擇預約發送時間！');

    const scheduledDate = new Date(scheduledAt);
    if (scheduledDate <= new Date()) {
      return alert('預約發送時間必須大於目前時間！');
    }

    setLoading(true);
    try {
      const res = await api.createScheduledAnnouncement(guildId, {
        channelId,
        content,
        scheduledAt: scheduledDate.toISOString(),
      });
      if (res.error) return alert(`預約失敗：${res.detail || res.error}`);
      alert('預約公告發送成功！');
      setContent('');
      setScheduledAt('');
      await loadScheduled();
    } catch (e) {
      alert(`預約失敗：${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!confirm('確認要取消此預約公告？')) return;
    try {
      await api.deleteScheduledAnnouncement(guildId, id);
      await loadScheduled();
    } catch (e) {
      alert(`取消失敗：${e.message}`);
    }
  };

  return (
    <div style={{ textAlign: 'left' }}>
      <div className="table-toolbar">
        <div>
          <h3>排程公告與自動化訊息</h3>
          <p className="muted">預約在未來的特定時間，自動發布公告或通知訊息至指定頻道。</p>
        </div>
      </div>

      <div className="form-builder" style={{ marginTop: '20px' }}>
        {/* 左側：預約表單 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="field">
            <span>目標頻道</span>
            <ChannelSelect
              value={channelId}
              onChange={setChannelId}
              channels={channels}
              placeholder="-- 選擇頻道 --"
            />
          </div>

          <label className="field">
            預約發送時間
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              style={{ padding: '8px', background: 'var(--card)', color: 'var(--fg)', border: '1px solid var(--border)', borderRadius: '6px' }}
            />
          </label>

          <label className="field">
            公告訊息內容
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="輸入要發布的公告內容..."
              rows={4}
            />
          </label>

          <button className="primary" disabled={loading} onClick={handleSchedule} style={{ alignSelf: 'flex-start' }}>
            <Icon name="check" size={15} /> 預約公告發送
          </button>
        </div>

        {/* 右側：預約清單 */}
        <div style={{ background: 'var(--code-bg)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <span style={{ fontWeight: '600', fontSize: '14px', display: 'block', marginBottom: '12px' }}>已排程的預約公告清單</span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto' }}>
            {list.map((item) => (
              <div key={item._id} style={{ background: 'var(--card)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ fontSize: '13px', lineHeight: '1.4', textAlign: 'left' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                    <span className={`badge badge-${item.status}`}>{item.status === 'pending' ? '等待發送' : item.status === 'sent' ? '已發送' : '發送失敗'}</span>
                    <span className="muted">{new Date(item.scheduledAt).toLocaleString('zh-TW')}</span>
                  </div>
                  <p style={{ margin: '4px 0', wordBreak: 'break-all' }}>{item.content}</p>
                </div>
                {item.status === 'pending' && (
                  <button
                    className="ghost danger"
                    onClick={() => handleCancel(item._id)}
                    style={{ padding: '4px', flexShrink: 0 }}
                    title="取消預約"
                  >
                    <Icon name="close" size={14} />
                  </button>
                )}
              </div>
            ))}

            {list.length === 0 && (
              <div className="empty" style={{ background: 'var(--card)' }}>
                目前沒有任何已排程的公告
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
