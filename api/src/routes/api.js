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
  const botToken = process.env.BOT_TOKEN || process.env.DISCORD_BOT_TOKEN || null;
  if (!botToken) return null;
  try {
    const member = await discordFetch(`/guilds/${guildId}/members/${userId}`, botToken);
    return member;
  } catch (err) {
    console.warn('[bot-first] bot member check failed', { guildId, userId, err: err.message ?? err });
    return null;
  }
}

async function fetchUserGuildsWithCache(session) {
  const cacheKey = `guilds:${session.user.id}`;
  const cached = await cache.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // no cache: try to fetch and populate
  const data = await discordFetch('/users/@me/guilds', session.user.accessToken);
  await cache.set(cacheKey, JSON.stringify(data), Math.ceil(GUILDS_CACHE_TTL / 1000));
  return data;
}

/** 單一伺服器控制台 */
apiRouter.get('/guilds/:guildId', requireDB, async (req, res) => {
  try {
    const { guildId } = req.params;
    const { session } = req;
    const cacheKey = `guilds:${session.user.id}`;

    // First try to get cached value
    let allRaw = await cache.get(cacheKey);
    let all = allRaw ? JSON.parse(allRaw) : null;

    // If no cache, try fetch; if fetch fails with 5xx/503 and cache exists, return stale and revalidate
    if (!all) {
      try {
        all = await fetchUserGuildsWithCache(session);
      } catch (err) {
        // If we have stale cache, return it and trigger background refresh
        const stale = await cache.get(cacheKey);
        if (stale) {
          console.warn('[guilds] user endpoint failed, returning stale cache and revalidating in background', { err: err.message ?? err });
          // trigger background refresh (non-blocking)
          (async () => {
            try {
              const fresh = await discordFetch('/users/@me/guilds', session.user.accessToken);
              await cache.set(cacheKey, JSON.stringify(fresh), Math.ceil(GUILDS_CACHE_TTL / 1000));
            } catch (e) {
              console.error('[guilds][revalidate] failed', e);
            }
          })();

          all = JSON.parse(stale);
        } else {
          // no stale cache -> rethrow to outer handler
          throw err;
        }
      }
    }

    // find guild
    let guild = all.find((g) => g.id === guildId);

    // if not found, try bot-first
    if (!guild) {
      const botMember = await checkGuildAdminWithBot(guildId, session.user.id);
      if (botMember) {
        guild = { id: guildId, member: { [session.user.id]: botMember } };
      }
    }

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

/** 儲存/更新伺服器設定與自訂表單 */
apiRouter.put('/guilds/:guildId/settings', requireDB, async (req, res) => {
  try {
    const { guildId } = req.params;
    const { session } = req;
    const cacheKey = `guilds:${session.user.id}`;
    let allRaw = await cache.get(cacheKey);
    let all = allRaw ? JSON.parse(allRaw) : null;
    if (!all) {
      all = await fetchUserGuildsWithCache(session);
    }
    let guild = all.find((g) => g.id === guildId);
    if (!guild) {
      const botMember = await checkGuildAdminWithBot(guildId, session.user.id);
      if (botMember) {
        guild = { id: guildId, member: { [session.user.id]: botMember } };
      }
    }
    if (!guild || !isGuildAdmin(guild, session.user)) {
      return res.status(403).json({ error: 'not_admin' });
    }

    const patch = req.body;
    const update = {};

    // 支援表單編輯 (FormBuilder) 與其他系統設定
    if (patch.form !== undefined) {
      update['ticketing.form'] = patch.form;
    }
    if (patch.logChannelId !== undefined) {
      update.logChannelId = patch.logChannelId;
    }
    if (patch.securityWebhookUrl !== undefined) {
      update.securityWebhookUrl = patch.securityWebhookUrl;
    }
    if (patch.supportRoleId !== undefined) {
      update['ticketing.supportRoleId'] = patch.supportRoleId;
    }
    if (patch.categoryId !== undefined) {
      update['ticketing.categoryId'] = patch.categoryId;
    }
    if (patch.tokenCapacity !== undefined) {
      update['automod.tokenCapacity'] = Number(patch.tokenCapacity);
    }
    if (patch.warnThreshold !== undefined) {
      update['automod.warnThreshold'] = Number(patch.warnThreshold);
    }
    if (patch.automodEnabled !== undefined) {
      update['automod.enabled'] = patch.automodEnabled === true || patch.automodEnabled === 'true';
    }

    const updatedGuild = await Guild.findOneAndUpdate(
      { guildId },
      { $set: update },
      { upsert: true, new: true }
    );

    res.json({ ok: true, settings: updatedGuild });
  } catch (err) {
    console.error('[api][settings] update error', err);
    res.status(500).json({ error: 'failed_to_save_settings', detail: err.message });
  }
});

/** 取得伺服器文字頻道列表 */
apiRouter.get('/guilds/:guildId/channels', async (req, res) => {
  try {
    const { guildId } = req.params;
    const botToken = process.env.BOT_TOKEN || process.env.DISCORD_BOT_TOKEN;
    if (!botToken) {
      return res.status(500).json({ error: 'missing_bot_token' });
    }

    const { session } = req;
    const cacheKey = `guilds:${session.user.id}`;
    let allRaw = await cache.get(cacheKey);
    let all = allRaw ? JSON.parse(allRaw) : null;
    if (!all) {
      all = await fetchUserGuildsWithCache(session);
    }
    let guild = all.find((g) => g.id === guildId);
    if (!guild) {
      const botMember = await checkGuildAdminWithBot(guildId, session.user.id);
      if (botMember) {
        guild = { id: guildId, member: { [session.user.id]: botMember } };
      }
    }
    if (!guild || !isGuildAdmin(guild, session.user)) {
      return res.status(403).json({ error: 'not_admin' });
    }

    const channels = await discordFetch(`/guilds/${guildId}/channels`, botToken);
    // 過濾文字頻道 (Type 0)
    const textChannels = channels
      .filter((c) => c.type === 0)
      .map((c) => ({ id: c.id, name: c.name }));

    res.json({ channels: textChannels });
  } catch (err) {
    console.error('[api][channels] fetch error', err);
    res.status(500).json({ error: 'failed_to_fetch_channels', detail: err.message });
  }
});

/** 發送自訂 Embed 廣播訊息 */
apiRouter.post('/guilds/:guildId/embed', async (req, res) => {
  try {
    const { guildId } = req.params;
    const { channelId, title, description, color, imageUrl } = req.body;

    if (!channelId || !description) {
      return res.status(400).json({ error: 'channelId and description are required' });
    }

    const botToken = process.env.BOT_TOKEN || process.env.DISCORD_BOT_TOKEN;
    if (!botToken) {
      return res.status(500).json({ error: 'missing_bot_token' });
    }

    const { session } = req;
    const cacheKey = `guilds:${session.user.id}`;
    let allRaw = await cache.get(cacheKey);
    let all = allRaw ? JSON.parse(allRaw) : null;
    if (!all) {
      all = await fetchUserGuildsWithCache(session);
    }
    let guild = all.find((g) => g.id === guildId);
    if (!guild) {
      const botMember = await checkGuildAdminWithBot(guildId, session.user.id);
      if (botMember) {
        guild = { id: guildId, member: { [session.user.id]: botMember } };
      }
    }
    if (!guild || !isGuildAdmin(guild, session.user)) {
      return res.status(403).json({ error: 'not_admin' });
    }

    // 格式化 Embed payload
    const embed = {
      description,
    };
    if (title) embed.title = title;
    if (color) {
      embed.color = parseInt(color.replace('#', ''), 16);
    } else {
      embed.color = 0x36393f;
    }
    if (imageUrl) {
      embed.image = { url: imageUrl };
    }

    await discordFetch(`/channels/${channelId}/messages`, botToken, {
      method: 'POST',
      body: JSON.stringify({ embeds: [embed] }),
    });

    res.json({ ok: true });
  } catch (err) {
    console.error('[api][embed] send error', err);
    res.status(500).json({ error: 'failed_to_send_embed', detail: err.message });
  }
});
