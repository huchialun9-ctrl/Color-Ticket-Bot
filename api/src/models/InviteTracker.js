import mongoose from 'mongoose';

const inviteTrackerSchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true, index: true },
    code: { type: String, required: true, unique: true, index: true },
    uses: { type: Number, default: 0 },
    inviterId: { type: String },
  },
  { timestamps: true },
);

export const InviteTracker = mongoose.models.InviteTracker || mongoose.model('InviteTracker', inviteTrackerSchema);
