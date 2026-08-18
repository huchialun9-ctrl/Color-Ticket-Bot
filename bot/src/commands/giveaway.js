import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('快速建立一場臨時抽獎活動')
    .addStringOption((o) => o.setName('prize').setDescription('抽獎獎品').setRequired(true))
    .addIntegerOption((o) => o.setName('minutes').setDescription('活動持續時間（分鐘）').setRequired(true).setMinValue(1))
    .addIntegerOption((o) => o.setName('winners').setDescription('得獎人數 (預設1人)').setMinValue(1).setMaxValue(20))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageEvents),

  async execute(interaction) {
    const prize = interaction.options.getString('prize');
    const minutes = interaction.options.getInteger('minutes');
    const winnersCount = interaction.options.getInteger('winners') || 1;

    const endTime = Date.now() + minutes * 60 * 1000;
    
    const embed = new EmbedBuilder()
      .setColor(0x9b59b6)
      .setTitle('🎉 抽獎活動開跑啦！')
      .setDescription(`**獎品：** ${prize}\n**得獎人數：** ${winnersCount} 人\n\n點擊下方的 🎉 按鈕參與抽獎！\n\n結束時間：<t:${Math.floor(endTime / 1000)}:R>`)
      .setFooter({ text: `由 ${interaction.user.tag} 發起` });

    const btn = new ButtonBuilder()
      .setCustomId('join_giveaway')
      .setLabel('🎉 參加抽獎 (0)')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(btn);

    const message = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

    // 收集參與者
    const participants = new Set();

    const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: minutes * 60 * 1000 });

    collector.on('collect', async (i) => {
      if (i.customId === 'join_giveaway') {
        if (participants.has(i.user.id)) {
          await i.reply({ content: '您已經參加過此抽獎了！', ephemeral: true });
        } else {
          participants.add(i.user.id);
          const newBtn = ButtonBuilder.from(btn).setLabel(`🎉 參加抽獎 (${participants.size})`);
          await interaction.editReply({ components: [new ActionRowBuilder().addComponents(newBtn)] });
          await i.reply({ content: '✅ 成功參與抽獎！祝您好運！', ephemeral: true });
        }
      }
    });

    collector.on('end', async () => {
      const arr = Array.from(participants);
      let winMsg = '';
      
      if (arr.length === 0) {
        winMsg = '沒有人參加抽獎，活動流局 😢';
      } else {
        // 隨機抽選
        const winners = [];
        const drawCount = Math.min(winnersCount, arr.length);
        for (let j = 0; j < drawCount; j++) {
          const idx = Math.floor(Math.random() * arr.length);
          winners.push(arr[idx]);
          arr.splice(idx, 1);
        }
        winMsg = `恭喜以下得獎者獲得 **${prize}**：\n${winners.map(id => `<@${id}>`).join(' ')}`;
      }

      const endEmbed = EmbedBuilder.from(embed)
        .setColor(0x7f8c8d)
        .setTitle('🎊 抽獎活動已結束！')
        .setDescription(`**獎品：** ${prize}\n\n${winMsg}`);

      const disabledBtn = ButtonBuilder.from(btn).setDisabled(true);
      
      await interaction.editReply({ embeds: [endEmbed], components: [new ActionRowBuilder().addComponents(disabledBtn)] });
      
      if (participants.size > 0) {
        await interaction.followUp({ content: winMsg });
      }
    });
  },
};
