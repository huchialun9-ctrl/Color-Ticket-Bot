import { Router } from 'express';
import { config, DISCORD_API } from '../config.js';
import { requireAuth, discordFetch } from '../middleware/auth.js';

export const oauthRouter = Router();

const SCOPES = ['identify', 'guilds', 'guilds.members.read'].join(' ');

/** 依請求來源自動推導對外網址（Render/VPS 皆免設定） */
const requestOrigin = (req) => `${req.protocol}://${req.get('host')}`;
/** 重定向 URI：優先取明確設定，否則由請求 host 推導 */
const redirectUriFor = (req) => config.redirectUri || `${requestOrigin(req)}/api/oauth/callback`;

/** 導向 Discord 授權頁 */
oauthRouter.get('/login', (req, res) => {
  const params = new URLSearchParams({
    client_id: config.discordClientId,
    redirect_uri: redirectUriFor(req),
    response_type: 'code',
    scope: SCOPES,
  });
  res.redirect(`${DISCORD_API}/oauth2/authorize?${params}`);
});

/** OAuth2 callback：換 token → 取使用者 → 寫入 session */
oauthRouter.get('/callback', async (req, res) => {
  const code = req.query.code;
  const discordError = req.query.error;

  // Discord 拒絕/取消授權時會帶 error 參數回來
  if (discordError) {
    const detail = req.query.error_description ? `（${req.query.error_description}）` : '';
    return res.status(400).send(`Discord 授權被拒絕：${discordError} ${detail}`);
  }

  if (!code) return res.status(400).send('缺少授權碼：請回到首頁點「使用 Discord 登入」完成授權流程');

  try {
    let tokenRes;
    let attempts = 0;
    const maxAttempts = 3;
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    while (attempts < maxAttempts) {
      attempts++;
      try {
        tokenRes = await fetch(`${DISCORD_API}/oauth2/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: config.discordClientId,
            client_secret: config.discordClientSecret,
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUriFor(req),
          }),
        });
        if (tokenRes.status === 429 && attempts < maxAttempts) {
          console.warn(`[oauth] 遭遇 Discord 頻率限制 (429/1015)，正在進行第 ${attempts} 次自動重試...`);
          await delay(attempts * 1200);
          continue;
        }
        break;
      } catch (err) {
        if (attempts >= maxAttempts) throw err;
        await delay(attempts * 1200);
      }
    }

    if (!tokenRes.ok) {
      const detail = await tokenRes.text().catch(() => '');
      console.error(`[oauth] token exchange → ${tokenRes.status} ${detail}`);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(502).send(`
        <div style="font-family: system-ui, sans-serif; text-align: center; padding: 50px; background: #090a0f; color: #f5f6f8; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; margin: 0; box-sizing: border-box;">
          <h2 style="color: #ff4757; margin-bottom: 10px;">登入連線頻率受限 (Error 429/1015)</h2>
          <p style="max-width: 500px; color: #a0a0a0; line-height: 1.6; font-size: 15px; margin-bottom: 20px;">
            此錯誤是因為您的雲端主機 (如 Render) 與其他程式<strong>共享了同一個對外 IP</strong>，導致該 IP 被 Discord (Cloudflare) 暫時進行安全頻率限制。
          </p>
          <div style="background: #12141a; padding: 16px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.07); margin-bottom: 30px; font-size: 14px; color: #3b9af5; line-height: 1.5;">
            <strong>如何解決：</strong> 請等待約 5 ~ 10 秒後，重新整理本頁面，或回到首頁再次嘗試登入即可！
          </div>
          <a href="/" style="color: #f5f6f8; background: #5865f2; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px; transition: background 0.2s;">回到首頁</a>
        </div>
      `);
    }
    const tokens = await tokenRes.json();

    const user = await discordFetch('/users/@me', tokens.access_token);

    req.session.user = {
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      accessToken: tokens.access_token,
    };

    // 登入後回前端：優先 WEB_BASE_URL，否則沿用請求來源
    res.redirect(process.env.WEB_BASE_URL || requestOrigin(req));
  } catch (err) {
    console.error('[oauth]', err);
    res.status(500).send(`OAuth 授權失敗：${err.message}`);
  }
});

oauthRouter.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect(config.webBaseUrl));
});

/** 目前登入者 */
oauthRouter.get('/me', requireAuth, (req, res) => {
  const { id, username, avatar } = req.session.user;
  res.json({ id, username, avatar });
});

/** 可管理的伺服器清單（具管理員權限者） */
oauthRouter.get('/guilds', requireAuth, async (req, res) => {
  try {
    const guilds = await discordFetch('/users/@me/guilds', req.session.user.accessToken);
    const manageable = guilds.filter((g) => (BigInt(g.permissions) & 0x8n) === 0x8n);
    res.json({ guilds: manageable });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

/** 機器人邀請連結（bot + applications.commands scope） */
oauthRouter.get('/invite', requireAuth, (req, res) => {
  const permissions =
    1n + // CreateInstantInvite
    2n + // KickMembers
    4n + // BanMembers
    16n + // ManageChannels
    2048n + // SendMessages
    65536n + // ReadMessageHistory
    268435456n + // ManageRoles
    536870912n + // ManageWebhooks
    1099511627776n; // ModerateMembers
  const params = new URLSearchParams({
    client_id: config.discordClientId,
    scope: 'bot applications.commands',
    permissions: permissions.toString(),
  });
  res.json({ url: `${DISCORD_API}/oauth2/authorize?${params}` });
});
