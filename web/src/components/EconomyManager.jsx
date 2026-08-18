import { useState, useEffect } from 'react';
import { api } from '../api.js';
import Icon from './Icon.jsx';

export default function EconomyManager({ guildId }) {
  // 盲盒獎項管理狀態
  const [prizes, setPrizes] = useState([]);
  const [prizeId, setPrizeId] = useState('');
  const [prizeName, setPrizeName] = useState('');
  const [prizeRarity, setPrizeRarity] = useState('Common');
  const [prizeRoleRewardId, setPrizeRoleRewardId] = useState('');
  const [prizeWeight, setPrizeWeight] = useState(100);

  // 預測押注局管理狀態
  const [predictions, setPredictions] = useState([]);
  const [predId, setPredId] = useState('');
  const [predTitle, setPredTitle] = useState('');
  const [predOptionsRaw, setPredOptionsRaw] = useState('');

  // 載入資料
  const loadPrizes = async () => {
    try {
      const res = await api.fetchBlindbox(guildId);
      setPrizes(res.list || []);
    } catch (e) {
      console.error('[blindbox] load failed', e);
    }
  };

  const loadPredictions = async () => {
    try {
      const res = await api.fetchPredictions(guildId);
      setPredictions(res.list || []);
    } catch (e) {
      console.error('[predictions] load failed', e);
    }
  };

  useEffect(() => {
    loadPrizes();
    loadPredictions();
  }, [guildId]);

  // 新增或更新盲盒獎品
  const handleSavePrize = async () => {
    if (!prizeId.trim() || !prizeName.trim()) {
      return alert('請填寫獎品 ID 與獎品名稱！');
    }

    try {
      await api.saveBlindbox(guildId, {
        prizeId: prizeId.trim(),
        name: prizeName.trim(),
        rarity: prizeRarity,
        roleRewardId: prizeRoleRewardId.trim() || null,
        weight: Number(prizeWeight) || 100
      });
      setPrizeId('');
      setPrizeName('');
      setPrizeRoleRewardId('');
      setPrizeWeight(100);
      await loadPrizes();
      alert('已成功新增/更新盲盒獎品項目！');
    } catch (e) {
      alert(`儲存失敗：${e.message}`);
    }
  };

  // 刪除盲盒獎品
  const handleDeletePrize = async (pid) => {
    if (!confirm('確認要刪除此盲盒獎品項目？')) return;
    try {
      await api.deleteBlindbox(guildId, pid);
      await loadPrizes();
    } catch (e) {
      alert(`刪除失敗：${e.message}`);
    }
  };

  // 建立新預測局
  const handleCreatePrediction = async () => {
    if (!predId.trim() || !predTitle.trim() || !predOptionsRaw.trim()) {
      return alert('請填寫預測局 ID、主題以及押注選項！');
    }

    const options = predOptionsRaw
      .split(',')
      .map((o) => o.trim())
      .filter((o) => o.length > 0);

    if (options.length < 2) {
      return alert('請設定至少 2 個選項！');
    }

    try {
      await api.createPrediction(guildId, {
        predictionId: predId.trim(),
        title: predTitle.trim(),
        options
      });
      setPredId('');
      setPredTitle('');
      setPredOptionsRaw('');
      await loadPredictions();
      alert('已成功發布新的預測押注局！');
    } catch (e) {
      alert(`發布失敗：${e.message}`);
    }
  };

  // 結算預測局
  const handleResolvePrediction = async (pid, winnerIdx) => {
    if (!confirm(`確認要以第 ${winnerIdx + 1} 個選項進行結算並發放彩金？此操作不可逆！`)) return;
    try {
      await api.resolvePrediction(guildId, pid, { winnerIndex: winnerIdx });
      await loadPredictions();
      alert('已成功結算該預測局並自動發放代幣予勝出玩家！');
    } catch (e) {
      alert(`結算失敗：${e.message}`);
    }
  };

  return (
    <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* 區塊一：盲盒獎品項目設定 */}
      <section style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '20px', borderRadius: '8px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Icon name="puzzle" size={16} /> 盲盒抽獎獎池配置
        </h3>
        <p className="muted" style={{ marginBottom: '16px' }}>自訂成員輸入 `/blindbox` 抽獎時可獲得的內容、稀有度與中獎機率。抽中亦可自動給予 Discord 身份組。</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* 左側：設定表單 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label className="field">
              獎品唯一 ID (代碼)
              <input
                value={prizeId}
                onChange={(e) => setPrizeId(e.target.value)}
                placeholder="例如: legendary-diamond-role"
              />
            </label>

            <label className="field">
              獎品名稱 (展示用)
              <input
                value={prizeName}
                onChange={(e) => setPrizeName(e.target.value)}
                placeholder="例如: 🏆 至尊鑽石會員"
              />
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <label className="field">
                稀有度 (Rarity)
                <select value={prizeRarity} onChange={(e) => setPrizeRarity(e.target.value)}>
                  <option value="Common">普通 (Common)</option>
                  <option value="Rare">優秀 (Rare)</option>
                  <option value="Epic">史詩 (Epic)</option>
                  <option value="Legendary">傳奇 (Legendary)</option>
                </select>
              </label>

              <label className="field">
                隨機權重 (中獎機率)
                <input
                  type="number"
                  value={prizeWeight}
                  onChange={(e) => setPrizeWeight(Number(e.target.value))}
                  placeholder="預設: 100"
                />
              </label>
            </div>

            <label className="field">
              給予身份組 ID (中獎後自動指派，非必填)
              <input
                value={prizeRoleRewardId}
                onChange={(e) => setPrizeRoleRewardId(e.target.value)}
                placeholder="輸入 Discord 身分組 ID"
              />
            </label>

            <button className="primary" onClick={handleSavePrize} style={{ alignSelf: 'flex-start' }}>
              <Icon name="check" size={15} /> 儲存品項
            </button>
          </div>

          {/* 右側：目前獎池 */}
          <div style={{ background: 'var(--code-bg)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>目前盲盒內容物列表</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto' }}>
              {prizes.map((item) => (
                <div key={item.prizeId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--card)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '12px' }}>
                  <div>
                    <strong>{item.name}</strong> <span className={`badge badge-${item.rarity.toLowerCase()}`} style={{ fontSize: '10px' }}>{item.rarity}</span>
                    <div className="muted" style={{ fontSize: '10px', marginTop: '2px' }}>權重: {item.weight} | 身分組: {item.roleRewardId || '無'}</div>
                  </div>
                  <button className="ghost danger" onClick={() => handleDeletePrize(item.prizeId)} style={{ padding: '4px' }}>
                    <Icon name="close" size={13} />
                  </button>
                </div>
              ))}
              {prizes.length === 0 && (
                <div className="muted" style={{ fontSize: '12px', padding: '10px', textAlign: 'center' }}>尚未配置任何盲盒獎品項目</div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 區塊二：社群趣味預測局管理 */}
      <section style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '20px', borderRadius: '8px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Icon name="chart" size={16} /> 社群趣味預測押注局
        </h3>
        <p className="muted" style={{ marginBottom: '16px' }}>發起社群預測局，讓成員投入代幣押注不同選項，並在結算後依比例自動分彩。</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '20px' }}>
          {/* 左側：建立預測局 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600' }}>建立新的預測活動</span>

            <label className="field">
              預測局 ID (自訂唯一代碼)
              <input
                value={predId}
                onChange={(e) => setPredId(e.target.value)}
                placeholder="例如: match-2026"
              />
            </label>

            <label className="field">
              預測主題
              <input
                value={predTitle}
                onChange={(e) => setPredTitle(e.target.value)}
                placeholder="例如: 本週總決賽誰會奪冠？"
              />
            </label>

            <label className="field">
              選項清單 (以半形逗號區隔)
              <input
                value={predOptionsRaw}
                onChange={(e) => setPredOptionsRaw(e.target.value)}
                placeholder="例如: A 隊, B 隊, 兩隊平手"
              />
            </label>

            <button className="primary" onClick={handleCreatePrediction} style={{ alignSelf: 'flex-start' }}>
              + 發布預測局
            </button>
          </div>

          {/* 右側：管理/結算進行中的預測 */}
          <div style={{ background: 'var(--code-bg)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>管理預測活動（結算派彩）</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto' }}>
              {predictions.map((p) => {
                const totalBetsAmount = (p.bets || []).reduce((acc, b) => acc + (b.amount || 0), 0);
                const options = p.options || [];
                return (
                  <div key={p.predictionId} style={{ background: 'var(--card)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <strong>{p.title}</strong>
                      <span className={`badge badge-${p.status === 'pending' ? 'open' : 'closed'}`}>
                        {p.status === 'pending' ? '進行中' : '已結算'}
                      </span>
                    </div>
                    <div className="muted" style={{ marginBottom: '8px' }}>ID: {p.predictionId} | 總投注額: {totalBetsAmount} 代幣</div>

                    {p.status === 'pending' ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                        {options.map((opt, idx) => {
                          const optionBets = (p.bets || []).filter((b) => b.optionIndex === idx);
                          const optionTotal = optionBets.reduce((acc, b) => acc + (b.amount || 0), 0);
                          return (
                            <button
                              key={idx}
                              className="ghost"
                              onClick={() => handleResolvePrediction(p.predictionId, idx)}
                              style={{ padding: '4px 8px', fontSize: '11px' }}
                            >
                              🏆 設為贏家: {opt} ({optionTotal} 代幣)
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="muted" style={{ fontSize: '11px' }}>
                        獲勝選項：【**{options[p.winnerIndex] ?? '未知'}**】
                      </div>
                    )}
                  </div>
                );
              })}
              {predictions.length === 0 && (
                <div className="muted" style={{ fontSize: '12px', padding: '10px', textAlign: 'center' }}>目前無任何發布的預測活動</div>
              )}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
