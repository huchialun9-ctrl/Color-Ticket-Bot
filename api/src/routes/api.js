import { Router } from 'express';
import { requireAuth, discordFetch, isGuildAdmin } from '../middleware/auth.js';
import { requireDB } from '../middleware/db.js';
import { getGlobalMetrics } from '../services/metrics.js';
import { Guild } from '../models/Guild.js';
import { Ticket } from '../models/Ticket.js';
import { Warn } from '../models/Warn.js';
import { AuditLog } from '../models/AuditLog.js';
import { MemberXP } from '../models/MemberXP.js';
import { ScheduledMessage } from '../models/ScheduledMessage.js';
import { TempVoice } from '../models/TempVoice.js';
import { GlobalBlacklist } from '../models/GlobalBlacklist.js';
import { WebForm } from '../models/WebForm.js';
import { WorkflowSubmission } from '../models/WorkflowSubmission.js';
import { WelcomeCard } from '../models/WelcomeCard.js';
import { InviteTracker } from '../models/InviteTracker.js';
import { RoleExclusion } from '../models/RoleExclusion.js';
import { BlindBox } from '../models/BlindBox.js';
import { Prediction } from '../models/Prediction.js';
import { UserEconomy } from '../models/UserEconomy.js';
import { cache } from '../cache.js';

export const apiRouter = Router();
apiRouter.use(requireAuth);

const DEFAULT_GUILDS_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const GUILDS_CACHE_TTL = Number(process.env.GUILDS_CACHE_TTL_MS || DEFAULT_GUILDS_CACHE_TTL_MS);

/** 全域數據即時看板（DB 未連線時自動退回記憶體模式） */
apiRouter.get('/metrics/global', async (_req, res) => {
  res.json(await getGlobalMetrics());
});

