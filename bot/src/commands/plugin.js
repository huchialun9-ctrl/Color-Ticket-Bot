import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { pluginManager } from '../modules/plugins/pluginManager.js';

export default {
  data: new SlashCommandBuilder()
    .setName('plugin')
    .setDescription('插件管理（熱重載）')
    .addSubcommand((s) => s.setName('list').setDescription('列出已載入插件'))
    .addSubcommand((s) => s.setName('reload').setDescription('熱重載插件').addStringOption((o) => o.setName('name').setDescription('插件名稱').setRequired(true)))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'list') {
      const plugins = pluginManager.list();
      const embed = new EmbedBuilder()
        .setTitle('已載入插件')
        .setDescription(
          plugins.length
            ? plugins.map((p) => `• **${p.name}** @ ${p.version} — ${p.status}`).join('\n')
            : '目前沒有已載入插件。',
        );
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'reload') {
      const name = interaction.options.getString('name');
      await interaction.deferReply({ ephemeral: true });
      try {
        const plugin = await pluginManager.reload(name);
        await interaction.editReply({ content: `✅ 已熱重載 ${plugin.name}@${plugin.version}` });
      } catch (err) {
        await interaction.editReply({ content: `❌ 重載失敗：${err.message}` });
      }
    }
  },
};
