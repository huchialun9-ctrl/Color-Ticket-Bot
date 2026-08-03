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
