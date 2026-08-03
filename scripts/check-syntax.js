import { execFileSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const IGNORE_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'uploads']);

const files = [];
(function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (!IGNORE_DIRS.has(entry)) walk(full);
    } else if (full.endsWith('.js')) {
      files.push(full);
    }
  }
})(ROOT);

let failed = 0;
for (const file of files) {
  process.stdout.write(`.`);
  try {
    execFileSync(process.execPath, ['--check', file], { stdio: 'ignore' });
  } catch (e) {
    failed += 1;
    console.error(`\n✗ ${file}`);
    if (e.stderr) console.error(e.stderr.toString());
  }
}

console.log(`\n語法檢查完成：${files.length} 個檔案，${failed} 個失敗`);
process.exit(failed ? 1 : 0);
