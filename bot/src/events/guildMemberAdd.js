import { Events, EmbedBuilder } from 'discord.js';
import { GlobalBlacklist } from '../../../api/src/models/GlobalBlacklist.js';
import { WelcomeCard } from '../../../api/src/models/WelcomeCard.js';
import { auditLog } from '../modules/automod/auditLog.js';
import { trackUsedInvite } from '../modules/invites/inviteCache.js';

export default {
  name: Events.GuildMemberAdd,
  async execute(client, member) {
    try {
      const { getSettings } = await import('../modules/settings.js');
      const settings = await getSettings(member.guild.id);

      // ---- -1. 機器人白名單管控 ----
      if (member.user.bot) {
        const whitelist = settings.automod?.botWhitelist || [];
        if (!whitelist.includes(member.id)) {
          console.warn(`[gatekeeper] 未授權機器人嘗試加入: ${member.user.tag}`);
          await member.kick('胖達CHubbMan: 機器人白名單管控 (未授權機器人自動踢除)').catch(() => {});
          await auditLog(member.guild, 'security_alert', {
            member: member.user.tag,
            action: 'bot_whitelist_block',
            detail: '未授權的機器人嘗試加入伺服器，已自動踢除。',
          });
        }
        return; // 無論是否授權，機器人都跳過後續人類驗證流程
      }

      // ---- 0. 新帳號快速封鎖 (Account Age Filter) ----
      const minAgeDays = settings.automod?.minAccountAgeDays || 0;
      
      if (minAgeDays > 0) {
        const accountAgeMs = Date.now() - member.user.createdTimestamp;
        const requiredMs = minAgeDays * 24 * 60 * 60 * 1000;
        
        if (accountAgeMs < requiredMs) {
          console.warn(`[gatekeeper] 新帳號攔截: ${member.user.tag} 註冊時間過短`);
          await member.send(`您好，因為伺服器啟用了安全防護機制，您的 Discord 帳號註冊時間必須大於 ${minAgeDays} 天才能加入此伺服器。請稍後再來！`).catch(() => {});
          await member.kick('胖達CHubbMan: 帳號註冊時間未達門檻 (Anti-Raid)').catch(() => {});
          await auditLog(member.guild, 'security_alert', {
            member: member.user.tag,
            action: 'new_account_block',
            detail: `帳號建立未滿 ${minAgeDays} 天被自動拒絕加入`,
          });
          return;
        }
      }
    } catch (err) {
      console.error('[guildMemberAdd][accountAge] check error', err.message);
    }

    // ---- 1. 跨伺服器黑名單全域共享網絡比對 ----
    try {
      const record = await GlobalBlacklist.findOne({ userId: member.id });
      if (record) {
        console.warn(`[blacklist] 偵測到聯防黑名單成員加入: ${member.user.tag} (ID: ${member.id})`);
        await member.kick(`胖達CHubbMan 聯防共享黑名單自動剔除，原因: ${record.reason}`).catch(() => {});
        await auditLog(member.guild, 'security_alert', {
          member: member.user.tag,
          action: 'blacklist_block',
          detail: `聯防黑名單阻擋入群：成員已被列於聯防黑名單中，原因：${record.reason}`,
        });
        return; // 被踢出後不發送歡迎訊息
      }
    } catch (err) {
      console.error('[guildMemberAdd][blacklist] check error', err.message);
    }

    // ---- 2. 邀請人來源追蹤 ----
    let inviteInfo = '自然搜尋 / 其他連結';
    const usedInvite = await trackUsedInvite(member.guild);
    if (usedInvite) {
      const inviterTag = usedInvite.inviter ? usedInvite.inviter.tag : '未知邀請人';
      inviteInfo = `由 **${inviterTag}** 邀請加入 (使用代碼: \`${usedInvite.code}\`)`;
    }

    // ---- 3. 自定義歡迎卡片與通報 ----
    try {
      const card = await WelcomeCard.findOne({ guildId: member.guild.id });
      if (card && card.enabled && card.channelId) {
        const welcomeChannel = member.guild.channels.cache.get(card.channelId);
        if (welcomeChannel && welcomeChannel.isTextBased()) {
          const embed = new EmbedBuilder()
            .setColor(0x5865f2)
            .setTitle(`👋 歡迎新成員加入！`)
            .setDescription(`${card.customText}\n\n歡迎 ${member} 來到 **${member.guild.name}**！`)
            .addFields(
              { name: '邀請來源 📌', value: inviteInfo, inline: true },
              { name: '成員序位 👥', value: `第 ${member.guild.memberCount} 位成員`, inline: true }
            )
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setImage(card.backgroundUrl)
            .setTimestamp();

          await welcomeChannel.send({ embeds: [embed] }).catch(() => {});
        }
      }
    } catch (err) {
      console.error('[guildMemberAdd][welcome] send error', err.message);
    }
  },
};
