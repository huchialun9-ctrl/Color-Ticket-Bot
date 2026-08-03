import { config, DISCORD_API } from '../config.js';

/** 登入身分中間層：要求 session 內含 discord user */
export function requireAuth(req, res, next) {
  if (!req.session?.user) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  next();
}

/** Discord API 呼叫（OAuth2 Bearer token） */
export async function discordFetch(path, accessToken) {
  const base = DISCORD_API || 'https://discord.com/api/v10';
  const url = `${base}${path}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const text = await res.text().catch(() => '');
  if (!res.ok) {
    // 詳細日誌有助於判斷是 rate-limit / auth / service outage
    try {
      console.error('[discordFetch] error', { path, url, status: res.status, body: text, headers: Object.fromEntries(res.headers) });
    } catch (e) {
      console.error('[discordFetch] error (logging failed)', e);
    }
    const err = new Error(`Discord API ${path} → ${res.status}`);
    err.status = res.status;
    err.body = text;
    throw err;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** 檢查使用者是否具備該伺服器管理員權限（0x8 = ADMINISTRATOR） */
export function isGuildAdmin(guild, user) {
  if (!guild || !user) return false;
  if (guild.owner_id === user.id) return true;
  const member = guild.member?.[user.id];
  if (!member) return false;
  return (BigInt(member.permissions) & 0x8n) === 0x8n;
}
