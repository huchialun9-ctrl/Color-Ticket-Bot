import mongoose from 'mongoose';

const warnSchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    moderatorId: { type: String },
    amount: { type: Number, default: 1 },
    reason: { type: String, default: '' },
    action: { type: String, enum: ['warn', 'timeout', 'ban'], default: 'warn' },
  },
  { timestamps: true },
);

warnSchema.index({ guildId: 1, userId: 1, createdAt: -1 });

export const Warn = mongoose.models.Warn || mongoose.model('Warn', warnSchema);
