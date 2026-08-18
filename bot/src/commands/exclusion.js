import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { RoleExclusion } from '../../../api/src/models/RoleExclusion.js';
import { isDBReady } from '../db.js';

export default {
  data: new SlashCommandBuilder()
    .setName('exclusion')
    .setDescription('管理伺服器身分組互斥鎖規則')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand((sub) =>
      sub
        .setName('add')
        .setDescription('新增一條身分組互斥規則')
        .addRoleOption((o) => o.setName('role1').setDescription('第一個互斥身分組').setRequired(true))
        .addRoleOption((o) => o.setName('role2').setDescription('第二個互斥身分組').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('list')
        .setDescription('列出當前伺服器所有的互斥身分組規則')
    )
    .addSubcommand((sub) =>
      sub
        .setName('delete')
        .setDescription('刪除指定的互斥規則')
        .addStringOption((o) => o.setName('id').setDescription('規則 ID').setRequired(true))
    ),

  async execute(interaction) {
    if (!isDBReady()) {
      return interaction.reply({ content: '❌ 資料庫未就緒，請稍後再試！', ephemeral: true });
    }

    const { guildId, options } = interaction;
    const subcommand = options.getSubcommand();

    try {
      if (subcommand === 'add') {
        const role1 = options.getRole('role1');
        const role2 = options.getRole('role2');

        if (role1.id === role2.id) {
          return interaction.reply({ content: '❌ 互斥身分組不能是同一個身分組！', ephemeral: true });
        }

        // 檢查是否重複
        const exists = await RoleExclusion.findOne({
          guildId,
          roleIds: { $all: [role1.id, role2.id] },
        });

        if (exists) {
          return interaction.reply({ content: '❌ 此互斥規則已存在！', ephemeral: true });
        }

        const doc = await RoleExclusion.create({
          guildId,
          roleIds: [role1.id, role2.id],
        });

        return interaction.reply({
          content: `✅ 成功建立互斥鎖規則：<@&${role1.id}> 🔀 <@&${role2.id}> (ID: \`${doc._id}\`)`,
        });
      }

      if (subcommand === 'list') {
        const list = await RoleExclusion.find({ guildId });
        if (list.length === 0) {
          return interaction.reply({ content: 'ℹ️ 當前伺服器尚未設定任何身分組互斥規則。', ephemeral: true });
        }

        const embed = new EmbedBuilder()
          .setColor(0x5865f2)
          .setTitle('⚙️ 互斥身分組規則列表')
          .setDescription('當成員被授予下方規則中的任一身分組時，系統會自動移除與之互斥的另一身分組。')
          .setTimestamp();

        list.forEach((item, index) => {
          embed.addFields({
            name: `規則 ${index + 1} (ID: ${item._id})`,
            value: `<@&${item.roleIds[0]}> 🔀 <@&${item.roleIds[1]}>`,
            inline: false,
          });
        });

        return interaction.reply({ embeds: [embed] });
      }

      if (subcommand === 'delete') {
        const id = options.getString('id');
        const res = await RoleExclusion.deleteOne({ guildId, _id: id });

        if (res.deletedCount === 0) {
          return interaction.reply({ content: '❌ 找不到該互斥規則 ID！請確認輸入是否正確。', ephemeral: true });
        }

        return interaction.reply({ content: `✅ 已成功刪除互斥規則 (ID: \`${id}\`)` });
      }
    } catch (err) {
      console.error('[command][exclusion] error', err);
      return interaction.reply({ content: '❌ 執行身分組互斥指令時發生錯誤。', ephemeral: true });
    }
  },
};
