import { useState, useEffect } from 'react';
import { api } from '../api.js';
import Icon from './Icon.jsx';

export default function EmbedSender({ guildId }) {
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#5865F2'); // Default blurple
  const [imageUrl, setImageUrl] = useState('');
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
      .catch((e) => console.error('[EmbedSender] failed to load channels', e));
  }, [guildId]);

  const handleSend = async () => {
    if (!selectedChannel) return alert('請選擇要發送的頻道！');
    if (!description) return alert('請輸入訊息描述內容！');

    setLoading(true);
    try {
      await api.sendEmbed(guildId, {
        channelId: selectedChannel,
        title,
        description,
        color,
        imageUrl,
      });
      setSuccess(true);
      setTitle('');
      setDescription('');
      setImageUrl('');
      setTimeout(() => setSuccess(false), 2000);
    } catch (e) {
      alert(`發送失敗：${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="embed-sender-container">
      <div className="builder-editor">
        <h3>📢 炫彩 Embed 廣播發送器</h3>
        <p className="muted" style={{ marginBottom: '16px' }}>
          建立自訂 Embed 訊息，並以 Bot 身份立即發送到指定的伺服器頻道。
        </p>

        <label className="field">
          目標頻道
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
          訊息標題（選填）
          <input
            placeholder="例如：伺服器最新公告"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>

        <label className="field">
          描述與內容（必填）
          <textarea
            placeholder="支援 Markdown 與換行..."
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>

        <div className="field-row">
          <label className="field">
            側邊條配色
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
          </label>
          <label className="field" style={{ flex: 2 }}>
            圖片網址（選填）
            <input
              placeholder="https://example.com/image.png"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </label>
        </div>

        <div className="builder-actions" style={{ marginTop: '20px' }}>
          <button className="primary" disabled={loading} onClick={handleSend}>
            <Icon name="plus" size={15} /> {loading ? '發送中…' : success ? '已成功發送！' : '發送廣播'}
          </button>
        </div>
      </div>

      <div className="builder-preview">
        <h3>即時預覽（Discord Embed）</h3>
        <div className="discord-embed-mock">
          <div className="discord-embed-color-bar" style={{ backgroundColor: color }} />
          <div className="discord-embed-content">
            {title && <div className="discord-embed-title">{title}</div>}
            <div className="discord-embed-description">
              {description || <span className="muted">輸入描述以預覽訊息內容...</span>}
            </div>
            {imageUrl && (
              <img
                src={imageUrl}
                alt="Embed Preview"
                className="discord-embed-image"
                onError={(e) => (e.target.style.display = 'none')}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
