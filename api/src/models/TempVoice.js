import mongoose from 'mongoose';

const tempVoiceSchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true, index: true },
    channelId: { type: String, required: true, unique: true },
    creatorId: { type: String, required: true },
  },
  { timestamps: true },
);

export const TempVoice = mongoose.models.TempVoice || mongoose.model('TempVoice', tempVoiceSchema);
