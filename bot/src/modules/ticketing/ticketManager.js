import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
} from 'discord.js';
import { getSettings } from '../settings.js';
import { webhookPush } from '../api/signer.js';
import { transcript } from './transcript.js';

const TICKET_OPEN = 'ticket:open';

/**
 * 動態票務引擎：
 *  - 面板按鈕 → 依 guild 設定表單彈出 Modal（支援自訂欄位）
 *  - 建立私密隔離頻道（當事人 + 客服 role）
 *  - 關閉 → 標記 archived + 產出 HTML Transcript + 評分
 */
export const ticketManager = {
  /** 建立票務面板 */
  async createPanel(channel, options = {}) {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(TICKET_OPEN)
        .setLabel(options.label || '📩 開啟客服單')
        .setStyle(ButtonStyle.Primary),
    );

    const embed = new EmbedBuilder()
      .setColor(0x36393f)
      .setTitle(options.title || '客服中心')
      .setDescription(options.description || '點擊下方按鈕建立私密客服單。');

    await channel.send({ embeds: [embed], components: [row] });
  },

  /** 面板按鈕 → 依表單結構彈出 Modal */
  async handleButton(interaction) {
    if (interaction.customId !== TICKET_OPEN) return;

    const settings = await getSettings(interaction.guild.id);
    const form = settings.ticketing?.form;

    const modal = new ModalBuilder()
      .setCustomId(`ticket:modal`)
      .setTitle(form?.title || '建立客服單');

    const fields = form?.fields?.length
      ? form.fields
      : [{ customId: 'subject', label: '主旨', style: 'short', required: true }];

    for (const f of fields) {
      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId(f.customId)
            .setLabel(f.label)
            .setStyle(f.style === 'paragraph' ? TextInputStyle.Paragraph : TextInputStyle.Short)
            .setRequired(f.required !== false)
            .setMaxLength(f.maxLength || 1024),
        ),
      );
    }

    await interaction.showModal(modal);
  },

  /** Modal 提交 → 建立私密頻道 */
  async handleModal(interaction) {
    if (!interaction.customId.startsWith('ticket:')) return;

    const settings = await getSettings(interaction.guild.id);
    const answers = Object.fromEntries(
      interaction.fields.fields.map((f) => [f.customId, f.value]),
    );
    const ticketId = `ticket-${interaction.user.id}-${Date.now().toString(36)}`;
    const categoryId = settings.ticketing?.categoryId;

    const channel = await interaction.guild.channels.create({
      name: ticketId,
      type: ChannelType.GuildText,
      parent: categoryId,
      permissionOverwrites: [
        {
          id: interaction.guild.roles.everyone.id,
          deny: ['ViewChannel'],
        },
        {
          id: interaction.user.id,
          allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
        },
        ...(settings.ticketing?.supportRoleId
          ? [
              {
                id: settings.ticketing.supportRoleId,
                allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
              },
            ]
          : []),
      ],
    });

    await interaction.reply({ content: `客服單已建立 → ${channel}`, ephemeral: true });

    const embed = new EmbedBuilder()
      .setTitle('客服單')
      .setDescription(
        Object.entries(answers)
          .map(([k, v]) => `**${k}**: ${v}`)
          .join('\n'),
      )
      .setFooter({ text: `Ticket ID: ${ticketId}` });
    await channel.send({ embeds: [embed] });

    // 同步至 API
    webhookPush('ticket_created', {
      type: 'ticket_created',
      guild: { id: interaction.guild.id, name: interaction.guild.name },
      ticketId,
      channelId: channel.id,
      userId: interaction.user.id,
      fields: answers,
    }).catch(() => {});
  },

  /** 關閉票務 → Transcript + 評分 + 歸檔 */
  async close(interactionOrGuild, ticketId, channel) {
    const html = await transcript.render(channel);
    const guild = interactionOrGuild.guild || interactionOrGuild;

    const embed = new EmbedBuilder()
      .setTitle('票務已關閉')
      .setDescription('感謝您的使用！請在 60 秒內點擊按鈕評分（1–5 星）。')
      .addFields({ name: 'Ticket', value: ticketId });

    const row = new ActionRowBuilder().addComponents(
      ...[1, 2, 3, 4, 5].map((n) =>
        new ButtonBuilder().setCustomId(`ticket:rate:${n}`).setLabel('★'.repeat(n)).setStyle(ButtonStyle.Secondary),
      ),
    );

    await channel.send({ embeds: [embed], components: [row], files: [html] });

    webhookPush('ticket_closed', {
      type: 'ticket_closed',
      guild: { id: guild.id, name: guild.name },
      ticketId,
      channelId: channel.id,
    }).catch(() => {});
  },

  /** 新增內部備忘錄 */
  async addMemo(interaction, ticketId, content) {
    webhookPush('ticket_memo', {
      type: 'ticket_memo',
      guild: { id: interaction.guild.id, name: interaction.guild.name },
      ticketId,
      content,
      addedBy: interaction.user.tag,
    }).catch(() => {});
  },

  async handleSelect(interaction) {
    // 可延伸：下拉式表單選單
  },
};
