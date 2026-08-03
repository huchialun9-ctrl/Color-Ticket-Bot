import { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';

/**
 * 專業插件發佈中心：
 * 上傳 zip → Smart File Scan 自動解析 → 狀態追蹤 → 論壇貼文格式一鍵生成與複製。
 */
export default function PluginCenter() {
  const [guildId, setGuildId] = useState('');
  const [guilds, setGuilds] = useState([]);
  const [plugins, setPlugins] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [copied, setCopied] = useState(null);
  const [composing, setComposing] = useState(null);
  const [features, setFeatures] = useState('');
  const [commands, setCommands] = useState('');
  const fileRef = useRef();

  useEffect(() => {
    api.guilds().then((d) => setGuilds(d.guilds)).catch(() => {});
  }, []);

  const loadPlugins = async (id) => {
    setGuildId(id);
    if (!id) return setPlugins([]);
    api.plugins(id).then((d) => setPlugins(d.plugins)).catch(() => setPlugins([]));
  };

  const upload = async (file) => {
    if (!guildId) return alert('請先選擇伺服器');
    setScanning(true);
    const result = await api.uploadPlugin(guildId, file);
    setScanning(false);
    if (result.error) return alert(`上傳失敗：${result.error}`);
    await loadPlugins(guildId);
    fileRef.current.value = '';
  };

  const buildForumPost = (p) => {
    const feat = features
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => (l.startsWith('-') ? l : `- ${l}`))
      .join('\n');
    const cmd = commands.trim();
    return [
      `# ${p.name} v${p.version}`,
      '',
      `> ${p.description || '（無描述）'}`,
      '',
      `**作者**: ${p.author || '匿名'}｜**適用環境**: \`${p.runtime}\``,
      feat && `\n### 功能特性\n${feat}`,
      cmd && `\n### 指令說明\n\`\`\`\n${cmd}\n\`\`\``,
      '\n### 安裝',
      '1. 在插件發佈中心下載 .zip',
      '2. 放入 `bot/plugins/` 並執行 `/plugin reload ' + p.name + '`',
      '3. 完成！',
    ]
      .filter(Boolean)
      .join('\n');
  };

  const copyPost = async (p) => {
    await navigator.clipboard.writeText(buildForumPost(p));
    setCopied(p._id);
    setTimeout(() => setCopied(null), 1500);
  };

  const openCompose = (p) => {
    setComposing(p);
    setFeatures('');
    setCommands('');
  };

  return (
    <div className="page">
      <h1>插件發佈中心</h1>
      <label className="field">
        選擇伺服器
        <select value={guildId} onChange={(e) => loadPlugins(e.target.value)}>
          <option value="">—</option>
          {guilds.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </label>

      <section className="upload-box">
        <h3>上傳插件（.zip）</h3>
        <p className="muted">後端會自動解析 package.json / manifest.json 帶入名稱、版本與描述。</p>
        <input
          ref={fileRef}
          type="file"
          accept=".zip"
          disabled={scanning}
          onChange={(e) => e.target.files[0] && upload(e.target.files[0])}
        />
        {scanning && <div className="loading">Smart File Scan 掃描中…</div>}
      </section>

      <section className="table-section">
        <h3>版本發佈狀態</h3>
        <table className="ticket-table">
          <thead>
            <tr><th>名稱</th><th>版本</th><th>狀態</th><th>描述</th><th>動作</th></tr>
          </thead>
          <tbody>
            {plugins.map((p) => (
              <tr key={p._id}>
                <td><strong>{p.name}</strong></td>
                <td>v{p.version}</td>
                <td><span className={`badge badge-${p.status}`}>{p.status}</span></td>
                <td className="muted">{p.description || '—'}</td>
                <td>
                  <button onClick={() => openCompose(p)}>生成論壇貼文</button>
                </td>
              </tr>
            ))}
            {plugins.length === 0 && (
              <tr><td colSpan={5} className="empty">尚未上傳插件</td></tr>
            )}
          </tbody>
        </table>
      </section>

      {composing && (
        <section className="compose-box">
          <div className="table-toolbar">
            <h3>論壇貼文編輯器 — {composing.name} v{composing.version}</h3>
            <button className="ghost" onClick={() => setComposing(null)}>關閉</button>
          </div>
          <div className="grid-2col">
            <div className="card-block">
              <label className="field">
                功能特性（每行一項）
                <textarea
                  rows={4}
                  value={features}
                  placeholder={'- 自動審查\n- 防爆破鎖定\n- 票務管理'}
                  onChange={(e) => setFeatures(e.target.value)}
                />
              </label>
              <label className="field">
                指令說明
                <textarea
                  rows={4}
                  value={commands}
                  placeholder={'/plugin list\n/plugin reload <name>'}
                  onChange={(e) => setCommands(e.target.value)}
                />
              </label>
            </div>
            <div className="card-block">
              <h3>預覽</h3>
              <pre className="post-preview">{buildForumPost(composing)}</pre>
              <button className="primary" onClick={() => copyPost(composing)}>
                {copied === composing._id ? '已複製' : '一鍵複製貼文'}
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
