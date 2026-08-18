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
    )
    .addSubcommand((sub) =>
      sub
        .setName('create')
        .setDescription('發起一個新的預測局 (管理員用)')
        .addStringOption((o) => o.setName('id').setDescription('自訂一個簡短的 ID (例如: match1)').setRequired(true))
        .addStringOption((o) => o.setName('title').setDescription('預測局標題 (例如: 今晚誰會贏)').setRequired(true))
        .addStringOption((o) => o.setName('options').setDescription('選項，請用半形逗號分隔').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('resolve')
        .setDescription('結算一個預測局並派發獎金 (管理員用)')
        .addStringOption((o) => o.setName('id').setDescription('預測局 ID').setRequired(true))
        .addIntegerOption((o) => o.setName('winner').setDescription('勝利的選項索引 (1 代表選項一...)').setRequired(true))
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

      if (sub === 'create') {
        const id = interaction.options.getString('id');
        const title = interaction.options.getString('title');
        const optsRaw = interaction.options.getString('options');
        const options = optsRaw.split(',').map((o) => o.trim()).filter((o) => o.length > 0);

        if (options.length < 2) {
          return interaction.reply({ content: '❌ 至少需要 2 個選項！', ephemeral: true });
        }

        const existing = await Prediction.findOne({ guildId, predictionId: id });
        if (existing) {
          return interaction.reply({ content: '❌ 該預測 ID 已存在，請換一個！', ephemeral: true });
        }

        await Prediction.create({ guildId, predictionId: id, title, options });
        return interaction.reply({ content: `✅ 預測活動 **[${id}] ${title}** 已建立！\n選項：${options.join(', ')}` });
      }

      if (sub === 'resolve') {
        const id = interaction.options.getString('id');
        const winIdx = interaction.options.getInteger('winner') - 1;

        const pred = await Prediction.findOne({ guildId, predictionId: id, status: 'pending' });
        if (!pred) {
          return interaction.reply({ content: '❌ 找不到該筆進行中的預測活動！', ephemeral: true });
        }

        if (winIdx < 0 || winIdx >= pred.options.length) {
          return interaction.reply({ content: '❌ 無效的選項索引！', ephemeral: true });
        }

        pred.status = 'resolved';
        pred.winnerIndex = winIdx;
        await pred.save();

        // 分紅計算 (簡易版：贏家平分所有池子，扣除手續費？ 這裡做 1:2 賠率或簡單賠率)
        let totalPool = 0;
        let winPool = 0;
        const winners = [];

        for (const bet of pred.bets) {
          totalPool += bet.amount;
          if (bet.optionIndex === winIdx) {
            winPool += bet.amount;
            winners.push(bet);
          }
        }

        if (winners.length === 0) {
          return interaction.reply({ content: `✅ 預測結算完成：**${pred.options[winIdx]}** 獲勝！\n但沒有人押中，彩池流局。` });
        }

        const ratio = totalPool / winPool;
        for (const bet of winners) {
          const payout = Math.floor(bet.amount * ratio);
          await UserEconomy.updateOne(
            { guildId, userId: bet.userId },
            { $inc: { balance: payout } }
          );
        }

        return interaction.reply({ content: `✅ 預測結算完成：**${pred.options[winIdx]}** 獲勝！\n共 ${winners.length} 人押中，總彩池 ${totalPool}，賠率 ${ratio.toFixed(2)}x！` });
      }
    } catch (err) {
      console.error('[command][predict] error', err);
      await interaction.reply({ content: '❌ 指令執行發生錯誤。', ephemeral: true });
    }
  },
};
