import { config, DISCORD_API } from '../config.js';

/** 登入身分中間層：要求 session 內含 discord user */
export function requireAuth(req, res, next) {
  if (!req.session?.user) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  next();
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseRetryAfter(res) {
  // Retry-After can be seconds or HTTP-date. Prefer numeric headers.
  const ra = res.headers.get('retry-after') || res.headers.get('x-ratelimit-reset-after');
  if (!ra) return null;
  const n = Number(ra);
  if (!Number.isNaN(n)) return Math.ceil(n * 1000);
  const t = Date.parse(ra);
  if (!Number.isNaN(t)) return Math.max(0, t - Date.now());
  return null;
}

/** Discord API 呼叫（OAuth2 Bearer token）
 *  - 自動處理 429 / 5xx 的簡單重試（尊重 Retry-After）
 *  - 失敗時拋出帶有 status 與 body 的錯誤
 *  - 讀取 BOT_TOKEN 或 DISCORD_BOT_TOKEN 作為 Bot token 備援
 */
export async function discordFetch(path, accessToken, { maxRetries = Number(process.env.DISCORD_FETCH_MAX_RETRIES || 3) } = {}) {
  const base = DISCORD_API || 'https://discord.com/api/v10';
  const BOT_TOKEN = process.env.BOT_TOKEN || process.env.DISCORD_BOT_TOKEN || null;
  let attempt = 0;

  // Helper to actually perform fetch with a given auth header
  async function doFetch(authHeader) {
    const url = `${base}${path}`;
    let res;
    try {
      res = await fetch(url, { headers: { Authorization: authHeader } });
    } catch (networkErr) {
      // Network-level error (DNS, connectivity) - may retry
      console.error('[discordFetch] network error', { path, url, err: networkErr });
      throw networkErr;
    }

    const text = await res.text().catch(() => '');
    if (res.ok) {
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    }

    // Not OK: log details
    try {
      console.error('[discordFetch] error', { path, url, status: res.status, body: text, headers: Object.fromEntries(res.headers) });
    } catch (e) {
      console.error('[discordFetch] logging failed', e);
    }

    const err = new Error(`Discord API ${path} → ${res.status}`);
    err.status = res.status;
    err.body = text;
    throw err;
  }

  while (true) {
    attempt += 1;
    const tryBot = Boolean(BOT_TOKEN && attempt === 1 && accessToken && accessToken.startsWith('Bot') === false);
    // if accessToken looks like a Bot token already, don't mix
    const authHeader = tryBot ? `Bot ${BOT_TOKEN}` : accessToken.startsWith('Bot') ? `Bot ${accessToken}` : `Bearer ${accessToken}`;

    try {
      const result = await doFetch(authHeader);
      return result;
    } catch (err) {
      // network errors (no response) are stringified earlier; convert
      const status = err.status || (err.name === 'FetchError' ? 502 : undefined);

      // Determine if we should retry: rate limit (429) or server error (5xx) or network error
      const shouldRetry = (status === 429 || (status >= 500 && status < 600) || status === 502 || !status) && attempt <= maxRetries;
      if (shouldRetry) {
        const backoff = Math.pow(2, attempt) * 500;
        const waitMs = backoff;
        console.warn(`[discordFetch] retrying ${path} after ${waitMs}ms (status ${status}, attempt ${attempt})`);
        await sleep(waitMs);
        continue;
      }

      // No retry: throw error with details
      throw err;
    }
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
