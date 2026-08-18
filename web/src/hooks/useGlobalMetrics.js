import { useEffect, useState, useCallback } from 'react';
import { api, UnauthorizedError } from '../api.js';

/**
 * 即時數據動態跳動計數器：
 * 每 30 秒輪詢全域數據，數字以平滑滾動呈現。
 * enabled=false（尚未登入）時不發送任何請求，避免 401 → 整頁重載的無限迴圈。
 */
export default function useGlobalMetrics(enabled = true) {
  const [metrics, setMetrics] = useState(null);
  const [status, setStatus] = useState(enabled ? 'connecting' : 'offline');

  const refresh = useCallback(async () => {
    try {
      const data = await api.globalMetrics();
      setMetrics(data);
      setStatus('online');
    } catch (err) {
      // 未授權就停止輪詢，交給登入流程處理
      if (err instanceof UnauthorizedError) {
        setStatus('unauthorized');
        return;
      }
      setStatus('offline');
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    refresh();
    const timer = setInterval(refresh, 30_000);
    return () => clearInterval(timer);
  }, [enabled, refresh]);

  return { metrics, status, refresh };
}
