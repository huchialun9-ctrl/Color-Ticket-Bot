import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { auditLog } from '../modules/automod/auditLog.js';

export default {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('批次清理訊息')
    .addIntegerOption((o) => o.setName('amount').setDescription('數量（1–100）').setMinValue(1).setMaxValue(100).setRequired(true))
    .addUserOption((o) => o.setName('user').setDescription('僅刪除特定成員'))
    .addStringOption((o) =>
      o
        .setName('filter')
        .setDescription('過濾條件')
        .addChoices(
          { name: '全部', value: 'all' },
          { name: '僅 Bot', value: 'bot' },
          { name: '含附件', value: 'attachments' },
        ),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const amount = interaction.options.getInteger('amount');
    const target = interaction.options.getUser('user');
    const filter = interaction.options.getString('filter') || 'all';

    const channel = interaction.channel;
    const messages = await channel.messages.fetch({ limit: 100 });

    let toDelete = [...messages.values()]
      .filter((m) => {
        if (target && m.author.id !== target.id) return false;
        if (filter === 'bot' && !m.author.bot) return false;
        if (filter === 'attachments' && m.attachments.size === 0) return false;
        // Discord 限制：僅能刪除 14 天內訊息
        return Date.now() - m.createdTimestamp < 14 * 24 * 3600 * 1000;
      })
      .slice(0, amount);

    // Discord API 限制單次 bulkDelete 100 則
    await channel.bulkDelete(toDelete, true).catch(async () => {
      for (const m of toDelete) await m.delete().catch(() => {});
    });

    const reply = await interaction.reply({
      content: `已清理 ${toDelete.length} 則訊息。`,
      ephemeral: true,
    });
    setTimeout(() => reply.delete().catch(() => {}), 5000);

    await auditLog(interaction.guild, 'mod_action', {
      action: 'purge',
      channel: channel.name,
      amount: toDelete.length,
      filter,
    });
  },
};
