import { SlashCommandBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder } from 'discord.js';
import { getSettings } from '../modules/settings.js';
import { auditLog } from '../modules/automod/auditLog.js';

export default {
  data: new SlashCommandBuilder()
    .setName('report')
    .setDescription('匿名檢舉與申訴箱'),

  async execute(interaction) {
    const modal = new ModalBuilder()
      .setCustomId('report_modal')
      .setTitle('匿名檢舉與申訴');

    const subjectInput = new TextInputBuilder()
      .setCustomId('report_subject')
      .setLabel('檢舉對象或主旨')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setPlaceholder('例：@王小明 惡意洗頻');

    const descInput = new TextInputBuilder()
      .setCustomId('report_desc')
      .setLabel('詳細說明與證據 (匿名提交)')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setPlaceholder('請詳細描述發生的狀況，我們將為您保密。');

    modal.addComponents(
      new ActionRowBuilder().addComponents(subjectInput),
      new ActionRowBuilder().addComponents(descInput)
    );

    await interaction.showModal(modal);
  },

  async handleModal(interaction) {
    if (interaction.customId !== 'report_modal') return;

    const subject = interaction.fields.getTextInputValue('report_subject');
    const desc = interaction.fields.getTextInputValue('report_desc');

    const settings = await getSettings(interaction.guild.id);
    const reportChannelId = settings.reportChannelId;

    if (!reportChannelId) {
      return interaction.reply({ content: '伺服器管理員尚未設定檢舉接收頻道，請聯絡管理員！', ephemeral: true });
    }

    const reportChannel = interaction.guild.channels.cache.get(reportChannelId);
    if (!reportChannel) {
      return interaction.reply({ content: '檢舉接收頻道無效，請聯絡管理員！', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor(0xe67e22)
      .setTitle('🚨 收到新的匿名檢舉/申訴')
      .addFields(
        { name: '主旨/對象', value: subject },
        { name: '詳細內容', value: desc }
      )
      .setTimestamp()
      .setFooter({ text: '此檢舉為匿名提交' });

    try {
      await reportChannel.send({ embeds: [embed] });
      await interaction.reply({ content: '✅ 您的檢舉/申訴已匿名送出至管理團隊，感謝您的協助！', ephemeral: true });
    } catch (err) {
      console.error('[report]', err.message);
      await interaction.reply({ content: '送出失敗，可能是接收頻道權限設定錯誤。', ephemeral: true });
    }
  }
};
