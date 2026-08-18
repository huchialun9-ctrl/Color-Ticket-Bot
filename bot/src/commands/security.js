import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('security')
    .setDescription('伺服器安全與權限掃描')
    .addSubcommand((s) => s.setName('scan').setDescription('掃描並列出所有擁有「管理員」或危險權限的帳號'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'scan') {
      await interaction.deferReply({ ephemeral: true });

      const members = await interaction.guild.members.fetch();
      
      const dangerousPermissions = [
        PermissionFlagsBits.Administrator,
        PermissionFlagsBits.ManageGuild,
        PermissionFlagsBits.ManageRoles,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.ManageWebhooks,
        PermissionFlagsBits.KickMembers,
        PermissionFlagsBits.BanMembers,
      ];

      const dangerousMembers = [];

      members.forEach((member) => {
        if (member.user.bot) return; // 可以選擇過濾掉機器人，或分開列出。這裡先專注於真實帳號
        
        let hasDanger = false;
        const reasons = [];

        for (const perm of dangerousPermissions) {
          if (member.permissions.has(perm)) {
            hasDanger = true;
            // Map permission bit to name for logging
            const permName = Object.keys(PermissionFlagsBits).find(key => PermissionFlagsBits[key] === perm);
            reasons.push(permName);
          }
        }

        if (hasDanger) {
          dangerousMembers.push({ member, reasons });
        }
      });

      if (dangerousMembers.length === 0) {
        return interaction.editReply({ content: '掃描完成！沒有發現任何擁有危險權限的一般帳號。' });
      }

      const embed = new EmbedBuilder()
        .setTitle('⚠️ 危險權限帳號掃描報告')
        .setColor(0xff4757)
        .setDescription(`共發現 **${dangerousMembers.length}** 個一般帳號擁有管理層級或危險權限。請確認這些帳號是否都應該擁有此權限！`);

      // Discord embed field value has a 1024 char limit, so we chunk it
      let currentField = '';
      let fieldCount = 1;

      for (const { member, reasons } from dangerousMembers) {
        const entry = `• <@${member.id}> (${member.user.tag})\n  └ 權限: ${reasons.slice(0, 3).join(', ')}${reasons.length > 3 ? '...' : ''}\n`;
        if (currentField.length + entry.length > 1000) {
          embed.addFields({ name: `名單 (Part ${fieldCount++})`, value: currentField });
          currentField = entry;
        } else {
          currentField += entry;
        }
      }
      
      if (currentField.length > 0) {
        embed.addFields({ name: fieldCount > 1 ? `名單 (Part ${fieldCount})` : '名單', value: currentField });
      }

      await interaction.editReply({ embeds: [embed] });
    }
  },
};
