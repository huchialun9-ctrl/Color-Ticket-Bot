import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { getSettings, updateSettings } from '../modules/settings.js';
import { isDBReady } from '../db.js';

export default {
  data: new SlashCommandBuilder()
    .setName('voicecreator')
    .setDescription('設定動態語音頻道 (Join to Create) 母頻道')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName('set')
        .setDescription('指定一個語音母頻道，加入時會自動建立子語音房')
        .addChannelOption((o) =>
          o
            .setName('channel')
            .setDescription('選擇語音母頻道')
            .setRequired(true)
            .addChannelTypes(2) // 僅能選擇語音頻道 (type: 2)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('disable')
        .setDescription('停用動態語音建立功能')
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
        await updateSettings(guildId, { voiceCreatorChannelId: channel.id });
        return interaction.reply({ content: `✅ 動態語音母頻道已成功設定為：<#${channel.id}> (Join to Create 已啟動)` });
      }

      if (sub === 'disable') {
        await updateSettings(guildId, { voiceCreatorChannelId: null });
        return interaction.reply({ content: '✅ 動態語音建立功能已成功停用！' });
      }
    } catch (err) {
      console.error('[command][voicecreator] error', err);
      return interaction.reply({ content: '❌ 執行語音建立設定指令時發生錯誤。', ephemeral: true });
    }
  },
};
