import mongoose from 'mongoose';

const predictionSchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true, index: true },
    predictionId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    options: { type: [String], default: [] },
    bets: [
      {
        userId: { type: String, required: true },
        optionIndex: { type: Number, required: true },
        amount: { type: Number, required: true },
      },
    ],
    status: { type: String, default: 'pending' }, // pending, resolved, cancelled
    winnerIndex: { type: Number, default: -1 },
  },
  { timestamps: true },
);

predictionSchema.index({ guildId: 1, predictionId: 1 }, { unique: true });

export const Prediction = mongoose.models.Prediction || mongoose.model('Prediction', predictionSchema);
