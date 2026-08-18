export default {
  name: 'auto-reactor',
  version: '1.0.0',

  onLoad({ client }) {
    this.handler = async (message) => {
      if (message.author.bot) return;

      const content = message.content.toLowerCase();
      
      try {
        if (content.includes('生日') || content.includes('birthday') || content.includes('hbd')) {
          await message.react('🎂');
          await message.react('🎉');
        }
        if (content.includes('早安') || content.includes('morning')) {
          await message.react('☀️');
        }
        if (content.includes('晚安') || content.includes('night')) {
          await message.react('🌙');
        }
        if (content.includes('恭喜') || content.includes('grats')) {
          await message.react('🥳');
        }
      } catch (err) {
        // ignore errors (like no permission)
      }
    };

    client.on('messageCreate', this.handler);
  },

  onUnload({ client }) {
    client.removeListener('messageCreate', this.handler);
  },
};
