import { config } from '../config.js';

/** 登入身分中間層：要求 session 內含 discord user */
export function requireAuth(req, res, next) {
  if (!req.session?.user) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  next();
}

/** Discord API 呼叫（OAuth2 Bearer token） */
export async function discordFetch(path, accessToken) {
  const res = await fetch(`${config.DISCORD_API}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Discord API ${path} → ${res.status}`);
  return res.json();
}

/** 檢查使用者是否具備該伺服器管理員權限（0x8 = ADMINISTRATOR） */
export function isGuildAdmin(guild, user) {
  if (!guild || !user) return false;
  if (guild.owner_id === user.id) return true;
  const member = guild.member?.[user.id];
  if (!member) return false;
  return (BigInt(member.permissions) & 0x8n) === 0x8n;
}
