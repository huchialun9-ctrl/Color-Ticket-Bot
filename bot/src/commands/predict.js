import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { UserEconomy } from '../../../api/src/models/UserEconomy.js';
import { Prediction } from '../../../api/src/models/Prediction.js';
import { isDBReady } from '../db.js';

export default {
  data: new SlashCommandBuilder()
    .setName('predict')
    .setDescription('參與社群趣味預測押注局')
    .addSubcommand((sub) =>
      sub.setName('list').setDescription('列出目前進行中的預測押注活動'),
    )
    .addSubcommand((sub) =>
      sub
        .setName('bet')
        .setDescription('對指定的預測活動進行代幣押注')
        .addStringOption((o) =>
          o.setName('id').setDescription('預測局 ID（自訂代碼）').setRequired(true),
        )
        .addIntegerOption((o) =>
          o.setName('option').setDescription('押注的選項索引 (1 代表選項一, 2 代表選項二...)').setRequired(true),
        )
        .addIntegerOption((o) =>
          o.setName('amount').setDescription('投入押注的代幣數量').setRequired(true),
        ),
    ),
  async execute(interaction) {
    if (!isDBReady()) {
      return interaction.reply({ content: '❌ 資料庫未就緒，請稍後再試！', ephemeral: true });
    }

    const { guildId, user } = interaction;
    const sub = interaction.options.getSubcommand();

    try {
      if (sub === 'list') {
        const list = await Prediction.find({ guildId, status: 'pending' });
        if (list.length === 0) {
          return interaction.reply({ content: '🔮 目前沒有進行中的預測押注活動。', ephemeral: true });
        }

        const embed = new EmbedBuilder()
          .setColor(0x9b59b6)
          .setTitle('🔮 進行中的社群預測局')
          .setDescription(
            list
              .map((p) => {
                const optionsText = p.options.map((o, idx) => `[${idx + 1}] ${o}`).join(', ');
                return `• **ID: \`${p.predictionId}\`** — **${p.title}**\n  選項：${optionsText}`;
              })
              .join('\n\n')
          )
          .setFooter({ text: '使用 /predict bet [ID] [選項索引] [金額] 進行下注！' });

        return interaction.reply({ embeds: [embed] });
      }

      if (sub === 'bet') {
        const id = interaction.options.getString('id');
        const optIdx = interaction.options.getInteger('option') - 1; // 轉為 0-indexed
        const amount = interaction.options.getInteger('amount');

        if (amount <= 0) {
          return interaction.reply({ content: '❌ 押注金額必須大於 0！', ephemeral: true });
        }

        const pred = await Prediction.findOne({ guildId, predictionId: id, status: 'pending' });
        if (!pred) {
          return interaction.reply({ content: '❌ 找不到該筆進行中的預測活動！', ephemeral: true });
        }

        if (optIdx < 0 || optIdx >= pred.options.length) {
          return interaction.reply({ content: '❌ 無效的選項索引！', ephemeral: true });
        }

        let record = await UserEconomy.findOne({ guildId, userId: user.id });
        if (!record || record.balance < amount) {
          const bal = record ? record.balance : 0;
          return interaction.reply({
            content: `❌ 餘額不足！您目前有 **${bal}** 代幣，無法押注 **${amount}** 代幣。`,
            ephemeral: true,
          });
        }

        // 扣款並寫入下注記錄
        record.balance -= amount;
        await record.save();

        pred.bets.push({
          userId: user.id,
          optionIndex: optIdx,
          amount,
        });
        await pred.save();

        const embed = new EmbedBuilder()
          .setColor(0x2ed573)
          .setTitle('🗳️ 下注成功')
          .setDescription(
            `您成功向預測活動 **${pred.title}** 的選項【**${pred.options[optIdx]}**】押注了 **${amount}** 枚代幣！\n目前剩餘代幣餘額: **${record.balance}**。`
          )
          .setTimestamp();

        return interaction.reply({ embeds: [embed] });
      }
    } catch (err) {
      console.error('[command][predict] error', err);
      await interaction.reply({ content: '❌ 押注時發生錯誤。', ephemeral: true });
    }
  },
};
