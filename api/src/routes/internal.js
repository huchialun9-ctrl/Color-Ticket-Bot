import { Router } from 'express';
import { verifyHmac } from '../middleware/hmac.js';
import { recordEvent } from '../services/metrics.js';
import { Ticket } from '../models/Ticket.js';
import { Guild } from '../models/Guild.js';

/**
 * Bot → API 的內部事件接收端（HMAC-SHA256 驗證）。
 * 事件種類：audit / security_alert / ticket_created / ticket_closed / ticket_rating
 */
export const internalRouter = Router();
internalRouter.use(verifyHmac);

internalRouter.post('/audit', (req, res) => {
  recordEvent('audit');
  res.json({ ok: true });
});

internalRouter.post('/security_alert', async (req, res) => {
  recordEvent('security_alert');
  // 可選：更新 guild 設定或寫入防爆破計數
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
