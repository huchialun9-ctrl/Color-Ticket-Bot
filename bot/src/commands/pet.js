import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { UserEconomy } from '../../../api/src/models/UserEconomy.js';
import { isDBReady } from '../db.js';

export default {
  data: new SlashCommandBuilder()
    .setName('pet')
    .setDescription('與您的社群虛擬寵物互動')
    .addSubcommand((sub) =>
      sub
        .setName('feed')
        .setDescription('花費 20 代幣餵食您的虛擬寵物，使其獲得成長經驗值'),
    )
    .addSubcommand((sub) =>
      sub
        .setName('rename')
        .setDescription('花費 50 代幣為您的虛擬寵物重新命名')
        .addStringOption((o) =>
          o.setName('name').setDescription('輸入新的寵物名稱').setRequired(true),
        ),
    ),
  async execute(interaction) {
    if (!isDBReady()) {
      return interaction.reply({ content: '❌ 資料庫未就緒，請稍後再試！', ephemeral: true });
    }

    const { guildId, user } = interaction;
    const sub = interaction.options.getSubcommand();

    try {
      let record = await UserEconomy.findOne({ guildId, userId: user.id });
      if (!record) {
        record = await UserEconomy.create({ guildId, userId: user.id });
      }

      if (sub === 'feed') {
        if (record.balance < 20) {
          return interaction.reply({ content: '❌ 餘額不足！餵食寵物需要 **20** 代幣。', ephemeral: true });
        }

        record.balance -= 20;
        record.petXP += 35;

        let levelUpText = '';
        const xpNeeded = record.petLevel * 100;
        if (record.petXP >= xpNeeded) {
          record.petXP -= xpNeeded;
          record.petLevel += 1;
          levelUpText = `\n🎉 恭喜！您的寵物 **${record.petName}** 升級到了 **LV.${record.petLevel}**！`;
        }

        record.petLastFed = new Date();
        await record.save();

        const embed = new EmbedBuilder()
          .setColor(0x2ed573)
          .setTitle(`🍗 餵食 ${record.petName}`)
          .setDescription(
            `您花了 20 代幣餵食 **${record.petName}**。${record.petName} 開心地搖了搖尾巴！\n成長經驗值 +35 (當前: ${record.petXP}/${record.petLevel * 100})${levelUpText}\n目前代幣餘額: **${record.balance}**。`
          )
          .setTimestamp();

        return interaction.reply({ embeds: [embed] });
      }

      if (sub === 'rename') {
        const newName = interaction.options.getString('name');
        if (record.balance < 50) {
          return interaction.reply({ content: '❌ 餘額不足！重新命名寵物需要 **50** 代幣。', ephemeral: true });
        }

        record.balance -= 50;
        const oldName = record.petName;
        record.petName = newName;
        await record.save();

        const embed = new EmbedBuilder()
          .setColor(0x3498db)
          .setTitle('🏷️ 寵物命名成功')
          .setDescription(
            `您花了 50 代幣將寵物 **${oldName}** 重新命名為 **${newName}**！\n目前代幣餘額: **${record.balance}**。`
          )
          .setTimestamp();

        return interaction.reply({ embeds: [embed] });
      }
    } catch (err) {
      console.error('[command][pet] error', err);
      await interaction.reply({ content: '❌ 進行寵物互動時發生錯誤。', ephemeral: true });
    }
  },
};
