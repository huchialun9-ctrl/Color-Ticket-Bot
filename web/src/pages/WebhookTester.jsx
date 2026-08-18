import { useState } from 'react';
import { api } from '../api.js';

/**
 * Webhook 測試與即時事件發送預覽。
 * 手動輸入訊息並發送測試請求，即時驗證 Discord 頻道是否能收到結構化推送。
 */
export default function WebhookTester() {
  const [form, setForm] = useState({
    webhookUrl: '',
    title: '胖達CHubbMan 測試推播',
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

      <div className="form-builder" style={{ marginTop: '24px' }}>
        {/* 左側：設定表單 */}
        <section style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '24px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
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
            <span style={{ fontWeight: '600', marginBottom: '8px', fontSize: '13px', display: 'block' }}>內嵌欄位 (Fields)</span>
            {form.fields.map((f, i) => (
              <div key={i} className="field-row" style={{ marginBottom: '8px' }}>
                <input
                  placeholder="名稱"
                  value={f.name}
                  onChange={(e) =>
                    set('fields', form.fields.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))
                  }
                  style={{ fontSize: '12px' }}
                />
                <input
                  placeholder="值"
                  value={f.value}
                  onChange={(e) =>
                    set('fields', form.fields.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))
                  }
                  style={{ fontSize: '12px' }}
                />
                <button
                  className="ghost danger"
                  onClick={() => set('fields', form.fields.filter((_, j) => j !== i))}
                  style={{ padding: '6px 10px' }}
                >
                  移除
                </button>
              </div>
            ))}
            <button className="ghost" onClick={() => set('fields', [...form.fields, { name: '', value: '' }])} style={{ alignSelf: 'flex-start', fontSize: '12px' }}>
              + 新增欄位
            </button>
          </div>

          <button className="primary" onClick={send} disabled={result?.sending} style={{ alignSelf: 'flex-start', marginTop: '8px' }}>
            發送測試請求
          </button>

          {result && (
            <pre className={`result ${result.ok === false ? 'error' : ''}`} style={{ marginTop: '16px' }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </section>

        {/* 右側：Discord Embed 實時預覽模擬 */}
        <section className="builder-preview">
          <span style={{ fontWeight: '600', fontSize: '14px', display: 'block', marginBottom: '12px', textAlign: 'left' }}>
            即時預覽 (Discord Webhook Payload Mock)
          </span>
          <div className="modal-mock" style={{ textAlign: 'left' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px' }}>
              <img src="/logo.png" style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#313338' }} alt="" />
              <div>
                <span style={{ fontWeight: '600', color: '#f2f3f5', marginRight: '6px' }}>胖達CHubbMan Webhook</span>
                <span style={{ background: '#5865f2', color: '#fff', fontSize: '10px', padding: '1px 4px', borderRadius: '3px', fontWeight: '600' }}>BOT</span>
              </div>
            </div>

            <div style={{ borderLeft: '4px solid #5865f2', background: '#1e1f22', padding: '12px 16px', borderRadius: '0 4px 4px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {form.title && (
                <div style={{ fontWeight: '700', fontSize: '15px', color: '#ffffff' }}>{form.title}</div>
              )}
              {form.description && (
                <div style={{ fontSize: '13px', color: '#dbdee1', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>{form.description}</div>
              )}
              {form.fields.filter(f => f.name || f.value).length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px', marginTop: '8px' }}>
                  {form.fields.map((f, idx) => (
                    <div key={idx}>
                      <div style={{ fontWeight: '700', fontSize: '12px', color: '#b5bac1', marginBottom: '2px' }}>{f.name || '—'}</div>
                      <div style={{ fontSize: '13px', color: '#dbdee1' }}>{f.value || '—'}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
