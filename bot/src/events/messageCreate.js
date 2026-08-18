import { Events, ChannelType, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { getSettings } from '../modules/settings.js';
import { tokenBucket } from '../modules/automod/tokenBucket.js';
import { auditLog } from '../modules/automod/auditLog.js';
import { MemberXP } from '../../../api/src/models/MemberXP.js';
import { checkPII } from '../modules/automod/piiSanitizer.js';

// 經驗值獲取冷卻（限制一分鐘一次防止洗版刷經驗）
const xpCooldowns = new Set();

export default {
  name: Events.MessageCreate,
  async execute(client, message) {
    if (message.author.bot) return;
    if (!message.guild) return;

    // ---- 0.1 跨頻道公告同步鏡像 (Auto Publish) ----
    if (message.channel.type === ChannelType.GuildAnnouncement) {
      const settings = await getSettings(message.guild.id);
      if (settings.autoPublish !== false) {
        // 延遲一點點，確保 webhook 或其他操作完成
        setTimeout(() => {
          message.crosspost().catch(() => {});
        }, 2000);
      }
    }

    // ---- 0. PII 敏感字詞與個資過濾 (Deep Sanitizer) ----
    const piiVerdict = checkPII(message.content);
    if (piiVerdict.hasPII) {
      await message.delete().catch(() => {});
      const warning = await message.channel.send(`⚠️ ${message.author} 您的訊息包含敏感個人個資或詐騙連結，已遭系統安全攔截！`).catch(() => {});
      setTimeout(() => warning.delete().catch(() => {}), 5000); // 5秒後自動刪除提示

      await auditLog(message.guild, 'security_alert', {
        member: message.author.tag,
        action: 'pii_sanitization',
        detail: `偵測並刪除敏感內容: ${piiVerdict.reason}`,
      });
      return;
    }

    const settings = await getSettings(message.guild.id);
    const cooldownKey = `${message.guild.id}-${message.author.id}`;

    // ---- 1. Token Bucket 防洗版 ----
    if (settings.automod?.enabled !== false) {
      const whitelist = settings.automod?.whitelist || [];
      const inWhitelist = whitelist.includes(message.channel.id) || message.member.roles.cache.some(role => whitelist.includes(role.id));
      
      if (!inWhitelist) {
        const verdict = tokenBucket.check(message.guild.id, message.author.id, message, settings.automod);
      if (verdict.blocked) {
        await message.delete().catch(() => {});
        await message.member
          ?.timeout(verdict.timeoutMs, '胖達CHubbMan: 權杖耗盡（防洗版）')
          .catch(() => {});

        await auditLog(message.guild, 'mod_action', {
          target: message.author.tag,
          action: 'auto_timeout',
          detail: `防洗版攔截：${verdict.reason}`,
        });
        await message.channel
          .send(
            `${message.author} 偵測到過量訊息，已暫停發言 ${Math.ceil(verdict.timeoutMs / 60000)} 分鐘。`,
          )
          .catch(() => {});
        return;
      }
      }
    }

    // ---- 2. 積分與等級系統 (Leveling & XP) ----
    if (!xpCooldowns.has(cooldownKey)) {
      xpCooldowns.add(cooldownKey);
      setTimeout(() => xpCooldowns.delete(cooldownKey), 60000); // 60秒冷卻

      const xpEarned = Math.floor(Math.random() * 11) + 15; // 隨機 15~25 點經驗值
      try {
        await MemberXP.findOneAndUpdate(
          { guildId: message.guild.id, userId: message.author.id },
          { 
            $inc: { xp: xpEarned, messageCount: 1 },
            $set: { lastXpEarnedAt: new Date() }
          },
          { upsert: true, new: true }
        ).then(async (doc) => {
          // 升級計算公式: level = 0.15 * sqrt(xp) + 1
          const nextLevel = Math.floor(0.15 * Math.sqrt(doc.xp)) + 1;
          if (nextLevel > doc.level) {
            doc.level = nextLevel;
            await doc.save();
            await message.channel
              .send(`🎉 恭喜 ${message.author} 活躍等級提升至 **Level ${nextLevel}**！`)
              .catch(() => {});
          }
        });
      } catch (err) {
        console.error('[messageCreate][leveling] 經驗值累加失敗', err.message);
      }
    }

    // ---- 3. 關鍵字自動回覆 (Keyword Auto-Responder) ----
    if (message.channel.name?.startsWith('ticket-')) {
      const autoResponses = settings.ticketing?.autoResponses || [];
      const text = message.content.toLowerCase();
      for (const res of autoResponses) {
        if (res.trigger && res.reply && text.includes(res.trigger.toLowerCase())) {
          const embed = new EmbedBuilder()
            .setColor(0x5865f2)
            .setTitle(`🤖 系統自動回覆：${res.trigger}`)
            .setDescription(res.reply)
            .setFooter({ text: '此為常見問題自動答覆' });
          await message.channel.send({ embeds: [embed] }).catch(() => {});
          break; // 僅觸發第一個匹配項
        }
      }
    }
  },
};
