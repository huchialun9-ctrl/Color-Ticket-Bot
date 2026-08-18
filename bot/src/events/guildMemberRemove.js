import { Events, EmbedBuilder } from 'discord.js';
import { getSettings } from '../modules/settings.js';
import { auditLog } from '../modules/automod/auditLog.js';

export default {
  name: Events.GuildMemberRemove,
  async execute(client, member) {
    try {
      const settings = await getSettings(member.guild.id);
      
      // 1. 發送系統審查日誌
      await auditLog(member.guild, 'security_alert', {
        member: member.user.tag,
        action: 'member_leave',
        detail: `成員已退出伺服器，目前剩餘人數：${member.guild.memberCount}`
      });

      // 2. 如果設定了日誌頻道，發送通知
      if (settings.logChannelId) {
        const logChannel = member.guild.channels.cache.get(settings.logChannelId);
        if (logChannel && logChannel.isTextBased()) {
          const embed = new EmbedBuilder()
            .setColor(0xff4757)
            .setTitle('🏃‍♂️ 成員退出伺服器通報')
            .setDescription(`**${member.user.tag}** 已退出了伺服器或被踢出。`)
            .addFields(
              { name: '目前伺服器總人數', value: `${member.guild.memberCount} 人`, inline: true }
            )
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setTimestamp();

          await logChannel.send({ embeds: [embed] }).catch(() => {});
        }
      }
    } catch (err) {
      console.error('[guildMemberRemove] log error', err.message);
    }
  },
};
