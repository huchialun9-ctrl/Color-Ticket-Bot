import { Events } from 'discord.js';
import { auditLog } from '../modules/automod/auditLog.js';

export default {
  name: Events.MessageUpdate,
  async execute(client, oldMessage, newMessage) {
    if (oldMessage.author?.bot) return;
    if (!oldMessage.guild) return;
    if (oldMessage.content === newMessage.content) return;

    // 重新檢查編輯後的訊息是否包含違規內容 (Anti-Phishing / PII)
    const { checkPII } = await import('../modules/automod/piiSanitizer.js');
    const piiVerdict = checkPII(newMessage.content);
    if (piiVerdict.hasPII) {
      await newMessage.delete().catch(() => {});
      const warning = await newMessage.channel.send(`⚠️ ${newMessage.author} 您編輯後的訊息包含敏感個人個資或詐騙連結，已遭系統安全攔截！`).catch(() => {});
      setTimeout(() => warning.delete().catch(() => {}), 5000);
      
      await auditLog(newMessage.guild, 'security_alert', {
        member: newMessage.author.tag,
        action: 'pii_sanitization_edit',
        detail: `編輯訊息時偵測並刪除敏感內容: ${piiVerdict.reason}`,
      });
      return;
    }

    // 檢查 Emoji 數量
    const emojiRegex = /<a?:[a-zA-Z0-9_]+:\d+>|[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;
    const emojiCount = (newMessage.content.match(emojiRegex) || []).length;
    if (emojiCount > 15) {
      await newMessage.delete().catch(() => {});
      await newMessage.channel.send(`⚠️ ${newMessage.author} 編輯後的訊息包含過多表情符號！`).catch(() => {});
      return;
    }

    // 檢查超長訊息
    if (newMessage.content.length > 1500) {
      await newMessage.delete().catch(() => {});
      await newMessage.channel.send(`⚠️ ${newMessage.author} 編輯後的訊息過長，已遭攔截！`).catch(() => {});
      return;
    }

    await auditLog(newMessage.guild, 'message_edit', {
      channel: newMessage.channel.name,
      authorId: newMessage.author.id,
      before: oldMessage.content?.slice(0, 1000) || '',
      after: newMessage.content?.slice(0, 1000) || '',
    });
  },
};
