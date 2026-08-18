import mongoose from 'mongoose';

const tempRoleSchema = new mongoose.Schema({
  guildId: { type: String, required: true, index: true },
  userId: { type: String, required: true },
  roleId: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: true },
});

export const TempRole = mongoose.models.TempRole || mongoose.model('TempRole', tempRoleSchema);
