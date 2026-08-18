import mongoose from 'mongoose';

const globalBlacklistSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    reason: { type: String, required: true },
    bannedByGuildId: { type: String, required: true },
  },
  { timestamps: true },
);

export const GlobalBlacklist = mongoose.models.GlobalBlacklist || mongoose.model('GlobalBlacklist', globalBlacklistSchema);
