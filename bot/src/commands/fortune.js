import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const FORTUNES = [
  { title: '大吉 🌟', desc: '今天運勢極佳！事事順心，適合挑戰新事物，說不定會有意外之財哦。', color: 0xff4757 },
  { title: '中吉 ✨', desc: '運氣非常穩定。保持樂觀，踏實前進，今天會是個充實的一天。', color: 0xffa500 },
  { title: '小吉 🍀', desc: '運勢尚可。多關心身邊的人，保持平常心，微小的幸運正在悄悄降臨。', color: 0x2ed573 },
  { title: '吉 🌸', desc: '安穩無憂的運勢。多喝水多休息，把心情放鬆，會有個舒坦的一天。', color: 0x1e90ff },
  { title: '末吉 🍂', desc: '稍微平淡的一天。適合靜下心讀書或整理房間，平淡就是一種幸福。', color: 0xa4b0be },
  { title: '凶 🌧️', desc: '今天不宜急躁。凡事多思量，出門記得帶傘，小心行事即可化險為夷。', color: 0x57606f },
];

export default {
  data: new SlashCommandBuilder()
    .setName('fortune')
    .setDescription('抽取您的今日社群幸運運勢小卡'),
  async execute(interaction) {
    const idx = Math.floor(Math.random() * FORTUNES.length);
    const fortune = FORTUNES[idx];

    const embed = new EmbedBuilder()
      .setColor(fortune.color)
      .setTitle(`🔮 ${interaction.user.username} 的今日運勢`)
      .setDescription(`您的今日運勢為：**${fortune.title}**\n\n> ${fortune.desc}`)
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
      .setTimestamp()
      .setFooter({ text: '運勢純屬娛樂，祝您今天有個愉快的好心情！' });

    await interaction.reply({ embeds: [embed] });
  },
};
