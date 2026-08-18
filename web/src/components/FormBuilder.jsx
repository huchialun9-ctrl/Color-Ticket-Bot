import { useState } from 'react';
import { api } from '../api.js';
import Icon from './Icon.jsx';

const FIELD_KEYS = ['customId', 'label', 'placeholder'];

/** 動態表單預覽器：編輯自訂欄位並即時預覽 Discord Modal 的所見即所得效果 */
export default function FormBuilder({ guildId, initialForm }) {
  const [form, setForm] = useState(() => ({
    title: initialForm?.title || '建立客服單',
    fields:
      initialForm?.fields?.length
        ? initialForm.fields
        : [{ customId: 'subject', label: '主旨', style: 'short', required: true, maxLength: 1024 }],
  }));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const updateField = (i, patch) => {
    setForm((f) => ({
      ...f,
      fields: f.fields.map((fd, idx) => (idx === i ? { ...fd, ...patch } : fd)),
    }));
  };

  const addField = () =>
    setForm((f) => ({
      ...f,
      fields: [
        ...f.fields,
        { customId: `field${f.fields.length + 1}`, label: '新欄位', style: 'short', required: false, maxLength: 1024 },
      ],
    }));

  const removeField = (i) =>
    setForm((f) => ({ ...f, fields: f.fields.filter((_, idx) => idx !== i) }));

  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= form.fields.length) return;
    setForm((f) => {
      const next = [...f.fields];
      [next[i], next[j]] = [next[j], next[i]];
      return { ...f, fields: next };
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.saveSettings(guildId, { form });
      setSaved(true);
      setTimeout(() => setSaved(false), 1600);
    } catch (e) {
      alert(`儲存失敗：${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="form-builder">
      <div className="builder-editor">
        <h3>表單欄位設定</h3>
        <label className="field">
          表單標題
          <input value={form.title} onChange={(e) => set({ title: e.target.value })} />
        </label>

        {form.fields.map((fd, i) => (
          <div key={i} className="builder-field">
            <div className="field-row">
              <label className="field">
                Label
                <input value={fd.label} onChange={(e) => updateField(i, { label: e.target.value })} />
              </label>
              <label className="field">
                Custom ID
                <input
                  value={fd.customId}
                  onChange={(e) =>
                    updateField(i, { customId: e.target.value.replace(/\s/g, '_') })
                  }
                />
              </label>
            </div>
            <div className="field-row">
              <label className="field">
                樣式
                <select value={fd.style} onChange={(e) => updateField(i, { style: e.target.value })}>
                  <option value="short">短文字（單行）</option>
                  <option value="paragraph">段落（多行）</option>
                </select>
              </label>
              <label className="field">
                Placeholder
                <input
                  value={fd.placeholder || ''}
                  onChange={(e) => updateField(i, { placeholder: e.target.value })}
                />
              </label>
              <label className="field checkbox-field">
                <input
                  type="checkbox"
                  checked={fd.required !== false}
                  onChange={(e) => updateField(i, { required: e.target.checked })}
                />
                必填
              </label>
            </div>
            <div className="field-actions">
              <button className="ghost" disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
              <button className="ghost" disabled={i === form.fields.length - 1} onClick={() => move(i, 1)}>↓</button>
              <button className="ghost danger" onClick={() => removeField(i)}>刪除</button>
            </div>
          </div>
        ))}

        <div className="builder-actions">
          <button onClick={addField}>
            <Icon name="plus" size={15} /> 新增欄位
          </button>
          <button className="primary" disabled={saving} onClick={save}>
            {saving ? '儲存中…' : saved ? '已儲存' : '儲存表單'}
          </button>
        </div>
      </div>

      <div className="builder-preview">
        <h3>即時預覽（Discord Modal）</h3>
        <div className="modal-mock">
          <div className="modal-mock-title">{form.title || '表單'}</div>
          {form.fields.map((fd, i) => (
            <div key={i} className="modal-mock-field">
              <label>
                {fd.label}
                {fd.required !== false && <span className="required-star">*</span>}
              </label>
              {fd.style === 'paragraph' ? (
                <textarea rows={3} placeholder={fd.placeholder || fd.label} readOnly />
              ) : (
                <input placeholder={fd.placeholder || fd.label} readOnly />
              )}
            </div>
          ))}
          <div className="modal-mock-footer">
            <span className="modal-mock-hint">提交後將建立私密客服頻道</span>
            <span className="modal-mock-submit">提交</span>
          </div>
        </div>
      </div>
    </div>
  );
}
