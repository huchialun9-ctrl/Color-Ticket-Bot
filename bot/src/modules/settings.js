import { config } from '../config.js';

/**
 * Guild 設定讀取。
 * 骨架階段以本地記憶體快取；正式環境可改由 API 同步或 DB。
 * 結構與 api/src/models/Guild.js 對齊。
 */
const cache = new Map();

const DEFAULTS = (guildId) => ({
  guildId,
  automod: {
    enabled: true,
    tokenCapacity: config.automod.tokenCapacity,
    warnThreshold: config.automod.warnThreshold,
    raid: {
      windowMs: config.automod.raidWindowMs,
      threshold: config.automod.raidThreshold,
    },
  },
  ticketing: {
    supportRoleId: null,
    categoryId: null,
    form: null,
  },
  logChannelId: null,
  securityWebhookUrl: null,
});

export async function getSettings(guildId) {
  if (!cache.has(guildId)) {
    cache.set(guildId, DEFAULTS(guildId));
  }
  return cache.get(guildId);
}

export async function updateSettings(guildId, patch) {
  const current = await getSettings(guildId);
  const next = { ...current, ...patch };
  if (patch.automod) next.automod = { ...current.automod, ...patch.automod };
  if (patch.ticketing) next.ticketing = { ...current.ticketing, ...patch.ticketing };
  cache.set(guildId, next);
  return next;
}
