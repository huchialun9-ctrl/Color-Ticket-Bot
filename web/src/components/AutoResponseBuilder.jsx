import { useState } from 'react';
import { api } from '../api.js';
import Icon from './Icon.jsx';

export default function AutoResponseBuilder({ guildId, initialResponses = [] }) {
  const [list, setList] = useState(initialResponses);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const addRow = () => {
    setList([...list, { trigger: '', reply: '' }]);
  };

  const removeRow = (idx) => {
    setList(list.filter((_, i) => i !== idx));
  };

  const handleChange = (idx, field, val) => {
    const next = [...list];
    next[idx][field] = val;
    setList(next);
  };

  const handleSave = async () => {
    // 過濾空值
    const filtered = list.filter((item) => item.trigger.trim() && item.reply.trim());
    setLoading(true);
    try {
      await api.saveSettings(guildId, {
        'ticketing.autoResponses': filtered,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (e) {
      alert(`儲存失敗：${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-builder" style={{ textAlign: 'left' }}>
      <div className="table-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 300px' }}>
          <h3>💬 關鍵字自動回覆設定</h3>
          <p className="muted" style={{ margin: '4px 0 0 0' }}>當工單頻道（channel 名稱以 ticket- 開頭）收到匹配的關鍵字時，Bot 會自動發送預設回覆。</p>
        </div>
        <button className="primary" onClick={addRow} style={{ flexShrink: 0, whiteSpace: 'nowrap', marginTop: '4px' }}>
          <Icon name="plus" size={15} /> 新增規則
        </button>
      </div>

      <div className="builder-fields-list" style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {list.map((item, idx) => (
          <div key={idx} className="builder-field-card" style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative' }}>
            <button
              className="ghost danger"
              onClick={() => removeRow(idx)}
              style={{ position: 'absolute', top: '12px', right: '12px', padding: '4px' }}
              title="刪除此規則"
            >
              <Icon name="close" size={16} />
            </button>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: '16px' }}>
              <label className="field">
                觸發關鍵字
                <input
                  placeholder="例如：匯款"
                  value={item.trigger}
                  onChange={(e) => handleChange(idx, 'trigger', e.target.value)}
                />
              </label>
              <label className="field">
                系統自動答覆內容
                <textarea
                  placeholder="請填入偵測關鍵字後 Bot 的自動答覆訊息..."
                  rows={2}
                  value={item.reply}
                  onChange={(e) => handleChange(idx, 'reply', e.target.value)}
                />
              </label>
            </div>
          </div>
        ))}

        {list.length === 0 && (
          <div className="empty" style={{ background: 'var(--code-bg)', borderRadius: '8px' }}>
            目前尚未設定任何關鍵字自動回覆規則
          </div>
        )}
      </div>

      <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
        <button className="primary" disabled={loading} onClick={handleSave}>
          <Icon name="check" size={15} /> {loading ? '儲存中…' : success ? '儲存成功！' : '儲存自動回覆設定'}
        </button>
      </div>
    </div>
  );
}
