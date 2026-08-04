import { Events, ChannelType, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { getSettings } from '../modules/settings.js';
import { tokenBucket } from '../modules/automod/tokenBucket.js';
import { auditLog } from '../modules/automod/auditLog.js';

export default {
  name: Events.MessageCreate,
  async execute(client, message) {
    if (message.author.bot) return;
    if (!message.guild) return;

    const settings = await getSettings(message.guild.id);

    // ---- Token Bucket 防洗版 ----
    if (settings.automod?.enabled !== false) {
      const verdict = tokenBucket.check(message.guild.id, message.author.id, message, settings.automod);
      if (verdict.blocked) {
        await message.delete().catch(() => {});
        await message.member
          ?.timeout(verdict.timeoutMs, 'CHubb-Man: 權杖耗盡（防洗版）')
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

    // ---- 關鍵字自動回覆 (Keyword Auto-Responder) ----
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
