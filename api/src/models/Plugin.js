import mongoose from 'mongoose';

const pluginSchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    version: { type: String, required: true },
    description: { type: String },
    author: { type: String },
    runtime: { type: String, default: 'discord.js' },
    filePath: { type: String },
    status: {
      type: String,
      enum: ['pending', 'scanning', 'approved', 'rejected', 'published'],
      default: 'pending',
    },
    scanReport: { type: mongoose.Schema.Types.Mixed },
    forumPost: { type: String },
    versionHistory: [{ type: mongoose.Schema.Types.Mixed }],
  },
  { timestamps: true },
);

pluginSchema.index({ guildId: 1, name: 1, version: -1 });

export const Plugin = mongoose.models.Plugin || mongoose.model('Plugin', pluginSchema);
