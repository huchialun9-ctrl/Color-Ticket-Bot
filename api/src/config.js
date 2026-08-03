import 'dotenv/config';
import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'node:url';
loadEnv({ path: fileURLToPath(new URL('../../.env', import.meta.url)) });

const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:4000';

export const config = {
  port: Number(process.env.API_PORT) || 4000,
  apiBaseUrl,
  // 生產環境網站即 API 本身 → webBaseUrl 預設沿用 API 位址
  webBaseUrl: process.env.WEB_BASE_URL || apiBaseUrl,
  discordClientId: process.env.DISCORD_CLIENT_ID,
  discordClientSecret: process.env.DISCORD_CLIENT_SECRET,
  // OAuth 重定向 URI：明確設定時使用；未設定時由 oauth.js 依請求 host 自動推導
  redirectUri: process.env.OAUTH_REDIRECT_URI || null,
  sessionSecret: process.env.SESSION_SECRET || 'dev_session_secret',
  mongodbUri: process.env.MONGODB_URI,
  redisUrl: process.env.REDIS_URL,
  cacheTtlSeconds: Number(process.env.CACHE_TTL_SECONDS) || 30,
  hmacSecret: process.env.HMAC_SECRET,
  pluginScanEnabled: process.env.PLUGIN_SCAN_ENABLED === 'true',
};

export const DISCORD_API = 'https://discord.com/api/v10';
