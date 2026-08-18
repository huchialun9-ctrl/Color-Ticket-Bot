import { Events } from 'discord.js';
import { RoleExclusion } from '../../../api/src/models/RoleExclusion.js';
import { auditLog } from '../modules/automod/auditLog.js';
import { isDBReady } from '../db.js';

export default {
  name: Events.GuildMemberUpdate,
  async execute(client, oldMember, newMember) {
    if (!isDBReady()) return;

    // 找出新獲得的身分組
    const addedRoles = newMember.roles.cache.filter((role) => !oldMember.roles.cache.has(role.id));
    if (addedRoles.size === 0) return;

    try {
      // 獲取該伺服器的所有身分組互斥鎖規則
      const rules = await RoleExclusion.find({ guildId: newMember.guild.id });
      if (rules.length === 0) return;

      for (const role of addedRoles.values()) {
        for (const rule of rules) {
          // 如果新獲得的身分組在互斥規則清單內
          if (rule.roleIds.includes(role.id)) {
            // 找出成員身上有沒有「其他」也在此互斥規則清單內的身分組
            const conflictingRoleIds = rule.roleIds.filter(
              (rid) => rid !== role.id && newMember.roles.cache.has(rid)
            );

            if (conflictingRoleIds.length > 0) {
              console.log(`[roles-mutex] 偵測到身分組衝突：${newMember.user.tag} 已擁有互斥身分組，自動移除舊身分`);

              // 移除相衝突的舊身分組
              for (const rid of conflictingRoleIds) {
                await newMember.roles.remove(rid).catch(() => {});
                const oldRoleName = newMember.guild.roles.cache.get(rid)?.name || rid;
                
                await auditLog(newMember.guild, 'security_alert', {
                  member: newMember.user.tag,
                  action: 'role_mutex_trigger',
                  detail: `觸發身分組互斥鎖：獲得身分組 [${role.name}] 時，系統自動移除了相衝突的舊身分組 [${oldRoleName}]`
                });
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('[guildMemberUpdate][mutex] error', err.message);
    }
  },
};
