export default {
  name: 'chat-filter',
  version: '1.0.0',

  onLoad({ client }) {
    // 示範用的髒話清單
    const badWords = ['幹', '白痴', '智障', '死媽', '靠杯', 'fuck', 'bitch'];

    this.handler = async (message) => {
      if (message.author.bot || !message.guild) return;

      const content = message.content.toLowerCase();
      const hasBadWord = badWords.some((word) => content.includes(word));

      if (hasBadWord) {
        try {
          await message.delete();
          const warning = await message.channel.send(`⚠️ ${message.author}，請注意你的用語！系統已自動過濾不雅字眼。`);
          setTimeout(() => warning.delete().catch(() => {}), 5000);
        } catch (err) {
          // 忽略權限不足等錯誤
        }
      }
    };

    client.on('messageCreate', this.handler);
  },

  onUnload({ client }) {
    client.removeListener('messageCreate', this.handler);
  },
};
