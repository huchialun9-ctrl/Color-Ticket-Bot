export default {
  name: 'auto-thread',
  version: '1.0.0',

  onLoad({ client }) {
    this.handler = async (message) => {
      if (message.author.bot || !message.guild) return;

      // 如果頻道名稱包含 "建議" 或 "suggestion" 或是 "展廳"，就自動開串
      const chName = message.channel.name.toLowerCase();
      if (chName.includes('建議') || chName.includes('suggestion') || chName.includes('展廳') || chName.includes('分享')) {
        try {
          const threadName = `${message.author.username} 的貼文討論`;
          await message.startThread({
            name: threadName.substring(0, 100),
            autoArchiveDuration: 1440, // 24小時
            reason: 'Auto-thread plugin triggered'
          });
        } catch (err) {
          // ignore
        }
      }
    };

    client.on('messageCreate', this.handler);
  },

  onUnload({ client }) {
    client.removeListener('messageCreate', this.handler);
  },
};
