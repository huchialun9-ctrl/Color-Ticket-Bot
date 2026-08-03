import { Router } from 'express';
import { requireAuth, discordFetch, isGuildAdmin } from '../middleware/auth.js';
import { requireDB } from '../middleware/db.js';
import { getGlobalMetrics } from '../services/metrics.js';
import { Guild } from '../models/Guild.js';
import { Ticket } from '../models/Ticket.js';
import { Warn } from '../models/Warn.js';

export const apiRouter = Router();
apiRouter.use(requireAuth);

const GUILDS_CACHE_TTL = 30 * 1000; // 30s

/** 全域數據即時看板（DB 未連線時自動退回記憶體模式） */
apiRouter.get('/metrics/global', async (_req, res) => {
  res.json(await getGlobalMetrics());
});

/** 單一伺服器控制台 */
apiRouter.get('/guilds/:guildId', requireDB, async (req, res) => {
  try {
    const { guildId } = req.params;
    const { session } = req;

    // 嘗試從 session 快取讀取 user guilds（減少對 Discord API 的請求）
    let all;
    const cache = req.session._guildsCache;
    if (cache && Date.now() - cache.ts < GUILDS_CACHE_TTL) {
      all = cache.data;
    } else {
      all = await discordFetch('/users/@me/guilds', session.user.accessToken);
      req.session._guildsCache = { ts: Date.now(), data: all };
    }

    const guild = all.find((g) => g.id === guildId);
    if (!guild) return res.status(404).json({ error: 'guild_not_found' });
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

/** 儲存伺服器設定（如表單結構 ticketing.form） */
apiRouter.put('/guilds/:guildId/settings', requireDB, async (req, res) => {
  const { guildId } = req.params;
  const { session } = req;
  const patch = req.body;

  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
    return res.status(400).json({ error: 'invalid_payload' });
  }

  const all = await discordFetch('/users/@me/guilds', session.user.accessToken);
  const guild = all.find((g) => g.id === guildId);
  if (!guild) return res.status(404).json({ error: 'guild_not_found' });
  if (!isGuildAdmin(guild, session.user)) {
    return res.status(403).json({ error: 'not_admin' });
  }

  const sanitized = {
    ticketing: { form: patch.form ?? null },
    logChannelId: patch.logChannelId ?? undefined,
    securityWebhookUrl: patch.securityWebhookUrl ?? undefined,
  };

  await Guild.findOneAndUpdate(
    { guildId },
    {
      $set: {
        'ticketing.form': sanitized.ticketing.form,
        ...(sanitized.logChannelId !== undefined ? { logChannelId: sanitized.logChannelId } : {}),
        ...(sanitized.securityWebhookUrl !== undefined ? { securityWebhookUrl: sanitized.securityWebhookUrl } : {}),
      },
    },
    { upsert: true, new: true },
  );

  res.json({ ok: true });
});
