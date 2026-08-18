import { isDBReady } from '../db.js';

/** 依賴資料庫的路由守衛：未連線時回傳 503 而非讓查詢卡住 */
export function requireDB(req, res, next) {
  if (!isDBReady()) {
    return res.status(503).json({ error: 'database_unavailable', hint: '請啟動 MongoDB 或於 .env 設定 MONGODB_URI' });
  }
  next();
}
