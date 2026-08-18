export default {
  name: 'leveling-system',
  version: '1.0.0',

  onLoad({ client }) {
    this.xpMap = new Map(); // 簡單記憶體 XP 儲存
    this.cooldowns = new Set(); // 簡單冷卻

    this.handler = async (message) => {
      if (message.author.bot || !message.guild) return;
      if (this.cooldowns.has(message.author.id)) return; // 避免洗頻刷等

      const userId = message.author.id;
      const currentXP = this.xpMap.get(userId) || 0;
      const addedXP = Math.floor(Math.random() * 10) + 15; // 給予 15~25 XP
      const newXP = currentXP + addedXP;
      
      this.xpMap.set(userId, newXP);

      // 計算等級: 每 100 XP 升 1 級
      const oldLevel = Math.floor(currentXP / 100);
      const newLevel = Math.floor(newXP / 100);

      if (newLevel > oldLevel) {
        message.channel.send(`🎉 恭喜 ${message.author}，你升到了 **等級 ${newLevel}**！`).catch(() => {});
      }

      // 60秒冷卻
      this.cooldowns.add(userId);
      setTimeout(() => this.cooldowns.delete(userId), 60000);
    };

    client.on('messageCreate', this.handler);
  },

  onUnload({ client }) {
    client.removeListener('messageCreate', this.handler);
    this.xpMap.clear();
    this.cooldowns.clear();
  },
};
