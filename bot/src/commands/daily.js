import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { UserEconomy } from '../../../api/src/models/UserEconomy.js';
import { isDBReady } from '../db.js';

export default {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('進行每日簽到以獲取社群代幣'),
  async execute(interaction) {
    if (!isDBReady()) {
      return interaction.reply({ content: '❌ 資料庫未就緒，請稍後再試！', ephemeral: true });
    }

    const { guildId, user } = interaction;
    const userId = user.id;

    try {
      let record = await UserEconomy.findOne({ guildId, userId });
      if (!record) {
        record = await UserEconomy.create({ guildId, userId });
      }

      const now = new Date();
      const lastCheckIn = record.lastCheckIn;

      // 檢查是否已在 24 小時內簽到
      if (lastCheckIn && now.getTime() - lastCheckIn.getTime() < 24 * 60 * 60 * 1000) {
        const nextAvailable = new Date(lastCheckIn.getTime() + 24 * 60 * 60 * 1000);
        const waitHours = Math.ceil((nextAvailable.getTime() - now.getTime()) / (60 * 60 * 1000));
        return interaction.reply({
          content: `❌ 您今天已經簽到過了！請在 ${waitHours} 小時後再次嘗試。`,
          ephemeral: true,
        });
      }

      const reward = 100;
      record.balance += reward;
      record.lastCheckIn = now;
      await record.save();

      const embed = new EmbedBuilder()
        .setColor(0x2ed573)
        .setTitle('🪙 簽到成功！')
        .setDescription(`恭喜 ${user} 獲得每日簽到獎勵 **${reward}** 枚代幣！\n目前總餘額：**${record.balance}** 枚代幣。`)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (err) {
      console.error('[command][daily] error', err);
      await interaction.reply({ content: '❌ 簽到時發生錯誤，請聯絡管理員。', ephemeral: true });
    }
  },
};
