import { Router } from 'express';
import multer from 'multer';
import { cp } from 'node:fs/promises';
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
