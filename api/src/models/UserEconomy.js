import mongoose from 'mongoose';

const userEconomySchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    balance: { type: Number, default: 0 },
    lastCheckIn: { type: Date },
    birthday: { type: String }, // e.g. "12-25"
    petName: { type: String, default: '小精靈' },
    petLevel: { type: Number, default: 1 },
    petXP: { type: Number, default: 0 },
    petLastFed: { type: Date, default: () => new Date() },
    badges: { type: [String], default: [] },
    profileBgUrl: { type: String, default: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe' },
  },
  { timestamps: true },
);

// Create compound index for faster lookup
userEconomySchema.index({ guildId: 1, userId: 1 }, { unique: true });

export const UserEconomy = mongoose.models.UserEconomy || mongoose.model('UserEconomy', userEconomySchema);
