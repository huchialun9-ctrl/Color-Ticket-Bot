import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PLUGIN_DIR = join(__dirname, '..', '..', '..', 'plugins');

/**
 * 插件熱重載引擎（Plugin Hot-Reload）。
 *  - 掃描 bot/plugins/<name>/ 下的 manifest.json + index.js
 *  - load / reload / unload，全部於執行期完成，免重啟 Bot
 *  - 插件介面：module.exports = { name, version, commands, onLoad(ctx), onUnload(ctx), handlers }
 */
class PluginManager {
  constructor() {
    this.registry = new Map();
    this.client = null;
  }

  async init(client) {
    this.client = client;
    for (const name of this.scan()) {
      await this.load(name).catch((err) => {
        console.error(`[plugin] ${name} 載入失敗:`, err.message);
      });
    }
    console.log(`[plugin] 已掃描 ${this.registry.size} 個插件`);
  }

  scan() {
    try {
      return readdirSync(PLUGIN_DIR, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name);
    } catch {
      return [];
    }
  }

  async load(name) {
    const dir = join(PLUGIN_DIR, name);
    // cache-busting query：強制 ESM 重新解析模組，達到熱重載
    const mod = await import(`${pathToFileURL(join(dir, 'index.js')).href}?t=${Date.now()}`);
    const plugin = mod.default ?? mod;

    if (!plugin?.name) throw new Error('插件缺少 name');
    if (this.registry.has(plugin.name)) await this.unload(plugin.name);

    // 註冊指令
    if (plugin.commands) {
      for (const cmd of plugin.commands) {
        this.client.commands.set(cmd.data.name, {
          data: cmd.data,
          execute: cmd.execute,
        });
      }
    }
    await plugin.onLoad?.({ client: this.client });
    this.registry.set(plugin.name, { dir, plugin });
    console.log(`[plugin] 已載入 ${plugin.name}@${plugin.version || '?'}`);
    return plugin;
  }

  async reload(name) {
    const entry = this.registry.get(name);
    if (!entry) throw new Error(`插件 ${name} 未載入`);
    await this.unload(name);
    return this.load(name);
  }

  async unload(name) {
    const entry = this.registry.get(name);
    if (!entry) return;
    await entry.plugin.onUnload?.({ client: this.client });
    if (entry.plugin.commands) {
      for (const cmd of entry.plugin.commands) {
        this.client.commands.delete(cmd.data.name);
      }
    }
    this.registry.delete(name);
    console.log(`[plugin] 已卸載 ${name}`);
  }

  list() {
    return [...this.registry.values()].map(({ plugin }) => ({
      name: plugin.name,
      version: plugin.version,
      status: 'loaded',
    }));
  }
}

export const pluginManager = new PluginManager();
