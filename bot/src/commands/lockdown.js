import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { auditLog } from '../modules/automod/auditLog.js';

export default {
  data: new SlashCommandBuilder()
    .setName('lockdown')
    .setDescription('一鍵鎖定/解鎖頻道')
    .addStringOption((o) =>
      o
        .setName('state')
        .setDescription('lock 或 unlock')
        .setRequired(true)
        .addChoices({ name: '鎖定', value: 'lock' }, { name: '解鎖', value: 'unlock' }),
    )
    .addStringOption((o) => o.setName('reason').setDescription('原因'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    const state = interaction.options.getString('state');
    const reason = interaction.options.getString('reason') || '未提供';
    const channel = interaction.channel;

    await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
      SendMessages: state === 'lock',
    });

    await interaction.reply({
      content: state === 'lock' ? `🔒 頻道已鎖定。原因：${reason}` : `🔓 頻道已解鎖。`,
      ephemeral: true,
    });

    await auditLog(interaction.guild, 'mod_action', {
      action: state === 'lock' ? 'lockdown' : 'unlock',
      channel: channel.name,
      reason,
    });
  },
};
