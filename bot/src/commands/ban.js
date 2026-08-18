import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { auditLog } from '../modules/automod/auditLog.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('封鎖成員並記錄理由 (強制)')
    .addUserOption((o) => o.setName('user').setDescription('目標成員').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('封鎖理由 (必填)').setRequired(true))
    .addIntegerOption((o) => o.setName('days').setDescription('刪除幾天內的訊息').setMinValue(0).setMaxValue(7))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');
    const days = interaction.options.getInteger('days') || 0;

    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (member && !member.bannable) {
      return interaction.reply({ content: '我無法封鎖此成員！他們可能擁有比我高的權限。', ephemeral: true });
    }

    try {
      await interaction.guild.members.ban(user.id, { deleteMessageSeconds: days * 24 * 60 * 60, reason: `${interaction.user.tag}: ${reason}` });
      await interaction.reply({ content: `✅ 已成功封鎖 ${user.tag}。\n理由：${reason}` });
      
      await auditLog(interaction.guild, 'mod_action', {
        action: 'ban',
        target: user.tag,
        moderator: interaction.user.tag,
        reason,
      });
    } catch (err) {
      console.error('[ban]', err.message);
      await interaction.reply({ content: '封鎖失敗，請檢查權限設定。', ephemeral: true });
    }
  },
};
