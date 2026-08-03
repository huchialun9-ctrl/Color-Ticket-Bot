import { useState } from 'react';
import { api } from '../api.js';

/**
 * Webhook 測試與即時事件發送預覽。
 * 手動輸入訊息並發送測試請求，即時驗證 Discord 頻道是否能收到結構化推送。
 */
export default function WebhookTester() {
  const [form, setForm] = useState({
    webhookUrl: '',
    title: 'CHubb-Man 測試推播',
    description: '這是一則來自儀表板的結構化測試訊息。',
    fields: [{ name: '狀態', value: 'OK' }],
  });
  const [result, setResult] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const send = async () => {
    setResult({ sending: true });
    try {
      const res = await api.testWebhook(form);
      setResult(res);
    } catch (e) {
      setResult({ ok: false, error: e.message });
    }
  };

  return (
    <div className="page">
      <h1>Webhook 測試</h1>
      <p className="muted">即時驗證 Discord 頻道能否正確收到結構化推送。</p>

      <section className="form">
        <label className="field">
          Webhook URL
          <input
            type="url"
            placeholder="https://discord.com/api/webhooks/..."
            value={form.webhookUrl}
            onChange={(e) => set('webhookUrl', e.target.value)}
          />
        </label>
        <label className="field">
          標題
          <input value={form.title} onChange={(e) => set('title', e.target.value)} />
        </label>
        <label className="field">
          描述
          <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} />
        </label>

        <div className="field">
          <span>Fields</span>
          {form.fields.map((f, i) => (
            <div key={i} className="field-row">
              <input
                placeholder="名稱"
                value={f.name}
                onChange={(e) =>
                  set('fields', form.fields.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))
                }
              />
              <input
                placeholder="值"
                value={f.value}
                onChange={(e) =>
                  set('fields', form.fields.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))
                }
              />
              <button
                className="ghost"
                onClick={() => set('fields', form.fields.filter((_, j) => j !== i))}
              >
                移除
              </button>
            </div>
          ))}
          <button className="ghost" onClick={() => set('fields', [...form.fields, { name: '', value: '' }])}>
            + 新增欄位
          </button>
        </div>

        <button className="primary" onClick={send} disabled={result?.sending}>
          發送測試請求
        </button>

        {result && (
          <pre className={`result ${result.ok === false ? 'error' : ''}`}>
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </section>
    </div>
  );
}
