/**
 * 範例插件：welcome-card
 * 演示 CHubb-Man 插件介面：onLoad / onUnload / handlers（熱重載支援）。
 */
export default {
  name: 'welcome-card',
  version: '1.0.0',

  onLoad({ client }) {
    this.handler = (member) => {
      const channel = member.guild.systemChannel;
      if (channel?.isSendable()) {
        channel.send(`👋 歡迎 ${member} 加入 ${member.guild.name}！`).catch(() => {});
      }
    };
    client.on('guildMemberAdd', this.handler);
  },

  onUnload({ client }) {
    client.removeListener('guildMemberAdd', this.handler);
  },
};
