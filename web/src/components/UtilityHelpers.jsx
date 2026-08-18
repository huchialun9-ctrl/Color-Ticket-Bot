import { useState, useEffect } from 'react';
import { api } from '../api.js';
import Icon from './Icon.jsx';
import ChannelSelect from './ChannelSelect.jsx';
import RoleSelect from './RoleSelect.jsx';

export default function UtilityHelpers({ guildId, channels = [], settings = null, onSettingsUpdate = () => {}, serverRoles = [] }) {


  // 身分組互斥狀態
  const [exclusions, setExclusions] = useState([]);
  const [roleInput1, setRoleInput1] = useState('');
  const [roleInput2, setRoleInput2] = useState('');

  // 邀請連結統計狀態
  const [inviteStats, setInviteStats] = useState([]);

  // 設定備份匯出與匯入功能
  const handleExport = () => {
    if (!settings) return alert('尚未加載設定！');
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(settings, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `panda-settings-${guildId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (confirm('⚠️ 警告：此操作將會完全覆蓋此伺服器的所有工單、自動回覆、歡迎卡片、互斥身分組等設定，確定要匯入嗎？')) {
          const res = await api.saveSettings(guildId, parsed);
          onSettingsUpdate(res.settings);
          alert('✅ 設定已成功匯入與還原！');
        }
      } catch (err) {
        alert(`❌ 解析設定檔失敗，請確認是否為正確的 JSON 格式：${err.message}`);
      }
    };
    reader.readAsText(file);
  };



  const loadExclusions = async () => {
    try {
      const res = await api.fetchExclusions(guildId);
      setExclusions(res.exclusions || []);
    } catch (e) {
      console.error('[exclusions] load failed', e);
    }
  };

  const loadInviteStats = async () => {
    try {
      const res = await api.fetchInviteStats(guildId);
      setInviteStats(res.invites || []);
    } catch (e) {
      console.error('[invites] load failed', e);
    }
  };

  useEffect(() => {
    loadExclusions();
    loadInviteStats();
  }, [guildId]);



  // 新增互斥身分組
  const handleAddExclusion = async () => {
    if (!roleInput1.trim() || !roleInput2.trim()) {
      return alert('請填寫欲設定為互斥的兩個身分組 ID！');
    }

    try {
      await api.addExclusion(guildId, {
        roleIds: [roleInput1.trim(), roleInput2.trim()]
      });
      setRoleInput1('');
      setRoleInput2('');
      await loadExclusions();
      alert('已成功設定身分組互斥鎖規則！');
    } catch (e) {
      alert(`新增互斥失敗：${e.message}`);
    }
  };

  // 刪除互斥規則
  const handleDeleteExclusion = async (id) => {
    if (!confirm('確認要解除此身分組互斥規則？')) return;
    try {
      await api.deleteExclusion(guildId, id);
      await loadExclusions();
    } catch (e) {
      alert(`解除失敗：${e.message}`);
    }
  };

  return (
    <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      


      {/* 區塊二：身分組互斥鎖 (Role Mutual Exclusion) */}
      <section style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '20px', borderRadius: '8px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Icon name="lock" size={16} /> 身分組互斥規則鎖
        </h3>
        <p className="muted" style={{ marginBottom: '16px' }}>設定互斥身分組（如: 男/女、新手/老手）。當用戶被授予其中之一時，系統會自動卸載相衝突的另一個身分組。</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* 新增互斥規則 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600' }}>建立新的互斥對</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="field">
                <span>身分組 甲</span>
                <RoleSelect
                  value={roleInput1}
                  onChange={setRoleInput1}
                  roles={serverRoles}
                  placeholder="選擇第一個身分組"
                />
              </div>
              <div className="field">
                <span>身分組 乙 (與甲互斥)</span>
                <RoleSelect
                  value={roleInput2}
                  onChange={setRoleInput2}
                  roles={serverRoles}
                  placeholder="選擇第二個身分組"
                />
              </div>
            </div>
            <button className="primary" onClick={handleAddExclusion} style={{ alignSelf: 'flex-start' }}>
              + 設定互斥鎖
            </button>
          </div>

          {/* 目前互斥規則清單 */}
          <div style={{ background: 'var(--code-bg)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>已啟用的互斥鎖清單</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto' }}>
              {exclusions.map((item) => (
                <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--card)', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '12px' }}>
                  <span>
                    身分組 <code className="code">{item.roleIds[0]}</code> 🔀 <code className="code">{item.roleIds[1]}</code>
                  </span>
                  <button className="ghost danger" onClick={() => handleDeleteExclusion(item._id)} style={{ padding: '2px' }}>
                    <Icon name="close" size={13} />
                  </button>
                </div>
              ))}
              {exclusions.length === 0 && (
                <div className="muted" style={{ fontSize: '12px', padding: '10px', textAlign: 'center' }}>目前無設定身分組互斥鎖</div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 區塊三：邀請人與推廣渠道追蹤 (Invite Link Tracker) */}
      <section style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '20px', borderRadius: '8px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Icon name="chart" size={16} /> 邀請人連結與推廣渠道追蹤
        </h3>
        <p className="muted" style={{ marginBottom: '16px' }}>實時統計伺服器各邀請連結的使用數，輕鬆掌握推廣渠道成效與主要邀請貢獻者。</p>

        <div style={{ background: 'var(--code-bg)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border)' }}>
          <table className="table" style={{ width: '100%', fontSize: '13px' }}>
            <thead>
              <tr>
                <th>邀請碼 (Code)</th>
                <th>建立/邀請者 ID</th>
                <th style={{ textAlign: 'right' }}>累計加入人數 (Uses)</th>
              </tr>
            </thead>
            <tbody>
              {inviteStats.map((item) => (
                <tr key={item.code} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td>
                    <code className="code" style={{ color: 'var(--accent)' }}>{item.code}</code>
                  </td>
                  <td>
                    <span className="code">{item.inviterId || '伺服器預設/系統'}</span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                    {item.uses} 人
                  </td>
                </tr>
              ))}
              {inviteStats.length === 0 && (
                <tr>
                  <td colSpan={3} className="empty" style={{ background: 'var(--card)' }}>
                    目前尚無邀請連結被使用記錄
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 區塊四：一鍵匯出與備份設定 (Backup & Settings Transfer) */}
      <section style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '20px', borderRadius: '8px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Icon name="server" size={16} /> 胖達系統設定備份與導入
        </h3>
        <p className="muted" style={{ marginBottom: '16px' }}>將目前伺服器的所有工單表單、自動回覆規則、黑名單防護等設定匯出備份，或從檔案導入還原。</p>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button className="primary" onClick={handleExport}>
            <Icon name="arrowDown" size={14} style={{ transform: 'rotate(180deg)' }} /> 匯出設定為 JSON
          </button>
          
          <label className="invite-btn" style={{ background: 'var(--code-bg)', color: 'var(--fg)', border: '1px solid var(--border)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '8px 14px', borderRadius: '6px' }}>
            <Icon name="plus" size={14} /> 導入設定備份 (.json)
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </section>

    </div>
  );
}
