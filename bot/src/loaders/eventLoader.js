import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** 自動載入 src/events/*.js，並以檔案名稱作為事件註冊 */
export async function registerEvents(client) {
  const dir = join(__dirname, '..', 'events');
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.js'))) {
    const mod = await import(`../events/${file}`);
    const { name, once = false, execute } = mod.default ?? mod;
    client[once ? 'once' : 'on'](name, (...args) => execute(client, ...args));
    console.log(`[events] ${file} → ${name}`);
  }
}
