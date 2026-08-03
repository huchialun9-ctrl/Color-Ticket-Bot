import express from 'express';
import session from 'express-session';
import cors from 'cors';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { config } from './config.js';
import { connectDB } from './db.js';
import { cache } from './cache.js';
import { oauthRouter } from './routes/oauth.js';
import { apiRouter } from './routes/api.js';
import { ticketsRouter } from './routes/tickets.js';
import { pluginsRouter } from './routes/plugins.js';
import { webhooksRouter } from './routes/webhooks.js';
import { internalRouter } from './routes/internal.js';

const app = express();

// Render/VPS 後方代理：信任第一層 proxy，使 req.protocol / X-Forwarded-Proto 正確
app.set('trust proxy', 1);

app.use(
  cors({
    origin: config.webBaseUrl,
    credentials: true,
  }),
);
app.use(express.json());
app.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 3600 * 1000 },
  }),
);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

// 內部 HMAC 端點必須在 requireAuth 路由器之前掛載（不需 session 登入）
app.use('/api/internal', internalRouter);

app.use('/api/oauth', oauthRouter);
app.use('/api', apiRouter);
app.use('/api', ticketsRouter);
app.use('/api', pluginsRouter);
app.use('/api/webhooks', webhooksRouter);

// ---- 前端託管 ----
// 若 web/dist 已建置，則由 API 直接提供（production 單一來源）；否則轉跳 Vite dev server。
const __dirname = dirname(fileURLToPath(import.meta.url));
const webDist = join(__dirname, '..', '..', 'web', 'dist');
if (existsSync(join(webDist, 'index.html'))) {
  app.use(express.static(webDist));
  app.get(/^\/(?!api).*/, (_req, res) => {
    res.sendFile(join(webDist, 'index.html')); // SPA fallback
  });
} else {
  app.get('/', (_req, res) => {
    res.redirect(config.webBaseUrl);
  });
}

app.use((err, _req, res, _next) => {
  console.error('[error]', err);
  res.status(500).json({ error: 'internal_error' });
});

export async function start() {
  await connectDB();
  await cache.connect();
  app.listen(config.port, () => {
    console.log(`[api] 已啟動於 ${config.apiBaseUrl}`);
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  start().catch((err) => {
    console.error('[api][fatal]', err);
    process.exit(1);
  });
}

export default app;
