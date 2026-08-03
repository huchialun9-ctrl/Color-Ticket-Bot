import { cache } from '../cache.js';
import { isDBReady } from '../db.js';
import { Guild } from '../models/Guild.js';
import { Warn } from '../models/Warn.js';
import { Ticket } from '../models/Ticket.js';
import { GlobalStat } from '../models/GlobalStat.js';
import { config } from '../config.js';

/**
 * 全域數據即時看板。
 * 優先讀取 Redis TTL 快取（30 秒），未命中則聚合 DB；DB 未連線時退回 Bot 推送的記憶體值。
 */
const memStats = {
  guildCount: 0,
  totalUsers: 0,
  bannedTotal: 0,
  violationsToday: 0,
  raidTriggers: 0,
  ticketsTotal: 0,
  ticketsOpen: 0,
};

export async function getGlobalMetrics() {
  const cached = await cache.get('metrics:global');
  if (cached) return JSON.parse(cached);

  const stats = await computeMetrics();
  await cache.set('metrics:global', JSON.stringify(stats), config.cacheTtlSeconds);
  return stats;
}

async function computeMetrics() {
  if (!isDBReady()) return { ...memStats, source: 'memory' };

  const today = new Date().toISOString().slice(0, 10);
  const [guildCount, totalUsers, bannedTotal, violationsToday, raidTriggers, ticketsTotal, ticketsOpen] =
    await Promise.all([
      Guild.countDocuments(),
      Guild.aggregate([{ $group: { _id: null, total: { $sum: '$memberCount' } } }]),
      Warn.countDocuments({ action: 'ban' }),
      GlobalStat.findOne({ date: today }).then((s) => s?.violationsToday ?? 0),
      GlobalStat.findOne({ date: today }).then((s) => s?.raidTriggers ?? 0),
      Ticket.countDocuments({ status: { $in: ['closed', 'archived'] } }),
      Ticket.countDocuments({ status: 'open' }),
    ]);

  return {
    guildCount,
    totalUsers: totalUsers[0]?.total ?? 0,
    bannedTotal,
    violationsToday,
    raidTriggers,
    ticketsTotal,
    ticketsOpen,
    source: 'database',
  };
}

/** Bot 內部事件推送時累加記憶體計數 */
export function recordEvent(type) {
  if (type === 'security_alert') memStats.raidTriggers += 1;
  if (type === 'audit' || type === 'violation') memStats.violationsToday += 1;
  if (type === 'ticket_created') {
    memStats.ticketsTotal += 1;
    memStats.ticketsOpen += 1;
  }
  if (type === 'ticket_closed') {
    memStats.ticketsOpen = Math.max(0, memStats.ticketsOpen - 1);
  }
}
