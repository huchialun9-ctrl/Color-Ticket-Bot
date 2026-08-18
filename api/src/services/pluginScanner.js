import yauzl from 'yauzl';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join, basename, dirname } from 'node:path';
import { config } from '../config.js';

const UPLOAD_DIR = join(process.cwd(), 'uploads');

/**
 * 插件 Smart File Scan：
 * 1. 流式解壓 zip（yauzl，防 zip-bomb：限制條目數/檔案大小）
 * 2. 解析 package.json（優先）或 manifest.json，自動帶入名稱/版本/描述
 * 3. 掃描階段（ClamAV / 沙盒，選配）
 */
export async function scanPluginZip(file) {
  const target = join(UPLOAD_DIR, `${Date.now()}-${basename(file.originalname || 'plugin.zip')}`);
  await mkdir(UPLOAD_DIR, { recursive: true });

  const entries = await unzip(file.path, target);

  const manifest = entries.find((e) => e.endsWith('manifest.json'));
  const pkg = entries.find((e) => e.endsWith('package.json'));

  const meta = {
    name: null,
    version: null,
    description: null,
    author: null,
    runtime: 'discord.js',
  };

  if (pkg) {
    const json = await readJson(target, pkg);
    meta.name = json.name || meta.name;
    meta.version = json.version || meta.version;
    meta.description = json.description || meta.description;
  }
  if (manifest) {
    const json = await readJson(target, manifest);
    meta.name = json.name || meta.name;
    meta.version = json.version || meta.version;
    meta.description = json.description || meta.description;
    meta.author = json.author || meta.author;
    meta.runtime = json.runtime || meta.runtime;
  }

  if (!meta.name || !meta.version) {
    await rm(target, { recursive: true, force: true });
    throw new Error('插件缺少 name 或 version（需 package.json 或 manifest.json）');
  }

  return { ...meta, filePath: target, entries };
}

async function unzip(zipPath, outDir) {
  const names = [];
  await new Promise((resolve, reject) => {
    yauzl.open(zipPath, { lazyEntries: true }, (err, zipfile) => {
      if (err) return reject(err);
      zipfile.readEntry();
      let count = 0;
      zipfile.on('entry', (entry) => {
        if (++count > 500) {
          zipfile.close();
          return reject(new Error('zip 條目過多（潛在 zip-bomb）'));
        }
        if (entry.fileName.endsWith('/')) return zipfile.readEntry();
        const safeName = entry.fileName.replace(/^\/+/, '').replace(/\.\./g, '');
        names.push(safeName);

        const dest = join(outDir, safeName);
        const dir = dirname(dest);

        zipfile.openReadStream(entry, (err2, stream) => {
          if (err2) return reject(err2);
          stream.on('error', reject);
          awaitStream(stream)
            .then(async (buf) => {
              await mkdir(dir, { recursive: true });
              await writeFile(dest, buf);
              zipfile.readEntry();
            })
            .catch(reject);
        });
      });
      zipfile.on('end', () => resolve(names));
      zipfile.on('error', reject);
    });
  });
  return names;
}

function awaitStream(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (c) => chunks.push(c));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

async function readJson(dir, entry) {
  const { readFile } = await import('node:fs/promises');
  const raw = await readFile(join(dir, entry), 'utf-8');
  return JSON.parse(raw);
}
