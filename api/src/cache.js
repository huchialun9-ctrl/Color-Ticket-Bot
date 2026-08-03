import { createClient } from 'redis';
import { config } from './config.js';

/**
 * 全域快取同步機制：Redis 短期 TTL 快取。
 * 未設定 REDIS_URL 時退回記憶體 Map（讓骨架可無 Redis 啟動）。
 */
class Cache {
  constructor() {
    this.client = null;
    this.mem = new Map();
  }

  async connect() {
    if (!config.redisUrl) {
      console.warn('[cache] 未設定 REDIS_URL，使用記憶體快取。');
      return;
    }
    try {
      this.client = createClient({ url: config.redisUrl });
      await this.client.connect();
      console.log('[cache] Redis 已連線');
    } catch (err) {
      console.warn('[cache] Redis 連線失敗，退回記憶體快取:', err.message);
      this.client = null;
    }
  }

  async get(key) {
    if (this.client) return this.client.get(key);
    const hit = this.mem.get(key);
    if (!hit) return null;
    if (hit.exp < Date.now()) {
      this.mem.delete(key);
      return null;
    }
    return hit.value;
  }

  async set(key, value, ttlSeconds = config.cacheTtlSeconds) {
    if (this.client) return this.client.set(key, value, { EX: ttlSeconds });
    this.mem.set(key, { value, exp: Date.now() + ttlSeconds * 1000 });
  }
}

export const cache = new Cache();
