import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { getSettings, updateSettings } from '../modules/settings.js';
import { isDBReady } from '../db.js';

export default {
  data: new SlashCommandBuilder()
    .setName('automod')
    .setDescription('管理 AutoMod 防洗版與警告閾值防護機制')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName('status')
        .setDescription('查看目前的 AutoMod 安全閾值設定')
    )
    .addSubcommand((sub) =>
      sub
        .setName('setup')
        .setDescription('調整防洗版權杖與警告禁言閾值')
        .addIntegerOption((o) =>
          o
            .setName('warn_threshold')
            .setDescription('累積警告達幾次時自動執行禁言 (預設 3 次)')
            .setMinValue(1)
        )
        .addIntegerOption((o) =>
          o
            .setName('token_capacity')
            .setDescription('防洗版權杖桶容量上限，越低防護越嚴格 (預設 8)')
            .setMinValue(2)
        )
    ),

  async execute(interaction) {
    if (!isDBReady()) {
      return interaction.reply({ content: '❌ 資料庫未就緒，請稍後再試！', ephemeral: true });
    }

    const { guildId, options } = interaction;
    const sub = options.getSubcommand();

    try {
      const current = await getSettings(guildId);
      const automod = current.automod || {};

      if (sub === 'status') {
        const embed = new EmbedBuilder()
          .setColor(0xe74c3c)
          .setTitle('🛡️ AutoMod 防護機制閥值狀態')
          .addFields(
            { name: '⚠️ 禁言警告次數上限 (warnThreshold)', value: `\`${automod.warnThreshold ?? 3}\` 次`, inline: true },
            { name: '🎟️ 防洗版桶權杖容量 (tokenCapacity)', value: `\`${automod.tokenCapacity ?? 8}\` 枚`, inline: true }
          )
          .setTimestamp();

        return interaction.reply({ embeds: [embed] });
      }

      if (sub === 'setup') {
        const warnThreshold = options.getInteger('warn_threshold');
        const tokenCapacity = options.getInteger('token_capacity');

        const patch = { ...automod };
        if (warnThreshold !== null) patch.warnThreshold = warnThreshold;
        if (tokenCapacity !== null) patch.tokenCapacity = tokenCapacity;

        await updateSettings(guildId, { automod: patch });
        return interaction.reply({
          content: `✅ AutoMod 機制已更新！\n• 警告禁言次數閾值：**${patch.warnThreshold ?? 3}** 次\n• 洗版權杖桶容量上限：**${patch.tokenCapacity ?? 8}**`,
        });
      }
    } catch (err) {
      console.error('[command][automod] error', err);
      return interaction.reply({ content: '❌ 執行 AutoMod 指令時發生錯誤。', ephemeral: true });
    }
  },
};
