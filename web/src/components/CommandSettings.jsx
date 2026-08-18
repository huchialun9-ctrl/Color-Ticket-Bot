import { useState, useEffect } from 'react';
import { api } from '../api.js';
import Icon from './Icon.jsx';
import ChannelSelect from './ChannelSelect.jsx';
import InfoBadge from './InfoBadge.jsx';

export default function CommandSettings({ guildId, channels = [], settings = null, onSettingsUpdate = () => {} }) {
  // 歡迎卡片狀態
  const [welcomeEnabled, setWelcomeEnabled] = useState(false);
  const [welcomeChannelId, setWelcomeChannelId] = useState('');
  const [welcomeBackground, setWelcomeBackground] = useState('');
  const [welcomeText, setWelcomeText] = useState('');
  const [saveWelcomeSuccess, setSaveWelcomeSuccess] = useState(false);

  // AutoMod 與日誌狀態
  const [logChannelId, setLogChannelId] = useState('');
  const [automodEnabled, setAutomodEnabled] = useState(true);
  const [warnThreshold, setWarnThreshold] = useState(3);
  const [raidThreshold, setRaidThreshold] = useState(10);
  const [saveSystemSuccess, setSaveSystemSuccess] = useState(false);

  const loadWelcomeCard = async () => {
    try {
      const res = await api.fetchWelcomeCard(guildId);
      if (res.welcomeCard) {
        setWelcomeEnabled(res.welcomeCard.enabled ?? false);
        setWelcomeChannelId(res.welcomeCard.channelId || '');
        setWelcomeBackground(res.welcomeCard.backgroundUrl || '');
        setWelcomeText(res.welcomeCard.customText || '');
      }
    } catch (e) {
      console.error('[welcome] load failed', e);
    }
  };

  useEffect(() => {
    loadWelcomeCard();
  }, [guildId]);

  useEffect(() => {
    if (settings) {
      setLogChannelId(settings.logChannelId || '');
      if (settings.automod) {
        setAutomodEnabled(settings.automod.enabled ?? true);
        setWarnThreshold(settings.automod.warnThreshold ?? 3);
        if (settings.automod.raid) {
          setRaidThreshold(settings.automod.raid.threshold ?? 10);
        }
      }
    }
  }, [settings]);

  // 儲存歡迎卡片
  const handleSaveWelcome = async () => {
    try {
      await api.saveWelcomeCard(guildId, {
        enabled: welcomeEnabled,
        channelId: welcomeChannelId,
        backgroundUrl: welcomeBackground,
        customText: welcomeText,
      });
      setSaveWelcomeSuccess(true);
      setTimeout(() => setSaveWelcomeSuccess(false), 2000);
    } catch (e) {
      alert(`儲存歡迎卡片失敗：${e.message}`);
    }
  };

  // 儲存系統與 AutoMod
  const handleSaveSystem = async () => {
    try {
      const payload = {
        logChannelId: logChannelId || null,
        automod: {
          enabled: automodEnabled,
          warnThreshold: parseInt(warnThreshold) || 3,
          raid: {
            windowMs: 60000,
            threshold: parseInt(raidThreshold) || 10,
          },
        }
      };
      const res = await api.saveSettings(guildId, payload);
      onSettingsUpdate(res.settings);
      setSaveSystemSuccess(true);
      setTimeout(() => setSaveSystemSuccess(false), 2000);
    } catch (e) {
      alert(`儲存系統設定失敗：${e.message}`);
    }
  };

  return (
    <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* 區塊一：系統與防爆破 (AutoMod) */}
      <section style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '20px', borderRadius: '8px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Icon name="shield" size={16} /> 核心防護與系統設定
        </h3>
        <p className="muted" style={{ marginBottom: '16px' }}>
          設定伺服器的全域日誌頻道以及 AutoMod 防爆破機制。
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div className="field">
              <span style={{ display: 'flex', alignItems: 'center' }}>
                稽核與處分日誌頻道
                <InfoBadge text="當成員被踢出、禁言、封禁，或工單有異動時，系統會將詳細日誌發送至此頻道。" />
              </span>
              <ChannelSelect
                value={logChannelId}
                onChange={setLogChannelId}
                channels={channels}
                placeholder="-- 選擇日誌頻道 (可不選) --"
              />
            </div>

            <label style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', fontWeight: '600' }}>
              <input
                type="checkbox"
                checked={automodEnabled}
                onChange={(e) => setAutomodEnabled(e.target.checked)}
              />
              啟用 AutoMod 與防爆破聯防 (建議)
            </label>

          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <label className="field" style={{ opacity: automodEnabled ? 1 : 0.5, pointerEvents: automodEnabled ? 'auto' : 'none' }}>
              <span style={{ display: 'flex', alignItems: 'center' }}>
                自動禁言警告閾值
                <InfoBadge text="當成員在短時間內收到超過此數量的警告時，系統將會自動將其禁言 (Timeout)。\n預設值為 3。" />
              </span>
              <input
                type="number"
                min="1"
                max="10"
                value={warnThreshold}
                onChange={(e) => setWarnThreshold(e.target.value)}
              />
            </label>

            <label className="field" style={{ opacity: automodEnabled ? 1 : 0.5, pointerEvents: automodEnabled ? 'auto' : 'none' }}>
              <span style={{ display: 'flex', alignItems: 'center' }}>
                防爆破 (Raid) 容忍人數 / 分鐘
                <InfoBadge text="當 60 秒內有超過此數量的新成員湧入時，系統會自動啟動「防爆破模式」並暫停新成員驗證。\n預設為 10 人。" />
              </span>
              <input
                type="number"
                min="5"
                max="50"
                value={raidThreshold}
                onChange={(e) => setRaidThreshold(e.target.value)}
              />
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '20px' }}>
          <button className="primary" onClick={handleSaveSystem}>
            <Icon name="check" size={15} /> {saveSystemSuccess ? '系統設定已儲存！' : '儲存系統設定'}
          </button>
        </div>
      </section>

      {/* 區塊二：歡迎卡片 */}
      <section style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '20px', borderRadius: '8px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Icon name="puzzle" size={16} /> 歡迎訊息模組
        </h3>
        <p className="muted" style={{ marginBottom: '16px' }}>
          自訂新成員加入伺服器時，發送的動態形象卡片與提示內容。
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <label style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', fontWeight: '600' }}>
              <input
                type="checkbox"
                checked={welcomeEnabled}
                onChange={(e) => setWelcomeEnabled(e.target.checked)}
              />
              啟用歡迎卡片推送
            </label>

            <div className="field">
              <span style={{ display: 'flex', alignItems: 'center' }}>
                推送到指定頻道
                <InfoBadge text="當新成員加入且通過驗證後，Bot 會在此頻道發送歡迎訊息。\n請確保 Bot 擁有該頻道的讀寫與附加檔案權限。" />
              </span>
              <ChannelSelect
                value={welcomeChannelId}
                onChange={setWelcomeChannelId}
                channels={channels}
                placeholder="-- 選擇歡迎頻道 --"
              />
            </div>

            <label className="field">
              <span style={{ display: 'flex', alignItems: 'center' }}>
                卡片背景圖片 URL
                <InfoBadge text="自訂歡迎卡片的背景圖片。\n請填入圖片直連網址 (例如: https://imgur.com/xxx.png)。\n如果不填將使用系統預設背景。" />
              </span>
              <input
                value={welcomeBackground}
                onChange={(e) => setWelcomeBackground(e.target.value)}
                placeholder="例如: https://images.unsplash.com/...jpg"
              />
            </label>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label className="field">
              <span style={{ display: 'flex', alignItems: 'center' }}>
                自訂歡迎致詞內容
                <InfoBadge text="附帶在歡迎卡片上方的文字訊息。\n支援 Discord Markdown 語法 (例如粗體、超連結等)。" />
              </span>
              <textarea
                value={welcomeText}
                onChange={(e) => setWelcomeText(e.target.value)}
                placeholder="歡迎來到本伺服器！請先閱讀守則哦！"
                rows={5}
              />
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '20px' }}>
          <button className="primary" onClick={handleSaveWelcome}>
            <Icon name="check" size={15} /> {saveWelcomeSuccess ? '卡片設定已儲存！' : '儲存卡片設定'}
          </button>
        </div>
      </section>

    </div>
  );
}
