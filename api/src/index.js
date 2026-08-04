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

import RedisStore from 'connect-redis';
import { createClient } from 'redis';

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
// NOTE: session middleware will be registered inside start() after (optional) Redis connect.

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

  // connect cache first (cache.js will also try to connect using config.redisUrl)
  await cache.connect();

  // Setup Redis-backed session store if REDIS_URL present
  let redisClient = null;
  if (config.redisUrl) {
    try {
      redisClient = createClient({
        url: config.redisUrl,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 2) return new Error('Connection failed');
            return 1000; // retry after 1s
          }
        }
      });
      redisClient.on('error', (e) => console.error('[redis] client error', e.message));
      await redisClient.connect();
      console.log('[redis] connected for session store');
    } catch (err) {
      console.warn('[redis] could not connect for session store, falling back to memory store', err.message);
      redisClient = null;
    }
  } else {
    console.warn('[redis] REDIS_URL not set, using memory session store');
  }

  const sessionOptions = {
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 3600 * 1000 },
  };
  if (redisClient) {
    sessionOptions.store = new RedisStore({ client: redisClient });
  }
  app.use(session(sessionOptions));

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
