import { Router } from 'express';
import { verifyHmac } from '../middleware/hmac.js';
import { recordEvent } from '../services/metrics.js';
import { Ticket } from '../models/Ticket.js';
import { Guild } from '../models/Guild.js';
import { AuditLog } from '../models/AuditLog.js';

/**
 * Bot → API 的內部事件接收端（HMAC-SHA256 驗證）。
 * 事件種類：audit / security_alert / ticket_created / ticket_closed / ticket_rating
 */
export const internalRouter = Router();
internalRouter.use(verifyHmac);

internalRouter.post('/audit', async (req, res) => {
  recordEvent('audit');
  try {
    const { guild, type, loggedAt, ...details } = req.body;
    if (guild?.id) {
      await AuditLog.create({
        guildId: guild.id,
        type: type || 'audit',
        loggedAt: loggedAt ? new Date(loggedAt) : new Date(),
        details,
      });
    }
  } catch (e) {
    console.error('[internal][audit] save error', e.message);
  }
  res.json({ ok: true });
});

internalRouter.post('/security_alert', async (req, res) => {
  recordEvent('security_alert');
  try {
    const { guild, type, loggedAt, ...details } = req.body;
    if (guild?.id) {
      await AuditLog.create({
        guildId: guild.id,
        type: type || 'security_alert',
        loggedAt: loggedAt ? new Date(loggedAt) : new Date(),
        details,
      });
    }
  } catch (e) {
    console.error('[internal][security_alert] save error', e.message);
  }
  res.json({ ok: true });
});

internalRouter.post('/ticket_created', async (req, res) => {
  const { guild, ticketId, channelId, userId, fields } = req.body;
  recordEvent('ticket_created');
  await Ticket.create({
    guildId: guild.id,
    ticketId,
    channelId,
    userId,
    fields: fields ?? {},
    status: 'open',
  });
  res.json({ ok: true });
});

internalRouter.post('/ticket_closed', async (req, res) => {
  const { guild, ticketId, rating } = req.body;
  recordEvent('ticket_closed');
  await Ticket.findOneAndUpdate(
    { guildId: guild.id, ticketId },
    { $set: { status: 'archived', closedAt: new Date(), rating: rating ?? null } },
  );
  res.json({ ok: true });
});

internalRouter.post('/ticket_memo', async (req, res) => {
  const { guild, ticketId, content, addedBy } = req.body;
  await Ticket.findOneAndUpdate(
    { guildId: guild.id, ticketId },
    { $push: { memos: { content, addedBy, addedAt: new Date() } } }
  );
  res.json({ ok: true });
});

/** Bot 啟動/加入伺服器時同步 guild 快照（feeding 全域看板） */
internalRouter.post('/guild_sync', async (req, res) => {
  const { guilds } = req.body;
  if (!Array.isArray(guilds)) return res.status(400).json({ error: 'invalid_payload' });

  await Promise.all(
    guilds.map((g) =>
      Guild.findOneAndUpdate(
        { guildId: g.id },
        {
          $set: {
            name: g.name,
            icon: g.icon ?? null,
            memberCount: g.memberCount ?? 0,
          },
          $setOnInsert: { guildId: g.id },
        },
        { upsert: true, new: true },
      ),
    ),
  );

  res.json({ ok: true, count: guilds.length });
});
