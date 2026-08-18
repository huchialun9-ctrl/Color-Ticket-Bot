import { useState } from 'react';
import { api } from '../api.js';
import Icon from './Icon.jsx';
import ChannelSelect from './ChannelSelect.jsx';
import RoleSelect from './RoleSelect.jsx';
import InfoBadge from './InfoBadge.jsx';

export default function RolePanelManager({ guildId, channels = [], serverRoles = [] }) {
  const [channelId, setChannelId] = useState('');
  const [title, setTitle] = useState('身分組自助領取中心');
  const [description, setDescription] = useState('點選下方按鈕即可領取或移除對應的身分組。');
  const [roles, setRoles] = useState([{ roleId: '', label: '', style: '1' }]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const addRoleRow = () => {
    setRoles([...roles, { roleId: '', label: '', style: '1' }]);
  };

  const removeRoleRow = (idx) => {
    setRoles(roles.filter((_, i) => i !== idx));
  };

  const handleRoleChange = (idx, field, val) => {
    const next = [...roles];
    next[idx][field] = val;
    setRoles(next);
  };

  const handleDeploy = async () => {
    const filteredRoles = roles.filter((r) => r.roleId.trim() && r.label.trim());
    if (!channelId) return alert('請選擇要部署的頻道！');
    if (filteredRoles.length === 0) return alert('請填寫至少一個身分組按鈕設定！');

    setLoading(true);
    try {
      await api.deployRolesPanel(guildId, {
        channelId,
        title,
        description,
        roles: filteredRoles
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (e) {
      alert(`部署失敗：${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ textAlign: 'left' }}>
      <div className="table-toolbar">
        <div>
          <h3>自定義身分組領取面板</h3>
          <p className="muted">設定按鈕面板並部署至指定頻道，用戶可透過點擊按鈕自行領取或卸載對應的身分組。</p>
        </div>
      </div>

      <div className="form-builder" style={{ marginTop: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="field">
            <span style={{ display: 'flex', alignItems: 'center' }}>
              目標發布頻道
              <InfoBadge text="面板將會發送到此頻道，建議選擇公開、唯讀的頻道。" />
            </span>
            <ChannelSelect
              value={channelId}
              onChange={setChannelId}
              channels={channels}
              placeholder="-- 選擇頻道 --"
            />
          </div>

          <label className="field">
            面板標題
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：身分組領取中心"
            />
          </label>

          <label className="field">
            面板描述
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="點擊下方按鈕領取你的身分組..."
              rows={3}
            />
          </label>
        </div>

        <div style={{ background: 'var(--code-bg)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontWeight: '600', fontSize: '14px' }}>按鈕與身分組規則</span>
            <button className="ghost" onClick={addRoleRow} style={{ padding: '4px 8px', fontSize: '12px' }}>
              <Icon name="plus" size={13} /> 新增按鈕
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '450px', overflowY: 'auto', paddingRight: '4px' }}>
            {roles.map((r, idx) => (
              <div key={idx} style={{ background: 'var(--card)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  <span style={{ fontWeight: '600', fontSize: '13px', color: 'var(--muted)' }}>按鈕設定 #{idx + 1}</span>
                  <button
                    className="ghost danger"
                    onClick={() => removeRoleRow(idx)}
                    style={{ padding: '4px' }}
                    title="刪除此按鈕"
                  >
                    <Icon name="close" size={14} />
                  </button>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', flexWrap: 'wrap' }}>
                  <div className="field">
                    <span style={{ display: 'flex', alignItems: 'center' }}>
                      對應身分組
                      <InfoBadge text="使用者點擊後會獲得此身分組。\n注意：請確保 Bot 的身分組排序『高於』此身分組，否則 Bot 將無權限給予該身分！" />
                    </span>
                    <RoleSelect
                      value={r.roleId}
                      onChange={(val) => handleRoleChange(idx, 'roleId', val)}
                      roles={serverRoles}
                      placeholder="選擇身分組"
                    />
                  </div>
                  <div className="field">
                    <span>按鈕文字標籤</span>
                    <input
                      placeholder="例如：領取男生成員組"
                      value={r.label}
                      onChange={(e) => handleRoleChange(idx, 'label', e.target.value)}
                      style={{ padding: '10px 14px' }}
                    />
                  </div>
                </div>

                <div className="field">
                  <span>按鈕樣式顏色</span>
                  <select
                    value={r.style}
                    onChange={(e) => handleRoleChange(idx, 'style', e.target.value)}
                  >
                    <option value="1">🔵 藍色 (主要配色)</option>
                    <option value="2">🔘 灰色 (次要配色)</option>
                    <option value="3">🟢 綠色 (成功狀態)</option>
                    <option value="4">🔴 紅色 (危險狀態)</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
        <button className="primary" disabled={loading} onClick={handleDeploy}>
          <Icon name="check" size={15} /> {loading ? '部署中…' : success ? '部署成功！' : '發送按鈕面版'}
        </button>
      </div>
    </div>
  );
}
