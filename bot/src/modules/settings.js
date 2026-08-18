import { config } from '../config.js';
import { Guild } from '../../../api/src/models/Guild.js';
import { isDBReady } from '../db.js';

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
    autoResponses: [],
  },
  logChannelId: null,
  securityWebhookUrl: null,
});

export async function getSettings(guildId) {
  if (cache.has(guildId)) {
    return cache.get(guildId);
  }

  if (isDBReady()) {
    try {
      const doc = await Guild.findOne({ guildId });
      if (doc) {
        const data = doc.toObject();
        if (!data.ticketing) data.ticketing = {};
        if (!data.ticketing.autoResponses) data.ticketing.autoResponses = [];
        cache.set(guildId, data);
        return data;
      }
    } catch (err) {
      console.error(`[settings] 讀取資料庫失敗 (Guild: ${guildId})`, err.message);
    }
  }

  const def = DEFAULTS(guildId);
  cache.set(guildId, def);
  return def;
}

export async function updateSettings(guildId, patch) {
  const current = await getSettings(guildId);
  const next = { ...current, ...patch };
  if (patch.automod) next.automod = { ...current.automod, ...patch.automod };
  if (patch.ticketing) next.ticketing = { ...current.ticketing, ...patch.ticketing };
  
  cache.set(guildId, next);

  if (isDBReady()) {
    try {
      await Guild.findOneAndUpdate(
        { guildId },
        { $set: patch },
        { upsert: true }
      );
    } catch (err) {
      console.error(`[settings] 儲存資料庫失敗 (Guild: ${guildId})`, err.message);
    }
  }
  return next;
}
