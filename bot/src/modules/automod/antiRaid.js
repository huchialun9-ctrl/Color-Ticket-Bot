import { auditLog } from './auditLog.js';
import { getSettings } from '../settings.js';
import { pushSecurityAlert } from '../api/signer.js';

/**
 * Anti-Raid 防爆破。
 * 監控滑動視窗內新帳號（<30 天）湧入，超過閾值即觸發緊急安全鎖定，
 * 並經 Webhook（HMAC 簽章）推送緊急安全警報至儀表板。
 */
class AntiRaid {
  constructor() {
    this.joins = new Map(); // guildId → number[] (epoch ms)
    this.lockedGuilds = new Set();
  }

  async handleMemberAdd(member) {
    const settings = await getSettings(member.guild.id);
    const raid = settings.automod?.raid || {};
    const windowMs = raid.windowMs || 60000;
    const threshold = raid.threshold || 10;
    const maxAgeMs = 30 * 24 * 3600 * 1000;

    const isNewAccount = Date.now() - member.user.createdTimestamp < maxAgeMs;
    const now = Date.now();

    const list = (this.joins.get(member.guild.id) || []).filter((t) => now - t < windowMs);
    if (isNewAccount) list.push(now);
    this.joins.set(member.guild.id, list);

    if (list.length < threshold) return;

    // 已鎖定則不重複觸發（冷卻）
    if (this.lockedGuilds.has(member.guild.id)) return;
    this.lockedGuilds.add(member.guild.id);
    setTimeout(() => this.lockedGuilds.delete(member.guild.id), windowMs * 10);

    await this.lockdown(member.guild);
    await pushSecurityAlert(member.guild, {
      joinsInWindow: list.length,
      threshold,
      windowMs,
      detected: list.slice(-threshold),
    });
    await auditLog(member.guild, 'security_alert', {
      joins: list.length,
      action: 'guild_lockdown',
    });
  }

  async lockdown(guild) {
    // 啟用驗證門檻作為緊急安全鎖定（實作可延伸至逐頻道權限撤銷）
    await guild.setVerificationLevel(3, 'CHubb-Man: 偵測到潛在爆破攻擊').catch(() => {});
    console.warn(`[anti-raid] ${guild.name} 已啟用最高驗證等級`);
  }
}

export const antiRaid = new AntiRaid();
