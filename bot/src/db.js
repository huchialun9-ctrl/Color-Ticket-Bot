import mongoose from 'mongoose';
import { config } from './config.js';

let connected = false;

export async function connectDB() {
  if (!config.mongodbUri) {
    console.warn('[bot-db] 未設定 MONGODB_URI，部分功能將改用記憶體或受限。');
    return;
  }
  try {
    await mongoose.connect(config.mongodbUri, { serverSelectionTimeoutMS: 5000 });
    connected = true;
    console.log('[bot-db] MongoDB 已成功連線');
  } catch (err) {
    console.error('[bot-db] MongoDB 連線失敗', err.message);
  }
}

export function isDBReady() {
  return connected;
}
