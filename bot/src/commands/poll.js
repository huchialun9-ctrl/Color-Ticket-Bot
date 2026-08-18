import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const EMOJIS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

export default {
  data: new SlashCommandBuilder()
    .setName('poll')
    .setDescription('建立一個多選項社群投票活動')
    .addStringOption((o) =>
      o.setName('question').setDescription('投票的問題或討論主題').setRequired(true),
    )
    .addStringOption((o) =>
      o
        .setName('options')
        .setDescription('投票選項，請以半形逗號區隔 (例如: 贊成, 反對, 沒意見)')
        .setRequired(true),
    ),
  async execute(interaction) {
    const question = interaction.options.getString('question');
    const optionsRaw = interaction.options.getString('options');

    const options = optionsRaw
      .split(',')
      .map((opt) => opt.trim())
      .filter((opt) => opt.length > 0);

    if (options.length < 2) {
      return interaction.reply({ content: '❌ 投票必須提供至少 2 個選項！', ephemeral: true });
    }
    if (options.length > 10) {
      return interaction.reply({ content: '❌ 投票選項最多不能超過 10 個！', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`📊 社群投票：${question}`)
      .setDescription(
        options.map((opt, idx) => `${EMOJIS[idx]} **${opt}**`).join('\n\n')
      )
      .setFooter({ text: `由 ${interaction.user.tag} 發起 · 點擊下方對應按鈕進行投票` })
      .setTimestamp();

    await interaction.reply({ content: '🗳️ 投票建立成功！', ephemeral: true });
    
    const pollMessage = await interaction.channel.send({ embeds: [embed] });

    // 自動新增對應的反應按鈕以供投票
    for (let i = 0; i < options.length; i++) {
      await pollMessage.react(EMOJIS[i]).catch(() => {});
    }
  },
};
