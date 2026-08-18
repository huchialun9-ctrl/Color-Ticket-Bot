import mongoose from 'mongoose';

const blindBoxSchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true, index: true },
    prizeId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    rarity: { type: String, default: 'Common' }, // Common, Rare, Epic, Legendary
    roleRewardId: { type: String }, // Discord role ID to award (optional)
    weight: { type: Number, default: 100 }, // Rarity weight
  },
  { timestamps: true },
);

blindBoxSchema.index({ guildId: 1, prizeId: 1 }, { unique: true });

export const BlindBox = mongoose.models.BlindBox || mongoose.model('BlindBox', blindBoxSchema);
