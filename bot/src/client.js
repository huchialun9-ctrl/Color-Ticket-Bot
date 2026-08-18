import { Client, GatewayIntentBits, Events, Collection } from 'discord.js';
import { config } from './config.js';
import { connectDB } from './db.js';
import { registerEvents } from './loaders/eventLoader.js';
import { registerCommands } from './loaders/commandLoader.js';
import { pluginManager } from './modules/plugins/pluginManager.js';

const restOptions = process.env.DISCORD_API_URL ? {
  makeRequest: async (url, init) => {
    let targetUrl = url;
    if (typeof url === 'string') {
      targetUrl = url.replace('https://discord.com/api/v10', process.env.DISCORD_API_URL);
    }
    return fetch(targetUrl, init);
  }
} : undefined;

export const client = new Client({ 
  intents: config.intents,
  ...(restOptions ? { rest: restOptions } : {})
});

client.commands = new Collection();
client.cooldowns = new Collection();

export async function start() {
  client.on('debug', info => console.log('[bot-debug]', info));
  client.on('warn', info => console.warn('[bot-warn]', info));
  client.on('error', info => console.error('[bot-error]', info));
  if (!config.token) {
    throw new Error('缺少 DISCORD_BOT_TOKEN，請檢查 .env');
  }

  await connectDB();
  await registerEvents(client);
  await registerCommands(client);
  await pluginManager.init(client);

  await client.login(config.token);
  console.log('[胖達CHubbMan] Bot 啟動流程完成');
}

export { Events };
