export default {
  name: 'sticky-message',
  version: '1.0.0',

  onLoad({ client }) {
    // 儲存每個頻道最後發送的 Sticky Message ID
    this.stickyMap = new Map();

    this.handler = async (message) => {
      // 避免無限迴圈，如果是自己發的置底訊息就忽略
      if (message.author.id === client.user.id) return;
      if (!message.guild) return;

      // 檢查是否是需要置底的頻道 (這裡先寫死一個判斷，或是根據某些關鍵字)
      // 在這個範例中，我們假設頻道名稱結尾有 "-sticky" 就要啟用此功能
      if (!message.channel.name.endsWith('-sticky')) return;

      const stickyText = `📌 **這是一則置底公告！** \n請大家發言前務必先閱讀頻道置頂規則！`;

      try {
        const lastStickyId = this.stickyMap.get(message.channel.id);
        
        // 刪除舊的置底訊息
        if (lastStickyId) {
          const oldMsg = await message.channel.messages.fetch(lastStickyId).catch(() => null);
          if (oldMsg) await oldMsg.delete().catch(() => {});
        }

        // 發送新的置底訊息
        const newMsg = await message.channel.send(stickyText);
        this.stickyMap.set(message.channel.id, newMsg.id);
      } catch (err) {
        // ignore
      }
    };

    client.on('messageCreate', this.handler);
  },

  onUnload({ client }) {
    client.removeListener('messageCreate', this.handler);
    this.stickyMap.clear();
  },
};
