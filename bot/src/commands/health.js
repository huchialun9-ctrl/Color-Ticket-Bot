import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, GuildExplicitContentFilter, GuildVerificationLevel } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('health')
    .setDescription('伺服器體檢健康評分')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply();

    const guild = interaction.guild;
    let score = 100;
    const notes = [];

    // 1. 2FA 要求
    if (guild.mfaLevel === 1) {
      notes.push('✅ 已開啟管理員雙重認證 (2FA) 要求 (+0)');
    } else {
      score -= 20;
      notes.push('❌ 未開啟管理員雙重認證 (2FA) 要求 (-20)');
    }

    // 2. 驗證等級
    if (guild.verificationLevel === GuildVerificationLevel.High || guild.verificationLevel === GuildVerificationLevel.VeryHigh) {
      notes.push('✅ 伺服器驗證等級設定為高 (+0)');
    } else if (guild.verificationLevel === GuildVerificationLevel.Medium) {
      score -= 5;
      notes.push('⚠️ 伺服器驗證等級僅為中等 (-5)');
    } else {
      score -= 15;
      notes.push('❌ 伺服器驗證等級過低，容易遭受免洗帳號攻擊 (-15)');
    }

    // 3. 敏感內容過濾
    if (guild.explicitContentFilter === GuildExplicitContentFilter.AllMembers) {
      notes.push('✅ 已開啟全體成員的敏感媒體內容過濾 (+0)');
    } else {
      score -= 10;
      notes.push('⚠️ 未全面開啟敏感內容過濾，可能有不雅圖片風險 (-10)');
    }

    // 4. 管理員數量檢查
    const members = await guild.members.fetch();
    const adminCount = members.filter(m => m.permissions.has(PermissionFlagsBits.Administrator)).size;
    if (adminCount > 10) {
      score -= 10;
      notes.push(`⚠️ 管理員數量過多 (${adminCount} 人)，這會增加被駭客入侵的風險 (-10)`);
    } else {
      notes.push(`✅ 管理員數量適中 (${adminCount} 人) (+0)`);
    }

    let color = 0x2ecc71; // Green
    if (score < 80) color = 0xf1c40f; // Yellow
    if (score < 60) color = 0xe74c3c; // Red

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(`🏥 ${guild.name} 伺服器健康診斷報告`)
      .setDescription(`綜合安全評分：**${score} / 100**\n\n**診斷詳情：**\n${notes.join('\n')}`)
      .setFooter({ text: '建議盡快修補標記為 ❌ 與 ⚠️ 的項目以提升安全性！' });

    await interaction.editReply({ embeds: [embed] });
  },
};
