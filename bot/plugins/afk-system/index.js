export default {
  name: 'afk-system',
  version: '1.0.0',

  onLoad({ client }) {
    // 記憶體中儲存 AFK 狀態：{ userId: reason }
    this.afkMap = new Map();

    this.handler = async (message) => {
      if (message.author.bot) return;

      // 1. 設定 AFK
      if (message.content.startsWith('!afk')) {
        const reason = message.content.replace('!afk', '').trim() || '暫離中';
        this.afkMap.set(message.author.id, reason);
        return message.reply(`💤 你現在被標記為 AFK：**${reason}**`);
      }

      // 2. 解除 AFK
      if (this.afkMap.has(message.author.id)) {
        this.afkMap.delete(message.author.id);
        message.reply(`👋 歡迎回來，你已經移除了 AFK 狀態！`).catch(() => {});
      }

      // 3. 檢查是否標記了 AFK 的人
      if (message.mentions.users.size > 0) {
        for (const [id, user] of message.mentions.users) {
          if (this.afkMap.has(id)) {
            const reason = this.afkMap.get(id);
            message.reply(`💤 **${user.username}** 目前 AFK：${reason}`).catch(() => {});
            break;
          }
        }
      }
    };

    client.on('messageCreate', this.handler);
  },

  onUnload({ client }) {
    client.removeListener('messageCreate', this.handler);
    this.afkMap.clear();
  },
};
