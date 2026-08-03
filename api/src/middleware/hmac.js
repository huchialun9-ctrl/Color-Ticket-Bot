import { createHmac, timingSafeEqual } from 'node:crypto';
import { config } from '../config.js';

/**
 * 外部通訊安全簽章（HMAC-SHA256）驗證中介層。
 * 規範見 docs/WEBHOOKS.md：
 *   signature = sha256=<hex( HMAC_SHA256( HMAC_SECRET, `${timestamp}.${method}.${path}.${body}` ) )>
 */
export function verifyHmac(req, res, next) {
  const provided = req.get('x-chubbman-signature') || '';
  const timestamp = Number(req.get('x-chubbman-timestamp'));

  if (!provided.startsWith('sha256=') || !timestamp) {
    return res.status(401).json({ error: 'missing_signature' });
  }

  // 防重放：時戳落差 ≤ 300 秒
  if (Math.abs(Date.now() - timestamp) > 300_000) {
    return res.status(401).json({ error: 'stale_timestamp' });
  }

  const rawBody = Buffer.isBuffer(req.body) ? req.body.toString() : JSON.stringify(req.body ?? {});
  const data = `${timestamp}.${req.method}.${req.originalUrl.split('?')[0]}.${rawBody}`;
  const expected = createHmac('sha256', config.hmacSecret).update(data).digest('hex');

  const a = Buffer.from(provided.slice('sha256='.length));
  const b = Buffer.from(expected);
  const ok = a.length === b.length && timingSafeEqual(a, b);

  if (!ok) return res.status(401).json({ error: 'bad_signature' });
  next();
}
