import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('team')
    .setDescription('將目前語音頻道內的成員隨機分組')
    .addIntegerOption((o) => o.setName('groups').setDescription('要分成幾組？').setRequired(true).setMinValue(2).setMaxValue(10)),

  async execute(interaction) {
    const voiceChannel = interaction.member.voice.channel;
    
    if (!voiceChannel) {
      return interaction.reply({ content: '您必須先加入一個語音頻道！', ephemeral: true });
    }

    const members = Array.from(voiceChannel.members.values());
    
    if (members.length < 2) {
      return interaction.reply({ content: '語音頻道內人數太少，無法分組。', ephemeral: true });
    }

    const groupsCount = interaction.options.getInteger('groups');
    
    if (members.length < groupsCount) {
      return interaction.reply({ content: `頻道內只有 ${members.length} 人，無法分成 ${groupsCount} 組！`, ephemeral: true });
    }

    // Fisher-Yates Shuffle
    for (let i = members.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [members[i], members[j]] = [members[j], members[i]];
    }

    const teams = Array.from({ length: groupsCount }, () => []);

    members.forEach((member, index) => {
      teams[index % groupsCount].push(member.user.id);
    });

    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle('🎲 隨機分組結果')
      .setDescription(`對 **${voiceChannel.name}** 內的 ${members.length} 人進行分組：`);

    teams.forEach((team, idx) => {
      embed.addFields({
        name: `第 ${idx + 1} 小隊 (${team.length} 人)`,
        value: team.map(id => `<@${id}>`).join('\n') || '無',
        inline: true
      });
    });

    await interaction.reply({ embeds: [embed] });
  },
};
