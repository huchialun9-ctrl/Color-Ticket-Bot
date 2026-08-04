import { useState, useEffect } from 'react';
import { api } from '../api.js';
import Icon from './Icon.jsx';

export default function TicketPanelDeployer({ guildId }) {
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [buttonLabel, setButtonLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api.channels(guildId)
      .then((res) => {
        setChannels(res.channels || []);
        if (res.channels?.length) {
          setSelectedChannel(res.channels[0].id);
        }
      })
      .catch((e) => console.error('[TicketPanelDeployer] failed to load channels', e));
  }, [guildId]);

  const handleDeploy = async () => {
    if (!selectedChannel) return alert('請選擇要發布的頻道！');

    setLoading(true);
    try {
      await api.deployTicketPanel(guildId, {
        channelId: selectedChannel,
        title,
        description,
        buttonLabel,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (e) {
      alert(`發布失敗：${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="embed-sender-container">
      <div className="builder-editor">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Icon name="ticket" size={18} /> 發布工單按鈕面板</h3>
        <p className="muted" style={{ marginBottom: '16px' }}>
          在此設定工單開啟按鈕與描述面板，並直接發布至指定的伺服器頻道中。
        </p>

        <label className="field">
          目標發布頻道
          <select value={selectedChannel} onChange={(e) => setSelectedChannel(e.target.value)}>
            {channels.map((ch) => (
              <option key={ch.id} value={ch.id}>
                # {ch.name}
              </option>
            ))}
            {channels.length === 0 && <option value="">無可用文字頻道</option>}
          </select>
        </label>

        <label className="field">
          面板標題（預設：客服中心）
          <input
            placeholder="例如：📩 聯絡管理團隊"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>

        <label className="field">
          面板描述（預設：點擊下方按鈕建立私密客服單。）
          <textarea
            placeholder="點擊下方按鈕建立私密客服單..."
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>

        <label className="field">
          按鈕標題（預設：📩 開啟客服單）
          <input
            placeholder="例如：📩 建立工單"
            value={buttonLabel}
            onChange={(e) => setButtonLabel(e.target.value)}
          />
        </label>

        <div className="builder-actions" style={{ marginTop: '20px' }}>
          <button className="primary" disabled={loading} onClick={handleDeploy}>
            <Icon name="webhook" size={15} /> {loading ? '發布中…' : success ? '已成功發布！' : '發布面板'}
          </button>
        </div>
      </div>

      <div className="builder-preview">
        <h3>即時面板預覽</h3>
        <div className="discord-embed-mock" style={{ flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex' }}>
            <div className="discord-embed-color-bar" style={{ backgroundColor: '#2f3136' }} />
            <div className="discord-embed-content">
              <div className="discord-embed-title">{title || '客服中心'}</div>
              <div className="discord-embed-description">
                {description || '點擊下方按鈕建立私密客服單。'}
              </div>
            </div>
          </div>
          {/* Discord Button Preview */}
          <div style={{ paddingLeft: '12px' }}>
            <button
              className="primary"
              disabled
              style={{
                background: '#5865F2',
                color: '#fff',
                border: 'none',
                borderRadius: '3px',
                padding: '6px 16px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'default',
              }}
            >
              {buttonLabel || '📩 開啟客服單'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
