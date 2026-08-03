import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { getSettings } from '../modules/settings.js';
import { auditLog } from '../modules/automod/auditLog.js';

export default {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('對成員累積警告')
    .addUserOption((o) => o.setName('user').setDescription('目標成員').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('原因'))
    .addIntegerOption((o) => o.setName('amount').setDescription('警告點數（預設 1）').setMinValue(1).setMaxValue(10))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const member = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason') || '未提供';
    const amount = interaction.options.getInteger('amount') || 1;

    const settings = await getSettings(interaction.guild.id);
    const total = (settings.warns?.[member.id] || 0) + amount;
    settings.warns = { ...(settings.warns || {}), [member.id]: total };

    const threshold = settings.automod?.warnThreshold ?? 3;
    if (total >= threshold) {
      await member.timeout(60 * 60 * 1000, 'CHubb-Man: 累積警告達標').catch(() => {});
      await interaction.reply({
        content: `${member} 累積警告 ${total}/${threshold}，已自動禁言 1 小時。`,
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: `${member} 已警告（${total}/${threshold}）。原因：${reason}`,
        ephemeral: true,
      });
    }

    await auditLog(interaction.guild, 'mod_action', {
      action: 'warn',
      target: member.user.tag,
      amount,
      total,
      reason,
    });
  },
};
