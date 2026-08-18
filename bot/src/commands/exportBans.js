import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('export_bans')
    .setDescription('將伺服器目前的 Ban 歷程匯出為清單備份 (CSV格式)')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const bans = await interaction.guild.bans.fetch();

      if (bans.size === 0) {
        return interaction.editReply({ content: '目前沒有任何被封鎖的成員。' });
      }

      let csv = 'UserID,Username,Reason\n';
      bans.forEach((banInfo) => {
        const id = banInfo.user.id;
        const username = banInfo.user.tag.replace(/"/g, '""'); // Escape quotes
        const reason = (banInfo.reason || '無理由').replace(/"/g, '""');
        csv += `${id},"${username}","${reason}"\n`;
      });

      const buffer = Buffer.from(csv, 'utf-8');

      const embed = new EmbedBuilder()
        .setColor(0x2ecc71)
        .setTitle('✅ 封鎖名單匯出完成')
        .setDescription(`共匯出 **${bans.size}** 筆封鎖紀錄。請下載附檔以檢視詳細名單。`);

      await interaction.editReply({
        embeds: [embed],
        files: [{ attachment: buffer, name: `bans_export_${interaction.guild.id}.csv` }]
      });

    } catch (err) {
      console.error('[export_bans]', err.message);
      await interaction.editReply({ content: '匯出失敗，請確認我有「封鎖成員」的權限。' });
    }
  },
};
