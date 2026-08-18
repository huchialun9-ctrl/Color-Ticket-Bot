import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { UserEconomy } from '../../../api/src/models/UserEconomy.js';
import { isDBReady } from '../db.js';

export default {
  data: new SlashCommandBuilder()
    .setName('birthday')
    .setDescription('設定或查詢您的生日日期（月-日）')
    .addStringOption((o) =>
      o
        .setName('date')
        .setDescription('輸入您的生日，格式為 MM-DD (例如: 12-25)')
        .setRequired(true),
    ),
  async execute(interaction) {
    if (!isDBReady()) {
      return interaction.reply({ content: '❌ 資料庫未就緒，請稍後再試！', ephemeral: true });
    }

    const { guildId, user } = interaction;
    const dateStr = interaction.options.getString('date');

    const regex = /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
    if (!regex.test(dateStr)) {
      return interaction.reply({
        content: '❌ 生日格式錯誤！請使用 `MM-DD` 格式，例如：`12-25` 代表 12 月 25 日。',
        ephemeral: true,
      });
    }

    try {
      let record = await UserEconomy.findOne({ guildId, userId: user.id });
      if (!record) {
        record = await UserEconomy.create({ guildId, userId: user.id });
      }

      record.birthday = dateStr;
      await record.save();

      const embed = new EmbedBuilder()
        .setColor(0xff69b4)
        .setTitle('🎂 生日設定成功')
        .setDescription(`已將您的生日設定為：**${dateStr}**！\n系統將在當天為您送上專屬的生日賀卡與慶生代幣獎勵哦。`)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (err) {
      console.error('[command][birthday] error', err);
      await interaction.reply({ content: '❌ 設定生日時發生錯誤。', ephemeral: true });
    }
  },
};
