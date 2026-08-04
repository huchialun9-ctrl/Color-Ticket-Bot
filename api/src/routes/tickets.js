import { Router } from 'express';
import { requireAuth, discordFetch, isGuildAdmin } from '../middleware/auth.js';
import { requireDB } from '../middleware/db.js';
import { Ticket } from '../models/Ticket.js';

export const ticketsRouter = Router();
ticketsRouter.use(requireAuth, requireDB);

/** 票務列表（含批次管理所需的 id 清單） */
ticketsRouter.get('/guilds/:guildId/tickets', async (req, res) => {
  const { guildId } = req.params;
  const status = req.query.status; // open | closed | archived | all
  const filter = status && status !== 'all' ? { guildId, status } : { guildId };

  const tickets = await Ticket.find(filter)
    .sort({ createdAt: -1 })
    .limit(100)
    .select('ticketId channelId subject status rating createdAt closedAt');
  res.json({ tickets });
});

/**
 * 批次票務管理：一次勾選多張票務單進行批次關閉/批次標記。
 * body: { ids: string[], action: 'close'|'archive'|'resolve', by: string }
 */
ticketsRouter.post('/guilds/:guildId/tickets/batch', async (req, res) => {
  const { guildId } = req.params;
  const { ids = [], action = 'close', by } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'ids 為必填' });
  }

  const patch =
    action === 'archive'
      ? { status: 'archived', closedAt: new Date(), closedBy: by }
      : { status: 'closed', closedAt: new Date(), closedBy: by };

  const result = await Ticket.updateMany({ guildId, ticketId: { $in: ids } }, { $set: patch });
  res.json({ updated: result.modifiedCount });
});

/** 單張票務詳情 */
ticketsRouter.get('/guilds/:guildId/tickets/:ticketId', async (req, res) => {
  const ticket = await Ticket.findOne({
    guildId: req.params.guildId,
    ticketId: req.params.ticketId,
  });
  if (!ticket) return res.status(404).json({ error: 'not_found' });
  res.json(ticket);
});

/** 在指定頻道發布工單按鈕面板 */
ticketsRouter.post('/guilds/:guildId/tickets/deploy-panel', async (req, res) => {
  try {
    const { guildId } = req.params;
    const { channelId, title, description, buttonLabel } = req.body;

    if (!channelId) {
      return res.status(400).json({ error: 'channelId is required' });
    }

    const botToken = process.env.BOT_TOKEN || process.env.DISCORD_BOT_TOKEN;
    if (!botToken) {
      return res.status(500).json({ error: 'missing_bot_token' });
    }

    // 權限驗證
    const { session } = req;
    let all = await discordFetch('/users/@me/guilds', session.user.accessToken);
    let guild = all.find((g) => g.id === guildId);
    if (!guild || !isGuildAdmin(guild, session.user)) {
      return res.status(403).json({ error: 'not_admin' });
    }

    // 構建 Discord 訊息 Payload
    const messagePayload = {
      embeds: [
        {
          title: title || '客服中心',
          description: description || '點擊下方按鈕建立私密客服單。',
          color: 0x36393f,
        },
      ],
      components: [
        {
          type: 1, // ActionRow
          components: [
            {
              type: 2, // Button
              style: 1, // Primary (blurple)
              label: buttonLabel || '📩 開啟客服單',
              custom_id: 'ticket:open',
            },
          ],
        },
      ],
    };

    await discordFetch(`/channels/${channelId}/messages`, botToken, {
      method: 'POST',
      body: JSON.stringify(messagePayload),
    });

    res.json({ ok: true });
  } catch (err) {
    console.error('[tickets][deploy-panel] error', err);
    res.status(500).json({ error: 'failed_to_deploy_panel', detail: err.message });
  }
});
