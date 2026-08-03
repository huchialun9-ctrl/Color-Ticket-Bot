import 'dotenv/config';
import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'node:url';
loadEnv({ path: fileURLToPath(new URL('../../.env', import.meta.url)) });

export const config = {
  port: Number(process.env.API_PORT) || 4000,
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:4000',
  webBaseUrl: process.env.WEB_BASE_URL || 'http://localhost:5173',
  discordClientId: process.env.DISCORD_CLIENT_ID,
  discordClientSecret: process.env.DISCORD_CLIENT_SECRET,
  redirectUri: process.env.OAUTH_REDIRECT_URI || 'http://localhost:4000/api/oauth/callback',
  sessionSecret: process.env.SESSION_SECRET || 'dev_session_secret',
  mongodbUri: process.env.MONGODB_URI,
  redisUrl: process.env.REDIS_URL,
  cacheTtlSeconds: Number(process.env.CACHE_TTL_SECONDS) || 30,
  hmacSecret: process.env.HMAC_SECRET,
  pluginScanEnabled: process.env.PLUGIN_SCAN_ENABLED === 'true',
};

export const DISCORD_API = 'https://discord.com/api/v10';
