import mongoose from 'mongoose';

const memberXpSchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    messageCount: { type: Number, default: 0 },
    voiceMinutes: { type: Number, default: 0 },
    lastXpEarnedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

memberXpSchema.index({ guildId: 1, userId: 1 }, { unique: true });

export const MemberXP = mongoose.models.MemberXP || mongoose.model('MemberXP', memberXpSchema);
