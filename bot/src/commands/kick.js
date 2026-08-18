import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { auditLog } from '../modules/automod/auditLog.js';

export default {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('踢出成員並記錄理由 (強制)')
    .addUserOption((o) => o.setName('user').setDescription('目標成員').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('踢出理由 (必填)').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');

    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (!member) {
      return interaction.reply({ content: '找不到此成員，他們可能已經離開。', ephemeral: true });
    }

    if (!member.kickable) {
      return interaction.reply({ content: '我無法踢出此成員！他們可能擁有比我高的權限。', ephemeral: true });
    }

    try {
      await member.kick(`${interaction.user.tag}: ${reason}`);
      await interaction.reply({ content: `✅ 已成功踢出 ${user.tag}。\n理由：${reason}` });
      
      await auditLog(interaction.guild, 'mod_action', {
        action: 'kick',
        target: user.tag,
        moderator: interaction.user.tag,
        reason,
      });
    } catch (err) {
      console.error('[kick]', err.message);
      await interaction.reply({ content: '踢出失敗，請檢查權限設定。', ephemeral: true });
    }
  },
};
