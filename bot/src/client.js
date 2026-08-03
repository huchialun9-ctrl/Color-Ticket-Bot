import { Client, GatewayIntentBits, Events, Collection } from 'discord.js';
import { config } from './config.js';
import { registerEvents } from './loaders/eventLoader.js';
import { registerCommands } from './loaders/commandLoader.js';
import { pluginManager } from './modules/plugins/pluginManager.js';

export const client = new Client({ intents: config.intents });

client.commands = new Collection();
client.cooldowns = new Collection();

export async function start() {
  if (!config.token) {
    throw new Error('缺少 DISCORD_BOT_TOKEN，請檢查 .env');
  }

  registerEvents(client);
  registerCommands(client);
  await pluginManager.init(client);

  await client.login(config.token);
  console.log('[CHubb-Man] Bot 啟動流程完成');
}

export { Events };
