import { db } from '../db.js';

export function startServerStatsLoop(client) {
  console.log('[serverStats] 伺服器狀態看板更新線程已啟動');

  setInterval(async () => {
    try {
      const statsConfig = db.collection('serverstats');
      const configs = await statsConfig.find({ enabled: true }).toArray();

      for (const conf of configs) {
        try {
          const guild = client.guilds.cache.get(conf.guildId);
          if (!guild) continue;

          // 更新總人數頻道
          if (conf.memberCountChannelId) {
            const channel = guild.channels.cache.get(conf.memberCountChannelId);
            if (channel) {
              const text = conf.memberCountText || '👥 總人數: {count}';
              await channel.setName(text.replace('{count}', guild.memberCount)).catch(() => {});
            }
          }

          // 更新在線人數頻道
          if (conf.onlineCountChannelId) {
            const channel = guild.channels.cache.get(conf.onlineCountChannelId);
            if (channel) {
              const onlineCount = guild.members.cache.filter(m => m.presence?.status === 'online' || m.presence?.status === 'idle' || m.presence?.status === 'dnd').size;
              const text = conf.onlineCountText || '🟢 在線人數: {count}';
              await channel.setName(text.replace('{count}', onlineCount)).catch(() => {});
            }
          }
        } catch (err) {
          console.error(`[serverStats] 更新伺服器狀態失敗 (${conf.guildId})`, err.message);
        }
      }
    } catch (err) {
      console.error('[serverStats] 狀態檢查失敗', err.message);
    }
  }, 10 * 60 * 1000); // 10分鐘更新一次，避免觸發 API Rate Limit
}
