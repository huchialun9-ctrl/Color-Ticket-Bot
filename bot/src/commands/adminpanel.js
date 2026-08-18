import { 
  SlashCommandBuilder, 
  PermissionFlagsBits, 
  EmbedBuilder, 
  ActionRowBuilder, 
  StringSelectMenuBuilder, 
  ChannelSelectMenuBuilder,
  ChannelType,
  ComponentType
} from 'discord.js';
import { getSettings, updateSettings } from '../modules/settings.js';
import { isDBReady } from '../db.js';

export default {
  data: new SlashCommandBuilder()
    .setName('adminpanel')
    .setDescription('✨ 終極中控台：在 Discord 內一鍵設定所有核心功能')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (!isDBReady()) {
      return interaction.reply({ content: '❌ 資料庫未就緒，請稍後再試！', ephemeral: true });
    }

    const { guildId } = interaction;
    let settings = await getSettings(guildId);

    const generateEmbed = () => {
      return new EmbedBuilder()
        .setColor(0x2b2d31)
        .setTitle('⚙️ 伺服器終極控制面板')
        .setDescription('無需開啟網頁，直接在 Discord 內透過選單快速切換與設定核心模組！\n請從下方下拉式選單選擇您要操作的功能：')
        .addFields(
          { name: '🛡️ AutoMod 防護', value: settings.automod?.enabled ? '✅ 啟用中' : '❌ 已停用', inline: true },
          { name: '🌍 跨群聊天', value: settings.globalChatChannelId ? `<#${settings.globalChatChannelId}>` : '❌ 未設定', inline: true },
          { name: '🔊 動態語音', value: settings.voiceCreatorChannelId ? `<#${settings.voiceCreatorChannelId}>` : '❌ 未設定', inline: true },
          { name: '📝 日誌頻道', value: settings.logChannelId ? `<#${settings.logChannelId}>` : '❌ 未設定', inline: true }
        )
        .setFooter({ text: '此面板將在 5 分鐘後超時，僅限管理員使用。' });
    };

    const generateMenu = () => {
      return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('admin_panel_select')
          .setPlaceholder('快速切換 / 設定模組')
          .addOptions(
            { label: '切換 AutoMod 防護狀態', description: '一鍵開啟或關閉自動防洗版與安全模組', value: 'toggle_automod', emoji: '🛡️' },
            { label: '設定日誌頻道', description: '將所有伺服器審查日誌輸出到指定頻道', value: 'set_log', emoji: '📝' },
            { label: '設定跨群聊天頻道', description: '連接全網其他伺服器的即時聊天大廳', value: 'set_globalchat', emoji: '🌍' },
            { label: '設定動態語音母頻道', description: 'Join-to-Create 點擊自動建立私人語音房', value: 'set_voice', emoji: '🔊' },
            { label: '清空所有設定頻道', description: '一鍵關閉並移除跨群、語音、日誌等綁定', value: 'reset_channels', emoji: '🗑️' }
          )
      );
    };

    const reply = await interaction.reply({
      embeds: [generateEmbed()],
      components: [generateMenu()],
      ephemeral: true,
      fetchReply: true
    });

    const collector = reply.createMessageComponentCollector({
      filter: i => i.user.id === interaction.user.id,
      time: 300000 // 5 分鐘
    });

    collector.on('collect', async (i) => {
      // 處理文字下拉選單
      if (i.isStringSelectMenu() && i.customId === 'admin_panel_select') {
        const value = i.values[0];

        if (value === 'toggle_automod') {
          const newState = !(settings.automod?.enabled);
          settings = await updateSettings(guildId, { automodEnabled: newState });
          await i.update({ embeds: [generateEmbed()], components: [generateMenu()] });
          await i.followUp({ content: `✅ AutoMod 防護已 **${newState ? '啟用' : '停用'}**！`, ephemeral: true });
        } 
        
        else if (value === 'set_log' || value === 'set_globalchat' || value === 'set_voice') {
          // 跳出頻道選擇器
          const typeMap = {
            'set_log': { placeholder: '選擇日誌頻道...', id: 'select_log_channel' },
            'set_globalchat': { placeholder: '選擇跨群聊天頻道...', id: 'select_globalchat_channel' },
            'set_voice': { placeholder: '選擇動態語音母頻道...', id: 'select_voice_channel' }
          };
          
          const channelSelect = new ActionRowBuilder().addComponents(
            new ChannelSelectMenuBuilder()
              .setCustomId(typeMap[value].id)
              .setPlaceholder(typeMap[value].placeholder)
              .setChannelTypes(value === 'set_voice' ? [ChannelType.GuildVoice] : [ChannelType.GuildText])
          );

          await i.update({ 
            content: `👇 請在下方選擇要綁定的頻道：`, 
            embeds: [generateEmbed()], 
            components: [generateMenu(), channelSelect] 
          });
        }

        else if (value === 'reset_channels') {
          settings = await updateSettings(guildId, { 
            logChannelId: null, 
            globalChatChannelId: null, 
            voiceCreatorChannelId: null 
          });
          await i.update({ embeds: [generateEmbed()], components: [generateMenu()] });
          await i.followUp({ content: '✅ 已一鍵清空所有頻道綁定！', ephemeral: true });
        }
      }

      // 處理頻道選擇器
      if (i.isChannelSelectMenu()) {
        const channelId = i.values[0];
        if (i.customId === 'select_log_channel') {
          settings = await updateSettings(guildId, { logChannelId: channelId });
          await i.update({ content: null, embeds: [generateEmbed()], components: [generateMenu()] });
          await i.followUp({ content: `✅ 日誌頻道已成功設定為 <#${channelId}>！`, ephemeral: true });
        }
        else if (i.customId === 'select_globalchat_channel') {
          settings = await updateSettings(guildId, { globalChatChannelId: channelId });
          await i.update({ content: null, embeds: [generateEmbed()], components: [generateMenu()] });
          await i.followUp({ content: `✅ 跨群聊天已成功設定為 <#${channelId}>！`, ephemeral: true });
        }
        else if (i.customId === 'select_voice_channel') {
          settings = await updateSettings(guildId, { voiceCreatorChannelId: channelId });
          await i.update({ content: null, embeds: [generateEmbed()], components: [generateMenu()] });
          await i.followUp({ content: `✅ 動態語音母頻道已成功設定為 <#${channelId}>！`, ephemeral: true });
        }
      }
    });

    collector.on('end', async () => {
      await interaction.editReply({ components: [] }).catch(() => {});
    });
  },
};
