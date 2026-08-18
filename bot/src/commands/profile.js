import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { UserEconomy } from '../../../api/src/models/UserEconomy.js';
import { MemberXP } from '../../../api/src/models/MemberXP.js';
import { isDBReady } from '../db.js';

export default {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('查看個人成就、代幣餘額、活躍等級與寵物狀態名片'),
  async execute(interaction) {
    if (!isDBReady()) {
      return interaction.reply({ content: '❌ 資料庫未就緒，請稍後再試！', ephemeral: true });
    }

    const { guildId, user } = interaction;

    try {
      let econ = await UserEconomy.findOne({ guildId, userId: user.id });
      if (!econ) {
        econ = await UserEconomy.create({ guildId, userId: user.id });
      }

      let xp = await MemberXP.findOne({ guildId, userId: user.id });
      if (!xp) {
        xp = await MemberXP.create({ guildId, userId: user.id });
      }

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle(`🛡️ ${user.username} 的社群成就名片`)
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setImage(econ.profileBgUrl)
        .addFields(
          { name: '🪙 代幣餘額', value: `**${econ.balance}** 枚`, inline: true },
          { name: '📈 活躍等級', value: `LV. **${xp.level}** (XP: ${xp.xp})`, inline: true },
          { name: '🗣️ 發言總數', value: `${xp.messageCount || 0} 則`, inline: true },
          { name: '🐾 虛擬寵物', value: `名稱: **${econ.petName}** (LV.${econ.petLevel})`, inline: true },
          { name: '🎂 生日設定', value: econ.birthday ? econ.birthday : '尚未設定', inline: true },
          { name: '🏆 已解鎖成就與盲盒獎項', value: econ.badges.length > 0 ? econ.badges.map(b => `\`${b}\``).join(', ') : '暫無解鎖成就' }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (err) {
      console.error('[command][profile] error', err);
      await interaction.reply({ content: '❌ 獲取個人名片時發生錯誤。', ephemeral: true });
    }
  },
};
