import { useState, useEffect } from 'react';
import { api } from '../api.js';
import Icon from './Icon.jsx';
import ChannelSelect from './ChannelSelect.jsx';
import InfoBadge from './InfoBadge.jsx';

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

        <div className="field">
          <span style={{ display: 'flex', alignItems: 'center' }}>
            目標發布頻道
            <InfoBadge text="選擇你要將此「客服中心面板」發送至哪個頻道。\n建議發送至唯讀的公開頻道，例如 #聯絡客服。" />
          </span>
          <ChannelSelect
            value={selectedChannel}
            onChange={setSelectedChannel}
            channels={channels}
            placeholder="-- 選擇頻道 --"
          />
        </div>

        <label className="field">
          <span style={{ display: 'flex', alignItems: 'center' }}>
            面板標題（預設：客服中心）
            <InfoBadge text="這將是訊息卡片最上方的粗體大標題。" />
          </span>
          <input
            placeholder="例如：📩 聯絡管理團隊"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>

        <label className="field">
          <span style={{ display: 'flex', alignItems: 'center' }}>
            面板描述（預設：點擊下方按鈕建立私密客服單。）
            <InfoBadge text="標題下方的副文說明，可放一些引導使用者如何發問的規則。" />
          </span>
          <textarea
            placeholder="點擊下方按鈕建立私密客服單..."
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>

        <label className="field">
          <span style={{ display: 'flex', alignItems: 'center' }}>
            按鈕標題（預設：📩 開啟客服單）
            <InfoBadge text="使用者將點擊的按鈕上的文字。長度最多 80 個字元。" />
          </span>
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
