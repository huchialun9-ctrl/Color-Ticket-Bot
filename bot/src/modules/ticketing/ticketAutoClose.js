import { isDBReady, db } from '../../db.js';
import { ticketManager } from './ticketManager.js';

export function startTicketAutoClose(client) {
  console.log('[ticketAutoClose] 票務自動結案檢查線程已啟動');

  // 每小時檢查一次 (3600000 毫秒)
  setInterval(async () => {
    if (!isDBReady()) return;

    try {
      const collection = db.collection('tickets');
      // 找出超過 24 小時未更新的票單
      const expireDate = new Date(Date.now() - 72 * 60 * 60 * 1000); // 72 小時前
      const warnDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 小時前

      const inactiveTickets = await collection.find({
        status: 'open',
        createdAt: { $lte: warnDate }
      }).toArray();

      if (inactiveTickets.length === 0) return;

      console.log(`[ticketAutoClose] 偵測到 ${inactiveTickets.length} 張閒置票單...`);

      for (const ticket of inactiveTickets) {
        try {
          const guild = client.guilds.cache.get(ticket.guildId);
          if (!guild) continue;

          const channel = guild.channels.cache.get(ticket.channelId);
          if (!channel) {
            await collection.updateOne(
              { _id: ticket._id },
              { $set: { status: 'archived', closedAt: new Date(), closedBy: 'System (Auto)' } }
            );
            continue;
          }

          if (ticket.createdAt <= expireDate) {
            // 超過 72 小時：自動關閉
            await channel.send('【系統通知】由於此客服單已超過 72 小時無人回應，系統已自動將其結案。');
            await ticketManager.close(guild, ticket.ticketId, channel);
            console.log(`[ticketAutoClose] 已自動關閉票單: ${ticket.ticketId}`);
          } else if (!ticket.warnedAt) {
            // 超過 24 小時，且尚未提醒過：發送提醒
            await channel.send(`【系統通知】<@${ticket.userId}> 您好，這張票單已經閒置超過 24 小時囉！請問還有任何需要協助的地方嗎？\n如果問題已解決，您可以點擊結案按鈕。若超過 72 小時無人回應，系統將會自動關閉此票單。`);
            await collection.updateOne({ _id: ticket._id }, { $set: { warnedAt: new Date() } });
            console.log(`[ticketAutoClose] 已發送逾期提醒: ${ticket.ticketId}`);
          }
        } catch (err) {
          console.error(`[ticketAutoClose] 處理票單失敗 (${ticket.ticketId})`, err.message);
        }
      }
    } catch (e) {
      console.error('[ticketAutoClose] 自動結案檢查失敗', e.message);
    }
  }, 3600000); // 1小時執行一次
}
