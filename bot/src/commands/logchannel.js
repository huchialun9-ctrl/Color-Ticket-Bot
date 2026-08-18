import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { getSettings, updateSettings } from '../modules/settings.js';
import { isDBReady } from '../db.js';

export default {
  data: new SlashCommandBuilder()
    .setName('logchannel')
    .setDescription('設定系統稽核與安全事件日誌發送頻道')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName('set')
        .setDescription('指定一個文字頻道來發送系統日誌')
        .addChannelOption((o) =>
          o
            .setName('channel')
            .setDescription('選擇文字頻道')
            .setRequired(true)
            .addChannelTypes(0) // 僅能選擇文字頻道 (type: 0)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('disable')
        .setDescription('停用系統日誌發送功能')
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
        await updateSettings(guildId, { logChannelId: channel.id });
        return interaction.reply({ content: `✅ 系統安全稽核日誌頻道已設定為：<#${channel.id}>` });
      }

      if (sub === 'disable') {
        await updateSettings(guildId, { logChannelId: null });
        return interaction.reply({ content: '✅ 系統日誌發送功能已停用。' });
      }
    } catch (err) {
      console.error('[command][logchannel] error', err);
      return interaction.reply({ content: '❌ 執行日誌設定指令時發生錯誤。', ephemeral: true });
    }
  },
};
