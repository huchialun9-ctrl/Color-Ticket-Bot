import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** 自動載入 src/commands 下所有指令檔，並註冊到 client.commands */
export async function registerCommands(client) {
  const dir = join(__dirname, '..', 'commands');
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.js'))) {
    const mod = await import(`../commands/${file}`);
    const command = mod.default ?? mod;
    if (!command.data) continue;
    client.commands.set(command.data.name, command);
    console.log(`[commands] ${command.data.name}`);
  }
}

/** 輸出所有指令為 REST 可部署格式 */
export function collectCommandData(client) {
  return [...client.commands.values()].map((c) => c.data.toJSON());
}
