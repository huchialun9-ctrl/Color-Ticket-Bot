import mongoose from 'mongoose';
import { config } from './config.js';

let connected = false;

export async function connectDB() {
  if (!config.mongodbUri) {
    console.warn('[db] 未設定 MONGODB_URI，跳過資料庫連線（僅啟動記憶體模式）。');
    return;
  }
  try {
    await mongoose.connect(config.mongodbUri, { serverSelectionTimeoutMS: 5000 });
    connected = true;
    console.log('[db] MongoDB 已連線');
  } catch (err) {
    console.warn('[db] MongoDB 連線失敗，進入記憶體模式（部分功能受限）:', err.message);
  }
}

export function isDBReady() {
  return connected;
}

export const db = mongoose.connection;
