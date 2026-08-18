import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Guild } from '../../../api/src/models/Guild.js';
import { UserEconomy } from '../../../api/src/models/UserEconomy.js';
import { MemberXP } from '../../../api/src/models/MemberXP.js';

export default {
  data: new SlashCommandBuilder()
    .setName('global')
    .setDescription('🌐 跨群聊天網路專屬指令')
    .addSubcommand(sub =>
      sub
        .setName('stats')
        .setDescription('查看目前跨群網路的連線狀態與規模')
    )
    .addSubcommand(sub =>
      sub
        .setName('profile')
        .setDescription('查看某人的全網通行證 (跨群資料)')
        .addUserOption(o => o.setName('user').setDescription('選擇要查看的使用者').setRequired(false))
    )
    .addSubcommand(sub =>
      sub
        .setName('block')
        .setDescription('【管理員】在跨群網路中屏蔽特定外來玩家的訊息')
        .addUserOption(o => o.setName('user').setDescription('選擇要屏蔽的使用者').setRequired(true))
    )
    .addSubcommand(sub =>
      sub
        .setName('unblock')
        .setDescription('【管理員】解除對外來跨群玩家的屏蔽')
        .addUserOption(o => o.setName('user').setDescription('選擇要解除屏蔽的使用者').setRequired(true))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'stats') {
      try {
        const allGuilds = await Guild.find({ globalChatChannelId: { $exists: true, $ne: null } });
        const embed = new EmbedBuilder()
          .setColor(0x00BFFF)
          .setTitle('🌐 CHubbMan 全球跨群網路狀態')
          .setDescription(`目前總共有 **${allGuilds.length}** 個伺服器正在連線中！\n只要在這些伺服器的專屬頻道發言，所有人都能看見您的聲音。`)
          .setThumbnail(interaction.client.user.displayAvatarURL())
          .setTimestamp();
        
        return interaction.reply({ embeds: [embed] });
      } catch (err) {
        return interaction.reply({ content: '❌ 無法獲取連線數據。', ephemeral: true });
      }
    }

    if (sub === 'profile') {
      const targetUser = interaction.options.getUser('user') || interaction.user;
      try {
        // Aggregate global economy
        const ecoDocs = await UserEconomy.find({ userId: targetUser.id });
        const totalBalance = ecoDocs.reduce((acc, curr) => acc + curr.balance, 0);

        // Aggregate global XP
        const xpDocs = await MemberXP.find({ userId: targetUser.id });
        const totalXP = xpDocs.reduce((acc, curr) => acc + curr.xp, 0);
        const serversActive = xpDocs.length;

        const embed = new EmbedBuilder()
          .setColor(0x2b2d31)
          .setAuthor({ name: `${targetUser.tag} 的全網通行證`, iconURL: targetUser.displayAvatarURL({ dynamic: true }) })
          .addFields(
            { name: '🌐 活躍伺服器數', value: `${serversActive} 個群組`, inline: true },
            { name: '💰 全網總資產', value: `$${totalBalance.toLocaleString()}`, inline: true },
            { name: '✨ 全網總經驗值', value: `${totalXP.toLocaleString()} XP`, inline: true }
          )
          .setFooter({ text: '此數據由胖達聯網中心跨群彙整' });

        return interaction.reply({ embeds: [embed] });
      } catch (err) {
        return interaction.reply({ content: '❌ 無法獲取玩家資料。', ephemeral: true });
      }
    }

    if (sub === 'block' || sub === 'unblock') {
      const { Guild } = await import('../../../api/src/models/Guild.js');
      const targetUser = interaction.options.getUser('user');

      if (!interaction.member.permissions.has('ManageGuild')) {
        return interaction.reply({ content: '❌ 您必須具備「管理伺服器」權限才能封鎖跨群用戶！', ephemeral: true });
      }

      try {
        const guildData = await Guild.findOne({ guildId: interaction.guildId });
        let blocked = guildData.globalBlockedUsers || [];
        
        if (sub === 'block') {
          if (!blocked.includes(targetUser.id)) blocked.push(targetUser.id);
          await Guild.updateOne({ guildId: interaction.guildId }, { $set: { globalBlockedUsers: blocked } });
          return interaction.reply({ content: `✅ 成功封鎖 **${targetUser.tag}**！\n他的任何跨群訊息將不再轉發至本伺服器。`, ephemeral: true });
        } else {
          blocked = blocked.filter(id => id !== targetUser.id);
          await Guild.updateOne({ guildId: interaction.guildId }, { $set: { globalBlockedUsers: blocked } });
          return interaction.reply({ content: `✅ 已解除對 **${targetUser.tag}** 的封鎖！`, ephemeral: true });
        }
      } catch (e) {
        return interaction.reply({ content: '❌ 封鎖操作失敗，資料庫異常。', ephemeral: true });
      }
    }
  }
};
