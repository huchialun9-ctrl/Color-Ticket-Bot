import 'dotenv/config';
import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'node:url';
loadEnv({ path: fileURLToPath(new URL('../../.env', import.meta.url)) });

export const config = {
  token: process.env.DISCORD_BOT_TOKEN,
  clientId: process.env.DISCORD_CLIENT_ID,
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:4000',
  hmacSecret: process.env.HMAC_SECRET,
  intents: [
    'Guilds',
    'GuildMembers',
    'GuildMessages',
    'GuildMessageReactions',
    'MessageContent',
    'GuildVoiceStates',
    'GuildModeration',
  ],
  automod: {
    tokenCapacity: Number(process.env.AUTOMOD_TOKEN_CAPACITY) || 8,
    warnThreshold: Number(process.env.AUTOMOD_WARN_THRESHOLD) || 3,
    raidWindowMs: Number(process.env.AUTOMOD_RAID_WINDOW_MS) || 60000,
    raidThreshold: Number(process.env.AUTOMOD_RAID_THRESHOLD) || 10,
    newAccountMaxAgeDays: 30,
  },
};