/** 全域排行榜 (跨伺服器彙整) */
apiRouter.get('/metrics/global-leaderboard', requireDB, async (_req, res) => {
  try {
    // 彙整跨伺服器財富榜
    const wealthAgg = await UserEconomy.aggregate([
      { $group: { _id: '$userId', totalBalance: { $sum: '$balance' } } },
      { $sort: { totalBalance: -1 } },
      { $limit: 100 }
    ]);
    
    // 彙整跨伺服器經驗值榜
    const xpAgg = await MemberXP.aggregate([
      { $group: { _id: '$userId', totalXP: { $sum: '$xp' } } },
      { $sort: { totalXP: -1 } },
      { $limit: 100 }
    ]);

    res.json({
      wealth: wealthAgg.map(u => ({ userId: u._id, balance: u.totalBalance })),
      xp: xpAgg.map(u => ({ userId: u._id, xp: u.totalXP }))
    });
  } catch (err) {
    console.error('[global-leaderboard]', err);
    res.status(500).json({ error: 'internal_error' });
  }
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
    const [settings, openTickets, recentTickets, ticketSeries, warnStats, ratingStats] = await Promise.all([
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
      Ticket.aggregate([
        { $match: { guildId, rating: { $exists: true, $ne: null } } },
        { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
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
    const ratingInfo = ratingStats[0] || { avgRating: 0, count: 0 };

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
      stats: { 
        ticketSeries: byDay, 
        warns,
        rating: {
          average: ratingInfo.avgRating ? Number(ratingInfo.avgRating.toFixed(1)) : 0,
          total: ratingInfo.count
        }
      },
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
    if (patch.requireAvatar !== undefined) {
      update['automod.requireAvatar'] = patch.requireAvatar === true || patch.requireAvatar === 'true';
    }
    if (patch.minAccountAgeDays !== undefined) {
      update['automod.minAccountAgeDays'] = Number(patch.minAccountAgeDays);
    }
    if (patch.autoPublish !== undefined) {
      update.autoPublish = patch.autoPublish === true || patch.autoPublish === 'true';
    }
    if (patch.reportChannelId !== undefined) {
      update.reportChannelId = patch.reportChannelId || null;
    }
    if (patch.memberCountChannelId !== undefined) {
      update.memberCountChannelId = patch.memberCountChannelId || null;
    }
    if (patch.onlineCountChannelId !== undefined) {
      update.onlineCountChannelId = patch.onlineCountChannelId || null;
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
    // 過濾並包含文字頻道 (0)、語音頻道 (2) 與分類 (4)
    const filtered = channels
      .filter((c) => c.type === 0 || c.type === 2 || c.type === 4)
      .map((c) => ({ id: c.id, name: c.name, type: c.type }));

    res.json({ channels: filtered });
  } catch (err) {
    console.error('[api][channels] fetch error', err);
    res.status(500).json({ error: 'failed_to_fetch_channels', detail: err.message });
  }
});

/** 取得伺服器身分組列表 */
apiRouter.get('/guilds/:guildId/roles', async (req, res) => {
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

    const roles = await discordFetch(`/guilds/${guildId}/roles`, botToken);
    // 過濾掉 @everyone (id 與 guildId 相同) 以及託管身分組 (managed)
    const filtered = roles
      .filter((r) => r.id !== guildId && !r.managed)
      .map((r) => ({ id: r.id, name: r.name, color: r.color }));

    res.json({ roles: filtered });
  } catch (err) {
    console.error('[api][roles] fetch error', err);
    res.status(500).json({ error: 'failed_to_fetch_roles', detail: err.message });
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

/** 取得安全審查與稽核日誌 */
apiRouter.get('/guilds/:guildId/audit-logs', async (req, res) => {
  try {
    const { guildId } = req.params;

    // 權限驗證
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

    const logs = await AuditLog.find({ guildId })
      .sort({ loggedAt: -1 })
      .limit(200);

    res.json({ logs });
  } catch (err) {
    console.error('[api][audit-logs] fetch error', err);
    res.status(500).json({ error: 'failed_to_fetch_audit_logs', detail: err.message });
  }
});

/** 取得經驗值排行榜 */
apiRouter.get('/guilds/:guildId/leveling/leaderboard', requireDB, async (req, res) => {
  try {
    const { guildId } = req.params;
    const leaderboard = await MemberXP.find({ guildId })
      .sort({ xp: -1 })
      .limit(100);
    res.json({ leaderboard });
  } catch (err) {
    console.error('[api][leveling] fetch error', err);
    res.status(500).json({ error: 'failed_to_fetch_leaderboard', detail: err.message });
  }
});

/** 取得預約排程公告清單 */
apiRouter.get('/guilds/:guildId/announcements/scheduled', requireDB, async (req, res) => {
  try {
    const { guildId } = req.params;
    const list = await ScheduledMessage.find({ guildId }).sort({ scheduledAt: 1 });
    res.json({ list });
  } catch (err) {
    console.error('[api][scheduler] fetch list error', err);
    res.status(500).json({ error: 'failed_to_fetch_scheduled_messages', detail: err.message });
  }
});

/** 建立新的預約排程公告 */
apiRouter.post('/guilds/:guildId/announcements/schedule', requireDB, async (req, res) => {
  try {
    const { guildId } = req.params;
    const { channelId, content, scheduledAt } = req.body;

    if (!channelId || !content || !scheduledAt) {
      return res.status(400).json({ error: 'invalid_params', detail: '缺少必要欄位' });
    }

    const scheduledDate = new Date(scheduledAt);
    if (scheduledDate <= new Date()) {
      return res.status(400).json({ error: 'invalid_date', detail: '預約時間必須為未來的時間' });
    }

    const msg = await ScheduledMessage.create({
      guildId,
      channelId,
      content,
      scheduledAt: scheduledDate,
      status: 'pending'
    });

    res.json({ ok: true, message: msg });
  } catch (err) {
    console.error('[api][scheduler] create error', err);
    res.status(500).json({ error: 'failed_to_create_scheduled_message', detail: err.message });
  }
});

/** 取消已預約的排程公告 */
apiRouter.delete('/guilds/:guildId/announcements/schedule/:id', requireDB, async (req, res) => {
  try {
    const { guildId, id } = req.params;
    await ScheduledMessage.deleteOne({ _id: id, guildId });
    res.json({ ok: true });
  } catch (err) {
    console.error('[api][scheduler] delete error', err);
    res.status(500).json({ error: 'failed_to_delete_scheduled_message', detail: err.message });
  }
});

/** 部署身分組按鈕領取面板 */
apiRouter.post('/guilds/:guildId/roles/panels', async (req, res) => {
  try {
    const { guildId } = req.params;
    const { channelId, title, description, roles } = req.body; // roles = [{ roleId, label, style }]

    if (!channelId || !title || !roles || !Array.isArray(roles)) {
      return res.status(400).json({ error: 'invalid_params', detail: '缺少必要欄位' });
    }

    // 組裝 Discord Message Components (Buttons)
    const components = [];
    const buttons = roles.map((r) => ({
      type: 2, // Button type
      style: Number(r.style || 1), // 1 = Primary, 2 = Secondary, 3 = Success, 4 = Danger
      label: r.label,
      custom_id: `role_toggle:${r.roleId}`
    }));

    // 限制每排最多 5 個按鈕
    for (let i = 0; i < buttons.length; i += 5) {
      components.push({
        type: 1, // ActionRow type
        components: buttons.slice(i, i + 5)
      });
    }

    const embed = {
      title,
      description: description || '點選下方按鈕即可領取或移除對應的身分組。',
      color: 0x5865f2
    };

    const botToken = config.discordBotToken;
    await discordFetch(`/channels/${channelId}/messages`, botToken, {
      method: 'POST',
      body: JSON.stringify({
        embeds: [embed],
        components
      })
    });

    res.json({ ok: true });
  } catch (err) {
    console.error('[api][roles][panel] deploy error', err);
    res.status(500).json({ error: 'failed_to_deploy_roles_panel', detail: err.message });
  }
});

/** 跨伺服器統一客服中心：查詢使用者管理的所有 Discord 伺服器的工單 */
apiRouter.get('/nexus/tickets', requireDB, async (req, res) => {
  try {
    const session = req.session;
    const cacheKey = `guilds:${session.user.id}`;
    let allRaw = await cache.get(cacheKey);
    let all = allRaw ? JSON.parse(allRaw) : null;
    if (!all) {
      all = await fetchUserGuildsWithCache(session);
    }
    // 找出具管理員權限的伺服器 ID 列表
    const adminGuildIds = all
      .filter((g) => (BigInt(g.permissions) & 0x8n) === 0x8n || g.id) // 降級為包含所有有讀取的伺服器
      .map((g) => g.id);

    // 查詢這些伺服器底下的所有工單
    const tickets = await Ticket.find({ guildId: { $in: adminGuildIds } })
      .sort({ createdAt: -1 })
      .limit(200);

    res.json({ tickets });
  } catch (err) {
    console.error('[api][nexus][tickets] fetch error', err);
    res.status(500).json({ error: 'failed_to_fetch_nexus_tickets', detail: err.message });
  }
});

/** 取得全域聯防黑名單 */
apiRouter.get('/blacklist/federation', requireDB, async (req, res) => {
  try {
    const list = await GlobalBlacklist.find({}).sort({ createdAt: -1 }).limit(100);
    res.json({ list });
  } catch (err) {
    console.error('[api][blacklist] fetch error', err);
    res.status(500).json({ error: 'failed_to_fetch_blacklist', detail: err.message });
  }
});

/** 新增聯防黑名單成員 */
apiRouter.post('/blacklist/federation', requireDB, async (req, res) => {
  try {
    const { userId, reason, bannedByGuildId } = req.body;
    if (!userId || !reason || !bannedByGuildId) {
      return res.status(400).json({ error: 'invalid_params', detail: '缺少必要欄位' });
    }

    const doc = await GlobalBlacklist.findOneAndUpdate(
      { userId },
      { $set: { reason, bannedByGuildId } },
      { upsert: true, new: true }
    );

    res.json({ ok: true, blacklist: doc });
  } catch (err) {
    console.error('[api][blacklist] create error', err);
    res.status(500).json({ error: 'failed_to_add_blacklist', detail: err.message });
  }
});

/** 移除聯防黑名單成員 */
apiRouter.delete('/blacklist/federation/:userId', requireDB, async (req, res) => {
  try {
    const { userId } = req.params;
    await GlobalBlacklist.deleteOne({ userId });
    res.json({ ok: true });
  } catch (err) {
    console.error('[api][blacklist] delete error', err);
    res.status(500).json({ error: 'failed_to_delete_blacklist', detail: err.message });
  }
});

/** 取得伺服器網頁表單列表 */
apiRouter.get('/guilds/:guildId/forms', requireDB, async (req, res) => {
  try {
    const { guildId } = req.params;
    const forms = await WebForm.find({ guildId }).sort({ createdAt: -1 });
    res.json({ forms });
  } catch (err) {
    console.error('[api][forms] fetch list error', err);
    res.status(500).json({ error: 'failed_to_fetch_forms', detail: err.message });
  }
});

/** 建立或更新網頁表單 */
apiRouter.post('/guilds/:guildId/forms', requireDB, async (req, res) => {
  try {
    const { guildId } = req.params;
    const { formId, title, description, targetChannelId, fields } = req.body;

    if (!formId || !title || !targetChannelId || !fields) {
      return res.status(400).json({ error: 'invalid_params', detail: '缺少必要欄位' });
    }

    const form = await WebForm.findOneAndUpdate(
      { formId, guildId },
      { $set: { title, description, targetChannelId, fields } },
      { upsert: true, new: true }
    );

    res.json({ ok: true, form });
  } catch (err) {
    console.error('[api][forms] save error', err);
    res.status(500).json({ error: 'failed_to_save_form', detail: err.message });
  }
});

/** 刪除網頁表單 */
apiRouter.delete('/guilds/:guildId/forms/:formId', requireDB, async (req, res) => {
  try {
    const { guildId, formId } = req.params;
    await WebForm.deleteOne({ formId, guildId });
    res.json({ ok: true });
  } catch (err) {
    console.error('[api][forms] delete error', err);
    res.status(500).json({ error: 'failed_to_delete_form', detail: err.message });
  }
});

/** 取得伺服器自定義歡迎卡片設定 */
apiRouter.get('/guilds/:guildId/welcome-card', requireDB, async (req, res) => {
  try {
    const { guildId } = req.params;
    let card = await WelcomeCard.findOne({ guildId });
    if (!card) {
      card = await WelcomeCard.create({ guildId });
    }
    res.json({ welcomeCard: card });
  } catch (err) {
    console.error('[api][welcome-card] fetch error', err);
    res.status(500).json({ error: 'failed_to_fetch_welcome_card', detail: err.message });
  }
});

/** 儲存/更新歡迎卡片設定 */
apiRouter.post('/guilds/:guildId/welcome-card', requireDB, async (req, res) => {
  try {
    const { guildId } = req.params;
    const { enabled, channelId, backgroundUrl, textColor, customText } = req.body;

    const card = await WelcomeCard.findOneAndUpdate(
      { guildId },
      { $set: { enabled, channelId, backgroundUrl, textColor, customText } },
      { upsert: true, new: true }
    );

    res.json({ ok: true, welcomeCard: card });
  } catch (err) {
    console.error('[api][welcome-card] save error', err);
    res.status(500).json({ error: 'failed_to_save_welcome_card', detail: err.message });
  }
});

/** 取得身分組互斥鎖規則列表 */
apiRouter.get('/guilds/:guildId/roles/exclusions', requireDB, async (req, res) => {
  try {
    const { guildId } = req.params;
    const exclusions = await RoleExclusion.find({ guildId }).sort({ createdAt: -1 });
    res.json({ exclusions });
  } catch (err) {
    console.error('[api][roles][exclusions] fetch error', err);
    res.status(500).json({ error: 'failed_to_fetch_exclusions', detail: err.message });
  }
});

/** 新增身分組互斥鎖規則 */
apiRouter.post('/guilds/:guildId/roles/exclusions', requireDB, async (req, res) => {
  try {
    const { guildId } = req.params;
    const { roleIds } = req.body; // Array of role IDs

    if (!roleIds || !Array.isArray(roleIds) || roleIds.length < 2) {
      return res.status(400).json({ error: 'invalid_params', detail: '必須提供至少 2 個互斥的身分組' });
    }

    const doc = await RoleExclusion.create({ guildId, roleIds });
    res.json({ ok: true, exclusion: doc });
  } catch (err) {
    console.error('[api][roles][exclusions] create error', err);
    res.status(500).json({ error: 'failed_to_create_exclusion', detail: err.message });
  }
});

/** 刪除身分組互斥鎖規則 */
apiRouter.delete('/guilds/:guildId/roles/exclusions/:id', requireDB, async (req, res) => {
  try {
    const { guildId, id } = req.params;
    await RoleExclusion.deleteOne({ _id: id, guildId });
    res.json({ ok: true });
  } catch (err) {
    console.error('[api][roles][exclusions] delete error', err);
    res.status(500).json({ error: 'failed_to_delete_exclusion', detail: err.message });
  }
});

/** 取得伺服器邀請連結統計分析 */
apiRouter.get('/guilds/:guildId/invites/stats', requireDB, async (req, res) => {
  try {
    const { guildId } = req.params;
    const invites = await InviteTracker.find({ guildId }).sort({ uses: -1 }).limit(100);
    res.json({ invites });
  } catch (err) {
    console.error('[api][invites] fetch error', err);
    res.status(500).json({ error: 'failed_to_fetch_invite_stats', detail: err.message });
  }
});

/** 取得盲盒品項清單 */
apiRouter.get('/guilds/:guildId/economy/blindbox', requireDB, async (req, res) => {
  try {
    const { guildId } = req.params;
    const list = await BlindBox.find({ guildId }).sort({ createdAt: -1 });
    res.json({ list });
  } catch (err) {
    console.error('[api][blindbox] list fetch error', err);
    res.status(500).json({ error: 'failed_to_fetch_blindbox_list', detail: err.message });
  }
});

/** 新增或更新盲盒品項 */
apiRouter.post('/guilds/:guildId/economy/blindbox', requireDB, async (req, res) => {
  try {
    const { guildId } = req.params;
    const { prizeId, name, rarity, roleRewardId, weight } = req.body;

    if (!prizeId || !name) {
      return res.status(400).json({ error: 'invalid_params', detail: '缺少獎品 ID 或名稱' });
    }

    const doc = await BlindBox.findOneAndUpdate(
      { guildId, prizeId },
      { $set: { name, rarity, roleRewardId, weight } },
      { upsert: true, new: true }
    );

    res.json({ ok: true, prize: doc });
  } catch (err) {
    console.error('[api][blindbox] save error', err);
    res.status(500).json({ error: 'failed_to_save_blindbox', detail: err.message });
  }
});

/** 刪除盲盒品項 */
apiRouter.delete('/guilds/:guildId/economy/blindbox/:prizeId', requireDB, async (req, res) => {
  try {
    const { guildId, prizeId } = req.params;
    await BlindBox.deleteOne({ guildId, prizeId });
    res.json({ ok: true });
  } catch (err) {
    console.error('[api][blindbox] delete error', err);
    res.status(500).json({ error: 'failed_to_delete_blindbox', detail: err.message });
  }
});

/** 取得預測押注局清單 */
apiRouter.get('/guilds/:guildId/economy/predictions', requireDB, async (req, res) => {
  try {
    const { guildId } = req.params;
    const list = await Prediction.find({ guildId }).sort({ createdAt: -1 });
    res.json({ list });
  } catch (err) {
    console.error('[api][prediction] list fetch error', err);
    res.status(500).json({ error: 'failed_to_fetch_predictions', detail: err.message });
  }
});

/** 建立新預測押注局 */
apiRouter.post('/guilds/:guildId/economy/predictions', requireDB, async (req, res) => {
  try {
    const { guildId } = req.params;
    const { predictionId, title, options } = req.body;

    if (!predictionId || !title || !options || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ error: 'invalid_params', detail: '缺少必要欄位或選項少於 2 個' });
    }

    const doc = await Prediction.create({
      guildId,
      predictionId,
      title,
      options,
      status: 'pending',
      bets: []
    });

    res.json({ ok: true, prediction: doc });
  } catch (err) {
    console.error('[api][prediction] create error', err);
    res.status(500).json({ error: 'failed_to_create_prediction', detail: err.message });
  }
});

/** 結算預測押注局並派發彩金 */
apiRouter.post('/guilds/:guildId/economy/predictions/:predictionId/resolve', requireDB, async (req, res) => {
  try {
    const { guildId, predictionId } = req.params;
    const { winnerIndex } = req.body; // Index of the winning option

    const pred = await Prediction.findOne({ guildId, predictionId, status: 'pending' });
    if (!pred) {
      return res.status(404).json({ error: 'prediction_not_found', detail: '找不到進行中的預測活動' });
    }

    const winnerIdx = Number(winnerIndex);
    if (winnerIdx < 0 || winnerIdx >= pred.options.length) {
      return res.status(400).json({ error: 'invalid_winner_index', detail: '無效的獲勝選項索引' });
    }

    // 計算總獎池與贏家總投注
    const totalPool = pred.bets.reduce((acc, b) => acc + b.amount, 0);
    const winningBets = pred.bets.filter((b) => b.optionIndex === winnerIdx);
    const winningPool = winningBets.reduce((acc, b) => acc + b.amount, 0);

    if (totalPool > 0 && winningPool > 0) {
      // 分配獎金給贏家
      for (const bet of winningBets) {
        const share = bet.amount / winningPool;
        const payout = Math.floor(totalPool * share);

        await UserEconomy.findOneAndUpdate(
          { guildId, userId: bet.userId },
          { $inc: { balance: payout } },
          { upsert: true }
        ).catch(() => {});
      }
    }

    // 更新狀態
    pred.status = 'resolved';
    pred.winnerIndex = winnerIdx;
    await pred.save();

    res.json({ ok: true, totalPool, winningPool, payoutCount: winningBets.length });
  } catch (err) {
    console.error('[api][prediction] resolve error', err);
    res.status(500).json({ error: 'failed_to_resolve_prediction', detail: err.message });
  }
});

apiRouter.post('/feedback', async (req, res) => {
  try {
    const { message, type = 'feedback' } = req.body;
    const user = req.session.user;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    const webhookUrl = process.env.FEEDBACK_WEBHOOK_URL;
    
    if (webhookUrl) {
      const embed = {
        title: type === 'bug' ? '🐛 新的 Bug 回報' : '💡 新的功能建議/回饋',
        description: message,
        color: type === 'bug' ? 0xed4245 : 0x5865f2,
        author: {
          name: `${user.username} (${user.id})`,
          icon_url: user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : undefined
        },
        timestamp: new Date().toISOString()
      };

      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] })
      });
    } else {
      console.log(`[Feedback] from ${user.username} (${type}): ${message}`);
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('[api][feedback] error', err);
    res.status(500).json({ error: 'failed_to_send_feedback' });
  }
});
