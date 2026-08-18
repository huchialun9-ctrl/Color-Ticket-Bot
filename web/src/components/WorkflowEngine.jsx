import { useState, useEffect } from 'react';
import { api } from '../api.js';
import Icon from './Icon.jsx';
import ChannelSelect from './ChannelSelect.jsx';

export default function WorkflowEngine({ guildId, channels = [] }) {
  const [forms, setForms] = useState([]);
  const [formId, setFormId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetChannelId, setTargetChannelId] = useState('');
  const [fields, setFields] = useState([{ label: '', type: 'text', required: true }]);
  const [loading, setLoading] = useState(false);

  const loadForms = async () => {
    try {
      const res = await api.fetchForms(guildId);
      setForms(res.forms || []);
    } catch (e) {
      console.error('[workflow] load forms failed', e);
    }
  };

  useEffect(() => {
    loadForms();
  }, [guildId]);

  const addFieldRow = () => {
    setFields([...fields, { label: '', type: 'text', required: true }]);
  };

  const removeFieldRow = (idx) => {
    setFields(fields.filter((_, i) => i !== idx));
  };

  const handleFieldChange = (idx, key, val) => {
    const next = [...fields];
    next[idx][key] = val;
    setFields(next);
  };

  const handleSaveForm = async () => {
    if (!formId.trim()) return alert('請輸入表單 ID（自訂代碼）！');
    if (!title.trim()) return alert('請輸入表單標題！');
    if (!targetChannelId) return alert('請選擇表單提交後，發送 Discord 審核通知的目標頻道！');

    const validFields = fields.filter((f) => f.label.trim());
    if (validFields.length === 0) return alert('請設定至少一個表單輸入欄位！');

    setLoading(true);
    try {
      await api.saveForm(guildId, {
        formId: formId.trim(),
        title: title.trim(),
        description: description.trim(),
        targetChannelId,
        fields: validFields
      });
      setFormId('');
      setTitle('');
      setDescription('');
      setTargetChannelId('');
      setFields([{ label: '', type: 'text', required: true }]);
      await loadForms();
      alert('網頁表單工作流設定成功！');
    } catch (e) {
      alert(`儲存失敗：${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (fid) => {
    if (!confirm('確定要刪除此表單與關聯工作流？')) return;
    try {
      await api.deleteForm(guildId, fid);
      await loadForms();
    } catch (e) {
      alert(`刪除失敗：${e.message}`);
    }
  };

  return (
    <div style={{ textAlign: 'left' }}>
      <div className="table-toolbar">
        <div>
          <h3>動態網頁表單轉 Discord 審核工作流</h3>
          <p className="muted">設計網頁表單，訪客線上填寫提交後，系統將會在 Discord 內生成帶有「核准/拒絕」按鈕的 Embed 互動審核卡片。</p>
        </div>
      </div>

      <div className="form-builder" style={{ marginTop: '20px' }}>
        {/* 左側：表單設計器 */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '20px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <span style={{ fontWeight: '600', fontSize: '14px' }}>設計新工作流表單</span>

          <label className="field">
            表單 ID (自訂唯一識別碼)
            <input
              value={formId}
              onChange={(e) => setFormId(e.target.value)}
              placeholder="例如: join-recruitment"
            />
          </label>

          <label className="field">
            表單標題
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如: 公會招募審核表"
            />
          </label>

          <label className="field">
            表單描述
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="提示申請者填寫的注意事項..."
              rows={2}
            />
          </label>

          <div className="field">
            <span>審核通知頻道</span>
            <ChannelSelect
              value={targetChannelId}
              onChange={setTargetChannelId}
              channels={channels}
              placeholder="-- 選擇頻道 --"
            />
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontWeight: '600', fontSize: '13px' }}>表單輸入欄位</span>
              <button className="ghost" onClick={addFieldRow} style={{ padding: '2px 6px', fontSize: '11px' }}>
                + 新增欄位
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
              {fields.map((f, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr auto auto', gap: '6px', alignItems: 'center' }}>
                  <input
                    placeholder="欄位名稱 (如: 遊戲 ID)"
                    value={f.label}
                    onChange={(e) => handleFieldChange(idx, 'label', e.target.value)}
                    style={{ padding: '4px', fontSize: '12px' }}
                  />
                  <select
                    value={f.type}
                    onChange={(e) => handleFieldChange(idx, 'type', e.target.value)}
                    style={{ padding: '4px', fontSize: '12px' }}
                  >
                    <option value="text">單行文字</option>
                    <option value="textarea">多行描述</option>
                    <option value="number">數字</option>
                  </select>
                  <label style={{ fontSize: '11px', display: 'flex', gap: '2px', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={f.required}
                      onChange={(e) => handleFieldChange(idx, 'required', e.target.checked)}
                    />
                    必填
                  </label>
                  <button className="ghost danger" onClick={() => removeFieldRow(idx)} style={{ padding: '4px' }}>
                    <Icon name="close" size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button className="primary" disabled={loading} onClick={handleSaveForm} style={{ alignSelf: 'flex-start' }}>
            <Icon name="check" size={15} /> 儲存表單與啟用
          </button>
        </div>

        {/* 右側：表單清單與公開提交網址 */}
        <div style={{ background: 'var(--code-bg)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <span style={{ fontWeight: '600', fontSize: '14px', display: 'block', marginBottom: '12px' }}>作用中的工作流表單清單</span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto' }}>
            {forms.map((f) => {
              // 自動推導公開的表單提交 API 連接
              const publicSubmitUrl = `${window.location.origin}/api/public/forms/${f.formId}/submit`;
              return (
                <div key={f.formId} style={{ background: 'var(--card)', padding: '16px', borderRadius: '6px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ margin: 0, color: 'var(--accent)' }}>{f.title}</h4>
                      <span className="code" style={{ fontSize: '11px' }}>ID: {f.formId}</span>
                    </div>
                    <button
                      className="ghost danger"
                      onClick={() => handleDelete(f.formId)}
                      style={{ padding: '4px' }}
                      title="刪除工作流"
                    >
                      <Icon name="close" size={14} />
                    </button>
                  </div>
                  <p style={{ margin: '4px 0', fontSize: '13px', color: 'var(--muted)' }}>{f.description || '無表單描述。'}</p>
                  
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '8px', marginTop: '4px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block', marginBottom: '2px' }}>申請表單提交 API 網址 (供外部訪客提交):</span>
                    <input
                      readOnly
                      value={publicSubmitUrl}
                      onClick={(e) => {
                        e.target.select();
                        navigator.clipboard.writeText(publicSubmitUrl);
                        alert('已複製公開提交 API 網址！');
                      }}
                      style={{ width: '100%', padding: '6px', fontSize: '11px', background: 'var(--code-bg)', color: 'var(--accent)', border: '1px solid var(--border)', cursor: 'pointer' }}
                    />
                  </div>
                </div>
              );
            })}

            {forms.length === 0 && (
              <div className="empty" style={{ background: 'var(--card)' }}>
                目前尚無建立任何網頁表單工作流
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
