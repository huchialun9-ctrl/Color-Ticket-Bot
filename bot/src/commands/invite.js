import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { config } from '../config.js';

const PERMISSIONS =
  1n + 2n + 4n + 16n + 2048n + 65536n + 268435456n + 536870912n + 1099511627776n;

export default {
  data: new SlashCommandBuilder()
    .setName('invite')
    .setDescription('取得將機器人加入其他伺服器的邀請連結'),

  async execute(interaction) {
    if (!config.clientId) {
      return interaction.reply({ content: '缺少 DISCORD_CLIENT_ID，無法產生邀請連結。', ephemeral: true });
    }

    const params = new URLSearchParams({
      client_id: config.clientId,
      scope: 'bot applications.commands',
      permissions: PERMISSIONS.toString(),
    });
    const url = `https://discord.com/api/oauth2/authorize?${params}`;

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel('點此邀請機器人').setStyle(ButtonStyle.Link).setURL(url),
    );

    const embed = new EmbedBuilder()
      .setColor(0x36393f)
      .setTitle('🤖 邀請 胖達CHubbMan')
      .setDescription('點擊下方按鈕即可將機器人加入你的伺服器。');

    return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  },
};
