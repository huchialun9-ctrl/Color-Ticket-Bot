import { Router } from 'express';
import { config, DISCORD_API } from '../config.js';
import { requireAuth, discordFetch } from '../middleware/auth.js';

export const oauthRouter = Router();

const SCOPES = ['identify', 'guilds', 'guilds.members.read'].join(' ');

/** 導向 Discord 授權頁 */
oauthRouter.get('/login', (req, res) => {
  const params = new URLSearchParams({
    client_id: config.discordClientId,
    redirect_uri: config.redirectUri,
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
        redirect_uri: config.redirectUri,
      }),
    });
    if (!tokenRes.ok) throw new Error(`token exchange → ${tokenRes.status}`);
    const tokens = await tokenRes.json();

    const user = await discordFetch('/users/@me', tokens.access_token);

    req.session.user = {
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      accessToken: tokens.access_token,
    };

    res.redirect(config.webBaseUrl);
  } catch (err) {
    console.error('[oauth]', err.message);
    res.status(500).send('OAuth 授權失敗');
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
