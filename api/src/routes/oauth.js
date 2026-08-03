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
  if (!code) return res.status(400).send('缺少授權碼');

  try {
    const tokenRes = await fetch(`${DISCORD_API}/oauth2/token`, {
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
    if (!tokenRes.ok) {
      const detail = await tokenRes.text().catch(() => '');
      console.error(`[oauth] token exchange → ${tokenRes.status} ${detail}`);
      return res.status(502).send(`OAuth token 交換失敗（${tokenRes.status}）: ${detail}`);
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
