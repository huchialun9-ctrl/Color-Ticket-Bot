import { EmbedBuilder } from 'discord.js';
import { getSettings } from '../settings.js';
import { webhookPush } from '../api/signer.js';

/**
 * 審查日誌：將結構化事件 Payload 推送到指定日誌頻道（Webhook）與 API。
 * Payload 格式遵循 docs/WEBHOOKS.md。
 */
export async function auditLog(guild, type, data) {
  const settings = await getSettings(guild.id);

  const payload = {
    type,
    version: 1,
    guild: { id: guild.id, name: guild.name },
    loggedAt: new Date().toISOString(),
    ...data,
  };

  // 推送至 API（HMAC 簽章）
  webhookPush('audit', payload).catch((err) => {
    console.error('[audit-log][api]', err.message);
  });

  // 推送至 Discord 日誌頻道
  if (settings.logChannelId) {
    const channel = guild.channels.cache.get(settings.logChannelId);
    if (channel?.isSendable()) {
      const embed = new EmbedBuilder()
        .setColor(0x36393f)
        .setAuthor({ name: `審查日誌 · ${type}` })
        .setDescription(formatDescription(payload))
        .setTimestamp();
      channel.send({ embeds: [embed] }).catch(() => {});
    }
  }
}

const KEY_MAP = {
  type: '事件類型',
  action: '行為/處置',
  key: '設定項目',
  value: '設定內容',
  member: '成員',
  detail: '詳細說明',
  userId: '使用者 ID',
  reason: '原因',
  amount: '數量/金額',
  channelId: '頻道 ID',
  operator: '執行人',
};

function formatDescription(payload) {
  return Object.entries(payload)
    .filter(([k]) => !['guild', 'loggedAt', 'version'].includes(k))
    .map(([k, v]) => `**${KEY_MAP[k] || k}**: \`${String(v ?? '').slice(0, 500)}\``)
    .join('\n');
}
