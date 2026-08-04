import { ActivityType } from 'discord.js';

export function updatePresence(client) {
  try {
    const guildCount = client.guilds.cache.size;
    client.user.setPresence({
      activities: [{ name: `${guildCount} 個伺服器 | /help`, type: ActivityType.Listening }],
      status: 'online',
    });
    console.log(`[presence] 狀態更新：正在監控 ${guildCount} 個伺服器`);
  } catch (err) {
    console.error('[presence] 更新失敗', err);
  }
}
