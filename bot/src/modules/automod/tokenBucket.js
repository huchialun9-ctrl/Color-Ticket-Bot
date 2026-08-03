/**
 * 權杖桶演算法（Token Bucket）滑動視窗防洗版。
 *
 * 每位用戶在每個 guild 擁有權杖池：
 *   tokens   = min(capacity, tokens + elapsed * refillRate)
 *   cost     = 1 + 加權（長訊息/附件/提及）
 *   tokens < cost → 攔截
 */
class TokenBucket {
  constructor() {
    /** key: `${guildId}:${userId}` → { tokens, lastRefill } */
    this.buckets = new Map();
    this.violations = new Map();
  }

  /** 計算訊息成本：長訊息、附件、提及加權 */
  costOf(message) {
    let cost = 1;
    if (message.content && message.content.length > 150) cost += 1;
    if (message.attachments?.size > 0) cost += 2;
    if (message.mentions?.users?.size > 0) cost += message.mentions.users.size;
    return cost;
  }

  /**
   * @returns {{ blocked: boolean, reason?: string, timeoutMs?: number }}
   */
  check(guildId, userId, message, automod) {
    const cfg = { capacity: 8, refillRate: 8 / 60, ...automod };
    const key = `${guildId}:${userId}`;
    const now = Date.now();
    const bucket = this.buckets.get(key) || { tokens: cfg.capacity, lastRefill: now };

    const elapsedSec = Math.max(0, (now - bucket.lastRefill) / 1000);
    bucket.tokens = Math.min(cfg.capacity, bucket.tokens + elapsedSec * cfg.refillRate);
    bucket.lastRefill = now;

    const cost = this.costOf(message);

    if (bucket.tokens < cost) {
      const count = (this.violations.get(key) || 0) + 1;
      this.violations.set(key, count);
      return {
        blocked: true,
        reason: `權杖不足 (${Math.max(0, bucket.tokens).toFixed(2)} / ${cost})，違規累計 ${count}`,
        // Exponential backoff：1 分鐘 → 5 → 30 → 360（上限 6 小時）
        timeoutMs: Math.min(Math.pow(5, count - 1) * 60_000, 6 * 3600_000),
      };
    }

    bucket.tokens -= cost;
    this.buckets.set(key, bucket);
    return { blocked: false };
  }
}

export const tokenBucket = new TokenBucket();
