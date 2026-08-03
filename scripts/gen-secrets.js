import { randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/** 產生隨機 43 字元 base64url 密鑰 */
const secret = () => randomBytes(32).toString('base64url');

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = join(root, '.env');
const examplePath = join(root, '.env.example');

if (!existsSync(envPath)) {
  console.error('未找到 .env，請先執行：Copy-Item .env.example .env');
  process.exit(1);
}

let env = readFileSync(envPath, 'utf8');

const ensure = (key) => {
  const re = new RegExp(`^${key}=.*$`, 'm');
  const value = secret();
  if (re.test(env)) {
    env = env.replace(re, `${key}=${value}`);
  } else {
    env += `\n${key}=${value}`;
  }
  console.log(`[gen-secrets] 已重新產生 ${key}`);
};

ensure('SESSION_SECRET');
ensure('HMAC_SECRET');

writeFileSync(envPath, env, 'utf8');
console.log(`[gen-secrets] 已寫入 ${envPath}`);
console.log('注意：若已有舊 secret 產生的 session/HMAC 資料，重啟服務即會失效。');
