import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { ticketManager } from '../modules/ticketing/ticketManager.js';
import { auditLog } from '../modules/automod/auditLog.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('票務指令')
    .addSubcommand((s) =>
      s
        .setName('panel')
        .setDescription('建立票務面板')
        .addStringOption((o) => o.setName('title').setDescription('面板標題')),
    )
    .addSubcommand((s) => s.setName('close').setDescription('關閉當前票務頻道並匯出紀錄'))
    .addSubcommand((s) =>
      s
        .setName('rating')
        .setDescription('為本次服務評分')
        .addIntegerOption((o) => o.setName('stars').setDescription('1–5 星').setMinValue(1).setMaxValue(5).setRequired(true)),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'panel') {
      await ticketManager.createPanel(interaction.channel, {
        title: interaction.options.getString('title') || undefined,
      });
      await interaction.reply({ content: '票務面板已建立。', ephemeral: true });
    }

    if (sub === 'close') {
      const id = interaction.channel.name.startsWith('ticket-')
        ? interaction.channel.name
        : 'unknown';
      await ticketManager.close(interaction, id, interaction.channel);
    }

    if (sub === 'rating') {
      const stars = interaction.options.getInteger('stars');
      await interaction.reply({ content: `感謝評分：${'★'.repeat(stars)}${'☆'.repeat(5 - stars)}`, ephemeral: true });
      await auditLog(interaction.guild, 'ticket_rating', {
        channel: interaction.channel.name,
        stars,
      });
    }
  },
};
