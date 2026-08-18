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

export function startPresenceLoop(client) {
  updatePresence(client);
  // 每 3 分鐘 (180,000 毫秒) 定期強制重新整理狀態，確保 Bot 的上線與伺服器數量狀態不中斷
  setInterval(() => {
    updatePresence(client);
  }, 180000);
}
