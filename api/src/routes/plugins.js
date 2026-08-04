import { Router } from 'express';
import multer from 'multer';
import { cp, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { requireAuth, discordFetch, isGuildAdmin } from '../middleware/auth.js';
import { requireDB } from '../middleware/db.js';
import { scanPluginZip } from '../services/pluginScanner.js';
import { Plugin } from '../models/Plugin.js';

const upload = multer({ dest: 'uploads/tmp', limits: { fileSize: 10 * 1024 * 1024 } });

export const pluginsRouter = Router();
pluginsRouter.use(requireAuth, requireDB);

/** 版本發佈列表 */
pluginsRouter.get('/guilds/:guildId/plugins', async (req, res) => {
  const plugins = await Plugin.find({ guildId: req.params.guildId })
    .sort({ updatedAt: -1 })
    .limit(100);
  res.json({ plugins });
});

/** 上傳 zip → Smart File Scan 自動解析 → 建立記錄（pending） */
pluginsRouter.post('/guilds/:guildId/plugins/upload', upload.single('file'), async (req, res) => {
  const { guildId } = req.params;
  if (!req.file) return res.status(400).json({ error: '缺少 zip 檔案' });

  const all = await discordFetch('/users/@me/guilds', req.session.user.accessToken);
  const guild = all.find((g) => g.id === guildId);
  if (!isGuildAdmin(guild, req.session.user)) {
    return res.status(403).json({ error: 'not_admin' });
  }

  try {
    const meta = await scanPluginZip(req.file);
    const plugin = await Plugin.create({
      guildId,
      ...meta,
      status: 'pending',
      scanReport: { entries: meta.entries.length },
    });
    res.status(201).json(plugin);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/** 更新狀態（pending → approved / published / rejected） */
/** 更新狀態（pending → approved / published / rejected）並同步安裝至 Bot */
pluginsRouter.patch('/guilds/:guildId/plugins/:id', async (req, res) => {
  const { id, guildId } = req.params;
  const { status, forumPost } = req.body;

  try {
    const plugin = await Plugin.findOne({ _id: id, guildId });
    if (!plugin) return res.status(404).json({ error: 'not_found' });

    // 權限驗證
    const all = await discordFetch('/users/@me/guilds', req.session.user.accessToken);
    const guild = all.find((g) => g.id === guildId);
    if (!isGuildAdmin(guild, req.session.user)) {
      return res.status(403).json({ error: 'not_admin' });
    }

    // 如果審核通過，將解壓的檔案複製到 bot/plugins 目錄下
    if (status === 'approved' && plugin.status !== 'approved') {
      const destPath = join(process.cwd(), 'bot', 'plugins', plugin.name);
      await cp(plugin.filePath, destPath, { recursive: true });
      console.log(`[plugin] 已成功將插件 ${plugin.name} 安裝至 ${destPath}`);
    }

    plugin.status = status || plugin.status;
    if (forumPost !== undefined) plugin.forumPost = forumPost;
    await plugin.save();

    res.json(plugin);
  } catch (err) {
    console.error('[api][plugins] patch error', err);
    res.status(500).json({ error: 'failed_to_update_plugin', detail: err.message });
  }
});

const MARKETPLACE_PLUGINS = [
  {
    id: 'reaction-roles',
    name: 'reaction-roles',
    version: '1.0.0',
    description: '反應貼圖身分組：點擊按鈕或反應自動取得/移除指定身分組。',
    author: 'CHubbMan Team',
    runtime: 'discord.js',
    code: `export default {
  name: 'reaction-roles',
  version: '1.0.0',
  description: '反應貼圖身分組',
  commands: [
    {
      data: {
        name: 'rrsetup',
        description: '設定按鈕身分組面板',
        options: []
      },
      async execute(interaction) {
        await interaction.reply({ content: '反應身分組面板已初始化（範例）。', ephemeral: true });
      }
    }
  ],
  onLoad({ client }) {
    console.log('[plugin][reaction-roles] 載入成功');
  },
  onUnload({ client }) {
    console.log('[plugin][reaction-roles] 卸載成功');
  }
};`
  },
  {
    id: 'leveling-system',
    name: 'leveling-system',
    version: '1.1.0',
    description: '社群經驗值與等級系統：發言增加經驗，自動升級並給予稱號身分組。',
    author: 'CHubbMan Team',
    runtime: 'discord.js',
    code: `export default {
  name: 'leveling-system',
  version: '1.1.0',
  description: '社群等級系統',
  commands: [
    {
      data: {
        name: 'rank',
        description: '查詢當前等級與經驗值',
        options: []
      },
      async execute(interaction) {
        await interaction.reply({ content: '您目前的等級為 Lv.5 (EXP: 120/500)', ephemeral: true });
      }
    }
  ],
  onLoad({ client }) {
    console.log('[plugin][leveling-system] 等級系統已啟動');
  }
};`
  }
];

/** 取得市集外掛列表 */
pluginsRouter.get('/marketplace/list', async (req, res) => {
  res.json({ plugins: MARKETPLACE_PLUGINS.map(({ code, ...rest }) => rest) });
});

/** 從市集安裝外掛 */
pluginsRouter.post('/guilds/:guildId/plugins/marketplace/install', async (req, res) => {
  const { guildId } = req.params;
  const { pluginId } = req.body;

  const item = MARKETPLACE_PLUGINS.find((p) => p.id === pluginId);
  if (!item) return res.status(404).json({ error: 'plugin_not_found_in_marketplace' });

  try {
    const all = await discordFetch('/users/@me/guilds', req.session.user.accessToken);
    const guild = all.find((g) => g.id === guildId);
    if (!isGuildAdmin(guild, req.session.user)) {
      return res.status(403).json({ error: 'not_admin' });
    }

    // 寫入到 bot/plugins/<name>/
    const destDir = join(process.cwd(), 'bot', 'plugins', item.name);
    await mkdir(destDir, { recursive: true });
    
    // 寫入 index.js 與 package.json
    await writeFile(join(destDir, 'index.js'), item.code);
    
    const pkgJson = {
      name: item.name,
      version: item.version,
      description: item.description,
      main: 'index.js',
      type: 'module'
    };
    await writeFile(join(destDir, 'package.json'), JSON.stringify(pkgJson, null, 2));

    // 資料庫中登記為已安裝
    const pluginRecord = await Plugin.findOneAndUpdate(
      { guildId, name: item.name },
      {
        $set: {
          name: item.name,
          version: item.version,
          description: item.description,
          author: item.author,
          runtime: item.runtime,
          status: 'approved',
          filePath: destDir
        }
      },
      { upsert: true, new: true }
    );

    res.json({ ok: true, plugin: pluginRecord });
  } catch (err) {
    console.error('[marketplace] install error', err);
    res.status(500).json({ error: 'failed_to_install_from_marketplace', detail: err.message });
  }
});
