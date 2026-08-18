import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { pluginManager } from '../modules/plugins/pluginManager.js';

export default {
  data: new SlashCommandBuilder().setName('status').setDescription('檢視機器人即時狀態與系統資訊'),

  async execute(interaction) {
    const client = interaction.client;
    const uptime = formatUptime(client.uptime);

    const embed = new EmbedBuilder()
      .setColor(0x36393f)
      .setTitle('🛰️ 胖達CHubbMan 系統狀態')
      .addFields(
        { name: '🏓 閘道延遲', value: `\`${client.ws.ping}ms\``, inline: true },
        { name: '🟢 連線狀態', value: client.ws.status === 0 ? '`🟢 在線`' : '`🔴 離線`', inline: true },
        { name: '⏱️ 運行時間', value: `\`${uptime}\``, inline: true },
        { name: '🏠 伺服器數', value: `\`${client.guilds.cache.size}\``, inline: true },
        { name: '👥 覆蓋用戶', value: `\`${client.users.cache.size.toLocaleString()}\``, inline: true },
        { name: '📦 已載入插件', value: `\`${pluginManager.list().length}\``, inline: true },
      )
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};

function formatUptime(ms) {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${d}天 ${h}時 ${m}分`;
}
