import { createHmac } from 'node:crypto';
import { config } from '../../config.js';

/**
 * 與 api/ 之間的外部通訊安全簽章（HMAC-SHA256）。
 * 規範見 docs/WEBHOOKS.md：
 *   signature = hex( HMAC_SHA256( HMAC_SECRET, `${timestamp}.${method}.${path}.${body}` ) )
 */
function sign(timestamp, method, path, body) {
  const data = `${timestamp}.${method}.${path}.${body ?? ''}`;
  return createHmac('sha256', config.hmacSecret).update(data).digest('hex');
}

async function send(method, path, payload) {
  if (!config.hmacSecret) return; // 未設定則靜默跳過
  const timestamp = Date.now();
  const body = JSON.stringify(payload);
  const signature = sign(timestamp, method, path, body);

  const res = await fetch(`${config.apiBaseUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Chubbman-Signature': `sha256=${signature}`,
      'X-Chubbman-Timestamp': String(timestamp),
    },
    body,
  });
  if (!res.ok) {
    throw new Error(`API ${method} ${path} → ${res.status}`);
  }
  return res.json();
}

/** 審查日誌 / 緊急警報推送 */
export function webhookPush(kind, payload) {
  return send('POST', `/api/internal/${kind}`, payload);
}

/** 緊急安全警報（Anti-Raid） */
export function pushSecurityAlert(guild, metric) {
  return webhookPush('security_alert', {
    type: 'security_alert',
    guild: { id: guild.id, name: guild.name },
    triggeredAt: new Date().toISOString(),
    metric,
    actionTaken: ['verification_gate'],
  });
}

/** 啟動/加入伺服器時同步 guild 快照（feeding 全域看板） */
export async function pushGuildSnapshot(guilds) {
  return send('POST', '/api/internal/guild_sync', {
    guilds: guilds.map((g) => ({
      id: g.id,
      name: g.name,
      icon: g.icon ?? null,
      memberCount: g.memberCount ?? 0,
    })),
  });
}
