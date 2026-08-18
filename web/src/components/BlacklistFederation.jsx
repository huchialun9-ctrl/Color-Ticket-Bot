import { useState, useEffect } from 'react';
import { api } from '../api.js';
import Icon from './Icon.jsx';

export default function BlacklistFederation({ guildId }) {
  const [list, setList] = useState([]);
  const [userId, setUserId] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const loadBlacklist = async () => {
    try {
      const res = await api.fetchBlacklist();
      setList(res.list || []);
    } catch (e) {
      console.error('[blacklist] load failed', e);
    }
  };

  useEffect(() => {
    loadBlacklist();
  }, []);

  const handleAdd = async () => {
    if (!userId.trim()) return alert('請輸入要封鎖的成員 Discord ID！');
    if (!reason.trim()) return alert('請輸入封鎖原因！');

    setLoading(true);
    try {
      await api.addBlacklist({
        userId: userId.trim(),
        reason: reason.trim(),
        bannedByGuildId: guildId
      });
      setUserId('');
      setReason('');
      await loadBlacklist();
      alert('已成功將該用戶列入全域聯防黑名單！');
    } catch (e) {
      alert(`新增失敗：${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (uid) => {
    if (!confirm('確認要將此成員移出全域聯防黑名單？')) return;
    try {
      await api.deleteBlacklist(uid);
      await loadBlacklist();
    } catch (e) {
      alert(`移除失敗：${e.message}`);
    }
  };

  return (
    <div style={{ textAlign: 'left' }}>
      <div className="table-toolbar">
        <div>
          <h3>全域成員黑名單聯防系統</h3>
          <p className="muted">聯防伺服器共享黑名單網絡。當黑名單內的成員加入您的伺服器時，系統將會秒級自動踢除並發送安全警報。</p>
        </div>
      </div>

      <div className="form-builder" style={{ marginTop: '20px' }}>
        {/* 左側：提報黑名單 */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '20px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <span style={{ fontWeight: '600', fontSize: '14px' }}>提報惡意成員至全域聯防</span>

          <label className="field">
            成員 Discord ID
            <input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="例如: 1533040341014417491"
            />
          </label>

          <label className="field">
            違規判定原因
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="例如: 惡意爆破/發送大量垃圾詐騙 Nitro 連結..."
              rows={3}
            />
          </label>

          <button className="primary danger" disabled={loading} onClick={handleAdd} style={{ alignSelf: 'flex-start' }}>
            <Icon name="close" size={15} /> 提報並封鎖
          </button>
        </div>

        {/* 右側：黑名單清單 */}
        <div style={{ background: 'var(--code-bg)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <span style={{ fontWeight: '600', fontSize: '14px', display: 'block', marginBottom: '12px' }}>全域聯防黑名單清單</span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto' }}>
            {list.map((item) => (
              <div key={item.userId} style={{ background: 'var(--card)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontSize: '13px', lineHeight: '1.4', textAlign: 'left' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                    <span className="badge badge-closed" style={{ background: '#ff4757', color: '#fff' }}>聯防封鎖</span>
                    <span className="code" style={{ fontSize: '12px' }}>ID: {item.userId}</span>
                  </div>
                  <p style={{ margin: '4px 0', color: 'var(--fg)' }}><strong>原因:</strong> {item.reason}</p>
                  <span className="muted" style={{ fontSize: '11px' }}>來源伺服器: {item.bannedByGuildId}</span>
                </div>
                <button
                  className="ghost danger"
                  onClick={() => handleRemove(item.userId)}
                  style={{ padding: '6px' }}
                  title="解除聯防"
                >
                  <Icon name="close" size={14} />
                </button>
              </div>
            ))}

            {list.length === 0 && (
              <div className="empty" style={{ background: 'var(--card)' }}>
                目前聯防網絡上沒有任何被提報的黑名單帳號
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
