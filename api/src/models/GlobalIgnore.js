import mongoose from 'mongoose';

const globalIgnoreSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true }, // The user who is ignoring someone
    ignoredUserId: { type: String, required: true }, // The user being ignored
  },
  { timestamps: true }
);

globalIgnoreSchema.index({ userId: 1, ignoredUserId: 1 }, { unique: true });

export const GlobalIgnore = mongoose.models.GlobalIgnore || mongoose.model('GlobalIgnore', globalIgnoreSchema);
