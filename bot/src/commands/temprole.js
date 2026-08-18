import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { auditLog } from '../modules/automod/auditLog.js';
import { db } from '../db.js';

export default {
  data: new SlashCommandBuilder()
    .setName('temprole')
    .setDescription('暫時性身分組發放（到期自動回收）')
    .addUserOption((o) => o.setName('user').setDescription('目標成員').setRequired(true))
    .addRoleOption((o) => o.setName('role').setDescription('要發放的身分組').setRequired(true))
    .addIntegerOption((o) => o.setName('hours').setDescription('持續時間（小時）').setRequired(true).setMinValue(1)),
  
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return interaction.reply({ content: '您沒有權限管理身分組。', ephemeral: true });
    }

    const user = interaction.options.getUser('user');
    const role = interaction.options.getRole('role');
    const hours = interaction.options.getInteger('hours');

    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member) return interaction.reply({ content: '找不到該成員。', ephemeral: true });

    // Check hierarchy
    if (interaction.guild.members.me.roles.highest.position <= role.position) {
      return interaction.reply({ content: '我的權限不足以發放這個身分組（身分組順位過高）。', ephemeral: true });
    }

    try {
      await member.roles.add(role);
      
      const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
      
      // 直接寫入資料庫
      await db.collection('temproles').insertOne({
        guildId: interaction.guild.id,
        userId: user.id,
        roleId: role.id,
        expiresAt: expiresAt,
        __v: 0
      });

      await interaction.reply({ content: `✅ 已成功發放 ${role} 給 ${user}，將於 ${hours} 小時後（<t:${Math.floor(expiresAt.getTime() / 1000)}:f>）自動回收。` });

      await auditLog(interaction.guild, 'mod_action', {
        action: 'temprole_add',
        target: user.tag,
        moderator: interaction.user.tag,
        detail: `發放 ${role.name}，時效 ${hours} 小時`,
      });
    } catch (err) {
      console.error('[temprole]', err.message);
      await interaction.reply({ content: '發放失敗，請檢查權限與連線。', ephemeral: true });
    }
  },
};
