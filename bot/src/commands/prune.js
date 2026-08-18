import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { auditLog } from '../modules/automod/auditLog.js';

export default {
  data: new SlashCommandBuilder()
    .setName('prune')
    .setDescription('清理幽靈帳號/死水成員 (自動踢除長時間未上線者)')
    .addIntegerOption((o) => o.setName('days').setDescription('超過幾天未登入 (1~30)').setRequired(true).setMinValue(1).setMaxValue(30))
    .addBooleanOption((o) => o.setName('dry_run').setDescription('僅試算人數，不實際踢人 (預設 true)').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  async execute(interaction) {
    const days = interaction.options.getInteger('days');
    const dryRun = interaction.options.getBoolean('dry_run') ?? true; // 預設為 true 保護機制

    await interaction.deferReply({ ephemeral: true });

    try {
      if (dryRun) {
        // 僅計算人數
        const count = await interaction.guild.members.prune({ days, dry: true, reason: '試算幽靈帳號清理' });
        
        const embed = new EmbedBuilder()
          .setColor(0x3498db)
          .setTitle('👻 幽靈帳號清理試算')
          .setDescription(`若清理 **超過 ${days} 天** 未登入的無身分組成員，將會有 **${count}** 人被踢除。\n\n*提示：如果要執行實際踢除，請加上 \`dry_run: False\`。*`);
        
        return interaction.editReply({ embeds: [embed] });
      } else {
        // 實際踢除
        const count = await interaction.guild.members.prune({ days, dry: false, reason: `${interaction.user.tag} 執行幽靈帳號清理` });
        
        const embed = new EmbedBuilder()
          .setColor(0xe74c3c)
          .setTitle('🧹 幽靈帳號清理完畢')
          .setDescription(`已成功清理 **${count}** 名超過 **${days} 天** 未登入的無身分組死水成員！`);

        await auditLog(interaction.guild, 'mod_action', {
          action: 'prune_members',
          target: '多名幽靈帳號',
          moderator: interaction.user.tag,
          detail: `移除了 ${count} 名超過 ${days} 天未登入的成員`,
        });
        
        return interaction.editReply({ embeds: [embed] });
      }
    } catch (err) {
      console.error('[prune]', err.message);
      await interaction.editReply({ content: '清理失敗，可能是權限不足或伺服器人數過多。' });
    }
  },
};
