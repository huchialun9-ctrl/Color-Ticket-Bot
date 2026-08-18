import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { updateSettings } from '../modules/settings.js';
import { isDBReady } from '../db.js';

export default {
  data: new SlashCommandBuilder()
    .setName('globalchat')
    .setDescription('設定跨群聊天 (Global Chat) 頻道')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName('set')
        .setDescription('指定一個頻道作為跨群聊天的接口')
        .addChannelOption((o) =>
          o
            .setName('channel')
            .setDescription('選擇文字頻道')
            .setRequired(true)
            .addChannelTypes(0) // 文字頻道
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('disable')
        .setDescription('停用跨群聊天功能')
    ),

  async execute(interaction) {
    if (!isDBReady()) {
      return interaction.reply({ content: '❌ 資料庫未就緒，請稍後再試！', ephemeral: true });
    }

    const { guildId, options } = interaction;
    const sub = options.getSubcommand();

    try {
      if (sub === 'set') {
        const channel = options.getChannel('channel');
        await updateSettings(guildId, { globalChatChannelId: channel.id });
        return interaction.reply({ content: `✅ 跨群聊天頻道已成功設定為：<#${channel.id}>\n您現在可以在此頻道與其他伺服器的成員進行跨群交流了！` });
      }

      if (sub === 'disable') {
        await updateSettings(guildId, { globalChatChannelId: null });
        return interaction.reply({ content: '✅ 跨群聊天功能已成功停用！' });
      }
    } catch (err) {
      console.error('[command][globalchat] error', err);
      return interaction.reply({ content: '❌ 執行設定指令時發生錯誤。', ephemeral: true });
    }
  },
};
