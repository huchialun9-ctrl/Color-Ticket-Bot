import { start } from './client.js';

start().catch((err) => {
  console.error('[FATAL]', err);
  process.exit(1);
});
