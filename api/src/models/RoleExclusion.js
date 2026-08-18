import mongoose from 'mongoose';

const roleExclusionSchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true, index: true },
    roleIds: { type: [String], default: [] }, // Array of mutual exclusive role IDs
  },
  { timestamps: true },
);

export const RoleExclusion = mongoose.models.RoleExclusion || mongoose.model('RoleExclusion', roleExclusionSchema);
