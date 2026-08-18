import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('countdown')
    .setDescription('在頻道內建立一個活動倒數計時器')
    .addStringOption((o) => o.setName('event').setDescription('活動名稱').setRequired(true))
    .addIntegerOption((o) => o.setName('minutes').setDescription('幾分鐘後開始？').setRequired(true).setMinValue(1)),

  async execute(interaction) {
    const eventName = interaction.options.getString('event');
    const minutes = interaction.options.getInteger('minutes');
    const targetTime = Math.floor((Date.now() + minutes * 60 * 1000) / 1000);

    const embed = new EmbedBuilder()
      .setColor(0xe67e22)
      .setTitle(`⏳ 活動倒數計時`)
      .setDescription(`**${eventName}** 將於 <t:${targetTime}:R> 開始！\n(精確時間：<t:${targetTime}:F>)`);

    await interaction.reply({ embeds: [embed] });
  },
};
