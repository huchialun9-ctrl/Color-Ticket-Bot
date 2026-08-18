import { InviteTracker } from '../../../../api/src/models/InviteTracker.js';
import { isDBReady } from '../../db.js';

// 記憶體中暫存邀請連結資訊： Map<guildId, Map<inviteCode, uses>>
const invitesCache = new Map();

/** 載入並快取特定伺服器的邀請連結 */
export async function cacheGuildInvites(guild) {
  try {
    if (!guild.members.me.permissions.has('ManageGuild')) return;
    const invites = await guild.invites.fetch().catch(() => null);
    if (!invites) return;

    const guildInvites = new Map();
    for (const invite of invites.values()) {
      guildInvites.set(invite.code, invite.uses);
      
      // 同步寫入資料庫 InviteTracker 以供統計
      if (isDBReady()) {
        await InviteTracker.findOneAndUpdate(
          { guildId: guild.id, code: invite.code },
          { 
            $set: { 
              uses: invite.uses, 
              inviterId: invite.inviter?.id || null 
            }
          },
          { upsert: true }
        ).catch(() => {});
      }
    }
    invitesCache.set(guild.id, guildInvites);
  } catch (err) {
    console.error(`[invites-cache] 快取伺服器 ${guild.name} 邀請連結失敗`, err.message);
  }
}

/** 初始化載入所有伺服器的邀請快取 */
export async function initInviteCache(client) {
  console.log('[invites-cache] 開始初始化全域邀請快取...');
  for (const guild of client.guilds.cache.values()) {
    await cacheGuildInvites(guild);
  }
  console.log('[invites-cache] 全域邀請快取初始化完成');
}

/** 比對並找出新成員使用的邀請代碼 */
export async function trackUsedInvite(guild) {
  try {
    if (!guild.members.me.permissions.has('ManageGuild')) return null;
    const currentInvites = await guild.invites.fetch().catch(() => null);
    if (!currentInvites) return null;

    const cached = invitesCache.get(guild.id);
    invitesCache.set(guild.id, new Map(currentInvites.map((i) => [i.code, i.uses])));

    if (!cached) return null;

    for (const invite of currentInvites.values()) {
      const cachedUses = cached.get(invite.code);
      if (cachedUses !== undefined && invite.uses > cachedUses) {
        // 找到使用的邀請連結！更新資料庫使用數
        if (isDBReady()) {
          await InviteTracker.findOneAndUpdate(
            { guildId: guild.id, code: invite.code },
            { $set: { uses: invite.uses } }
          ).catch(() => {});
        }
        return invite;
      }
    }
  } catch (err) {
    console.error('[invites-cache] 追蹤邀請連結出錯', err.message);
  }
  return null;
}
