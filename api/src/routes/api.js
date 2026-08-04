import { Router } from 'express';
import { requireAuth, discordFetch, isGuildAdmin } from '../middleware/auth.js';
import { requireDB } from '../middleware/db.js';
import { getGlobalMetrics } from '../services/metrics.js';
import { Guild } from '../models/Guild.js';
import { Ticket } from '../models/Ticket.js';
import { Warn } from '../models/Warn.js';
import { cache } from '../cache.js';

export const apiRouter = Router();
apiRouter.use(requireAuth);

const DEFAULT_GUILDS_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const GUILDS_CACHE_TTL = Number(process.env.GUILDS_CACHE_TTL_MS || DEFAULT_GUILDS_CACHE_TTL_MS);

/** 全域數據即時看板（DB 未連線時自動退回記憶體模式） */
apiRouter.get('/metrics/global', async (_req, res) => {
  res.json(await getGlobalMetrics());
});

/** Single helper: try bot-first member check if BOT_TOKEN available */
async function checkGuildAdminWithBot(guildId, userId) {
  if (!process.env.BOT_TOKEN) return null;
  try {
    const member = await discordFetch(`/guilds/${guildId}/members/${userId}`, process.env.BOT_TOKEN);
    return member;
  } catch (err) {
    console.warn('[bot-first] bot member check failed', { guildId, userId, err: err.message ?? err });
    return null;
  }
}

/** 單一伺服器控制台 */
apiRouter.get('/guilds/:guildId', requireDB, async (req, res) => {
  try {
    const { guildId } = req.params;
    const { session } = req;
    const cacheKey = `guilds:${session.user.id}`;

    // 1) 嘗試從全域 cache（Redis 或記憶體）讀取
    let allRaw = await cache.get(cacheKey);
    let all = allRaw ? JSON.parse(allRaw) : null;

    // 2) 去重 / in-flight promise support (store in session)
    if (!all) {
      if (req.session._guildsPromise) {
        all = await req.session._guildsPromise;
      } else {
        req.session._guildsPromise = (async () => {
          try {
            const data = await discordFetch('/users/@me/guilds', session.user.accessToken);
            await cache.set(cacheKey, JSON.stringify(data), Math.ceil(GUILDS_CACHE_TTL / 1000));
            req.session._guildsCache = { ts: Date.now(), data };
            return data;
          } finally {
            delete req.session._guildsPromise;
          }
        })();
        all = await req.session._guildsPromise;
      }
    }

    // 3) find guild
    let guild = all.find((g) => g.id === guildId);

    // 4) If not found in user guilds (or user endpoint failed), try bot-first member check
    if (!guild) {
      const botMember = await checkGuildAdminWithBot(guildId, session.user.id);
      if (botMember) {
        // construct minimal guild object from bot member info
        guild = { id: guildId, member: { [session.user.id]: botMember } };
      }
    }

    if (!guild) return res.status(404).json({ error: 'guild_not_found' });

    // 5) permission check
    if (!isGuildAdmin(guild, session.user)) {
      return res.status(403).json({ error: 'not_admin' });
    }

    const since = new Date(Date.now() - 14 * 864e5);
    const [settings, openTickets, recentTickets, ticketSeries, warnStats] = await Promise.all([
      Guild.findOne({ guildId }) ?? {},
      Ticket.countDocuments({ guildId, status: 'open' }),
      Ticket.find({ guildId, status: { $in: ['open', 'closed'] } })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('ticketId status subject createdAt rating'),
      Ticket.aggregate([
        { $match: { guildId, createdAt: { $gte: since } } },
        {
          $project: {
            day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            status: 1,
          },
        },
        { $group: { _id: { day: '$day', status: '$status' }, count: { $sum: 1 } } },
      ]),
      Warn.aggregate([
        { $match: { guildId } },
        { $group: { _id: '$action', count: { $sum: 1 } } },
      ]),
    ]);

    const dayLabels = [];
    for (let i = 13; i >= 0; i--) {
      dayLabels.push(new Date(Date.now() - i * 864e5).toISOString().slice(0, 10));
    }
    const byDay = dayLabels.map((day) => {
      const open = ticketSeries.find((t) => t._id.day === day && t._id.status === 'open')?.count ?? 0;
      const closed = ticketSeries.find((t) => t._id.day === day && t._id.status === 'closed')?.count ?? 0;
      return { day, open, closed };
    });
    const warns = Object.fromEntries(warnStats.map((w) => [w._id, w.count]));

    res.json({
      guild: {
        id: guild.id,
        name: guild.name,
        icon: guild.icon,
        memberCount: guild.approximate_member_count,
      },
      settings,
      openTickets,
      recentTickets,
      stats: { ticketSeries: byDay, warns },
    });
  } catch (err) {
    console.error('[api][guilds] error', err);
    const status = err.status && Number(err.status) >= 400 && Number(err.status) < 600 ? err.status : 502;
    return res.status(status).json({ error: 'external_api_error', detail: err.message, body: err.body ?? undefined });
  }
});
