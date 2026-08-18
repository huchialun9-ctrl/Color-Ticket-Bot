import mongoose from 'mongoose';

const scheduledMessageSchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true, index: true },
    channelId: { type: String, required: true },
    content: { type: String, required: true },
    scheduledAt: { type: Date, required: true, index: true },
    status: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
  },
  { timestamps: true },
);

export const ScheduledMessage = mongoose.models.ScheduledMessage || mongoose.model('ScheduledMessage', scheduledMessageSchema);
