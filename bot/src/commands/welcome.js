import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { getSettings, updateSettings } from '../modules/settings.js';
import { isDBReady } from '../db.js';

export default {
  data: new SlashCommandBuilder()
    .setName('welcome')
    .setDescription('管理伺服器歡迎卡片推送設定')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName('show')
        .setDescription('查看目前的歡迎卡片配置')
    )
    .addSubcommand((sub) =>
      sub
        .setName('toggle')
        .setDescription('開啟或關閉歡迎卡片功能')
        .addBooleanOption((o) => o.setName('enabled').setDescription('是否啟用歡迎卡片').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('setup')
        .setDescription('設定歡迎卡片詳細內容')
        .addChannelOption((o) => o.setName('channel').setDescription('推送到哪一個文字頻道').setRequired(true))
        .addStringOption((o) => o.setName('background').setDescription('卡片背景圖片 URL (選填)'))
        .addStringOption((o) => o.setName('message').setDescription('歡迎致詞內容文本 (選填)'))
    ),

  async execute(interaction) {
    if (!isDBReady()) {
      return interaction.reply({ content: '❌ 資料庫未就緒，請稍後再試！', ephemeral: true });
    }

    const { guildId, options } = interaction;
    const sub = options.getSubcommand();

    try {
      const current = await getSettings(guildId);

      if (sub === 'show') {
        const welcome = current.welcome || {};
        const embed = new EmbedBuilder()
          .setColor(0x5865f2)
          .setTitle('🖼️ 歡迎卡片推送狀態')
          .addFields(
            { name: '🟢 功能狀態', value: welcome.enabled ? '`已啟用`' : '`已停用`', inline: true },
            { name: '💬 發送頻道', value: welcome.channelId ? `<#${welcome.channelId}>` : '`未設定`', inline: true },
            { name: '🖼️ 背景圖片 URL', value: welcome.background ? `[點此查看](${welcome.background})` : '`預設背景`', inline: false },
            { name: '📝 歡迎致詞內容', value: welcome.text || '`歡迎來到本伺服器！`', inline: false }
          )
          .setTimestamp();

        return interaction.reply({ embeds: [embed] });
      }

      if (sub === 'toggle') {
        const enabled = options.getBoolean('enabled');
        const welcome = current.welcome || {};
        welcome.enabled = enabled;

        await updateSettings(guildId, { welcome });
        return interaction.reply({ content: `✅ 歡迎卡片功能已設定為：**${enabled ? '開啟' : '關閉'}**。` });
      }

      if (sub === 'setup') {
        const channel = options.getChannel('channel');
        const background = options.getString('background') || '';
        const text = options.getString('message') || '';

        const welcome = current.welcome || {};
        welcome.channelId = channel.id;
        if (background) welcome.background = background;
        if (text) welcome.text = text;

        await updateSettings(guildId, { welcome });
        return interaction.reply({
          content: `✅ 歡迎卡片已設定完成！\n• 發送頻道：<#${channel.id}>\n• 背景圖片：${background ? '`自訂圖片`' : '`預設`'}\n• 歡迎致詞：${text ? `\`${text}\`` : '`預設`'}`,
        });
      }
    } catch (err) {
      console.error('[command][welcome] error', err);
      return interaction.reply({ content: '❌ 執行歡迎卡片指令時發生錯誤。', ephemeral: true });
    }
  },
};
