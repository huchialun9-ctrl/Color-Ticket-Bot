import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { UserEconomy } from '../../../api/src/models/UserEconomy.js';
import { isDBReady } from '../db.js';

const QUESTIONS = [
  { q: 'Discord 成立於哪一年？ (回答格式: 四位數西元年)', a: '2015' },
  { q: '在 Discord API 中，文字頻道的類型代碼 (Channel Type) 是多少？', a: '0' },
  { q: '本 Bot 的核心名稱叫什麼？ (提示: 胖達...)', a: '胖達CHubbMan' },
  { q: '中華民國的電話國碼是？', a: '886' },
  { q: '台灣最著名的地標大樓 (101) 位於哪個縣市？', a: '台北市' },
];

export default {
  data: new SlashCommandBuilder()
    .setName('trivia')
    .setDescription('發起一個限時社群趣味問答遊戲（搶答獲取代幣）'),
  async execute(interaction) {
    if (!isDBReady()) {
      return interaction.reply({ content: '❌ 資料庫未就緒，請稍後再試！', ephemeral: true });
    }

    const { guildId, channel } = interaction;

    const idx = Math.floor(Math.random() * QUESTIONS.length);
    const item = QUESTIONS[idx];

    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle('🧠 社群趣味搶答！')
      .setDescription(`題目如下，請最快在聊天室中**直接輸入答案**的人即可勝出！\n\n**${item.q}**`)
      .setFooter({ text: '限時 30 秒搶答，加油！' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    // 建立訊息蒐集器
    const filter = (m) => m.content.trim().toLowerCase() === item.a.toLowerCase() && !m.author.bot;
    const collector = channel.createMessageCollector({ filter, time: 30000, max: 1 });

    collector.on('collect', async (m) => {
      try {
        let record = await UserEconomy.findOne({ guildId, userId: m.author.id });
        if (!record) {
          record = await UserEconomy.create({ guildId, userId: m.author.id });
        }

        const prize = 50;
        record.balance += prize;
        await record.save();

        const successEmbed = new EmbedBuilder()
          .setColor(0x2ed573)
          .setTitle('🎉 搶答成功！')
          .setDescription(
            `恭喜 ${m.author} 最快答對了！\n正確答案是：**${item.a}**\n獲得搶答獎勵 **${prize}** 枚代幣！\n目前總餘額：**${record.balance}**。`
          )
          .setTimestamp();

        await channel.send({ embeds: [successEmbed] });
      } catch (err) {
        console.error('[trivia] collect save error', err.message);
      }
    });

    collector.on('end', (collected) => {
      if (collected.size === 0) {
        channel.send({ content: `⏳ 時間到！無人答對。正確答案是：**${item.a}**。` }).catch(() => {});
      }
    });
  },
};
