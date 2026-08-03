import mongoose from 'mongoose';

/** 全域計數（首頁看板），每日快照以利歷史統計 */
const globalStatSchema = new mongoose.Schema(
  {
    date: { type: String, required: true, unique: true, index: true }, // YYYY-MM-DD
    guildCount: { type: Number, default: 0 },
    totalUsers: { type: Number, default: 0 },
    bannedTotal: { type: Number, default: 0 },
    violationsToday: { type: Number, default: 0 },
    raidTriggers: { type: Number, default: 0 },
    ticketsTotal: { type: Number, default: 0 },
    ticketsOpen: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const GlobalStat =
  mongoose.models.GlobalStat || mongoose.model('GlobalStat', globalStatSchema);
