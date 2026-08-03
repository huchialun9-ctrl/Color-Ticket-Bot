import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { getSettings, updateSettings } from '../modules/settings.js';
import { auditLog } from '../modules/automod/auditLog.js';

const KEYS = [
  'logChannelId',
  'securityWebhookUrl',
  'ticketing.supportRoleId',
  'ticketing.categoryId',
  'automod.tokenCapacity',
  'automod.warnThreshold',
];

export default {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('讀取/寫入伺服器設定')
    .addStringOption((o) =>
      o
        .setName('key')
        .setDescription('設定鍵')
        .setRequired(true)
        .addChoices(...KEYS.map((k) => ({ name: k, value: k }))),
    )
    .addStringOption((o) => o.setName('value').setDescription('設定值（留空為讀取）'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const key = interaction.options.getString('key');
    const value = interaction.options.getString('value');

    if (!value) {
      const current = await getSettings(interaction.guild.id);
      const found = key.split('.').reduce((acc, k) => acc?.[k], current);
      return interaction.reply({ content: `\`${key}\` = \`${found ?? '(未設定)'}\``, ephemeral: true });
    }

    const patch = {};
    const path = key.split('.');
    if (path.length === 1) patch[key] = value;
    else {
      const obj = {};
      let cursor = obj;
      for (let i = 0; i < path.length - 1; i++) {
        cursor[path[i]] = {};
        cursor = cursor[path[i]];
      }
      cursor[path[path.length - 1]] = value;
      patch[path[0]] = obj[path[0]];
    }

    await updateSettings(interaction.guild.id, patch);
    await interaction.reply({ content: `已更新 \`${key}\` = \`${value}\``, ephemeral: true });

    await auditLog(interaction.guild, 'mod_action', {
      action: 'config_update',
      key,
      value,
    });
  },
};
