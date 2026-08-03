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
 */
export async function discordFetch(path, accessToken, { maxRetries = 3 } = {}) {
  const base = DISCORD_API || 'https://discord.com/api/v10';
  let attempt = 0;
  while (true) {
    attempt += 1;
    const url = `${base}${path}`;
    let res;
    try {
      res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch (networkErr) {
      // Network-level error (DNS, connectivity) - may retry
      console.error('[discordFetch] network error', { path, url, err: networkErr });
      if (attempt <= maxRetries) {
        const backoff = Math.pow(2, attempt) * 200;
        await sleep(backoff);
        continue;
      }
      const err = new Error(`Network error when calling Discord API ${path}`);
      err.status = 502;
      err.body = networkErr.message;
      throw err;
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

    const status = res.status;
    // Determine if we should retry: rate limit (429) or server error (5xx)
    const shouldRetry = (status === 429 || (status >= 500 && status < 600)) && attempt <= maxRetries;
    if (shouldRetry) {
      const retryAfterMs = parseRetryAfter(res) ?? Math.pow(2, attempt) * 500;
      console.warn(`[discordFetch] retrying ${path} after ${retryAfterMs}ms (status ${status}, attempt ${attempt})`);
      await sleep(retryAfterMs);
      continue;
    }

    // No retry: throw error with details
    const err = new Error(`Discord API ${path} → ${status}`);
    err.status = status;
    err.body = text;
    throw err;
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
