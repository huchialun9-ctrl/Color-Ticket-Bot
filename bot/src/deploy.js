import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { config } from './config.js';
import { client } from './client.js';
import { registerCommands, collectCommandData } from './loaders/commandLoader.js';

try {
  // 必須先將本地指令載入至 client.commands 中才能進行註冊
  await registerCommands(client);

  const rest = new REST({ version: '10' }).setToken(config.token);
  const body = collectCommandData(client);

  console.log(`[deploy] 註冊 ${body.length} 個 Slash 指令 (global)`);
  const data = await rest.put(Routes.applicationCommands(config.clientId), { body });
  console.log(`[deploy] 完成，共 ${data.length} 個指令`);
} catch (err) {
  console.error('[deploy] 失敗', err);
  process.exitCode = 1;
}
