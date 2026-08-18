import { ScheduledMessage } from '../../../api/src/models/ScheduledMessage.js';
import { isDBReady, db } from '../db.js';

export function startScheduler(client) {
  console.log('[scheduler] 預約排程公告檢查線程已啟動');
  
  // 每 60 秒檢查一次是否有待發送的預約消息
  setInterval(async () => {
    if (!isDBReady()) return;

    try {
      const now = new Date();
      const pending = await ScheduledMessage.find({
        status: 'pending',
        scheduledAt: { $lte: now }
      });

      if (pending.length === 0) return;

      console.log(`[scheduler] 偵測到 ${pending.length} 則待發送公告...`);

      for (const msg of pending) {
        try {
          const guild = client.guilds.cache.get(msg.guildId);
          if (!guild) {
            msg.status = 'failed';
            await msg.save();
            continue;
          }

          const channel = guild.channels.cache.get(msg.channelId);
          if (!channel || !channel.isTextBased()) {
            msg.status = 'failed';
            await msg.save();
            continue;
          }

          await channel.send(msg.content);
          msg.status = 'sent';
          await msg.save();
          console.log(`[scheduler] 公告已成功發送至頻道: ${channel.name} (Guild: ${guild.name})`);
        } catch (err) {
          console.error(`[scheduler] 發送排程訊息失敗 (ID: ${msg._id})`, err.message);
          msg.status = 'failed';
          await msg.save();
        }
      }

    } catch (e) {
      console.error('[scheduler] 排程訊息檢查失敗', e.message);
    }

    try {
      const tempRoles = db.collection('temproles');
      const now = new Date();
      const expiredRoles = await tempRoles.find({ expiresAt: { $lte: now } }).toArray();

      for (const record of expiredRoles) {
        try {
          const guild = client.guilds.cache.get(record.guildId);
          if (guild) {
            const member = await guild.members.fetch(record.userId).catch(() => null);
            if (member && member.roles.cache.has(record.roleId)) {
              await member.roles.remove(record.roleId).catch(() => {});
              console.log(`[scheduler] 已自動回收 ${member.user.tag} 的臨時身分組 (${record.roleId})`);
            }
          }
          await tempRoles.deleteOne({ _id: record._id });
        } catch (err) {
          console.error(`[scheduler] 回收身分組失敗 (${record._id})`, err.message);
        }
      }
    } catch (e) {
      console.error('[scheduler] 臨時身分組檢查失敗', e.message);
    }
  }, 60000);
}
