import mongoose from 'mongoose';

/** 每伺服器設定與表單結構（以 Guild ID 隔離） */
const guildSchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true, unique: true, index: true },
    name: { type: String },
    icon: { type: String },
    memberCount: { type: Number, default: 0 },
    automod: {
      enabled: { type: Boolean, default: true },
      tokenCapacity: { type: Number, default: 8 },
      warnThreshold: { type: Number, default: 3 },
      minAccountAgeDays: { type: Number, default: 0 },
      requireAvatar: { type: Boolean, default: false },
      botWhitelist: { type: [String], default: [] },
      whitelist: { type: [String], default: [] }, // Channel/Role ID whitelist
      raid: {
        windowMs: { type: Number, default: 60000 },
        threshold: { type: Number, default: 10 },
      },
    },
    ticketing: {
      supportRoleId: { type: String },
      categoryId: { type: String },
      /** 表單結構：{ title, fields: [{ customId, label, style, required, maxLength }] } */
      form: { type: mongoose.Schema.Types.Mixed, default: null },
      autoResponses: { type: mongoose.Schema.Types.Mixed, default: [] },
    },
    logChannelId: { type: String },
    securityWebhookUrl: { type: String },
    voiceCreatorChannelId: { type: String },
    reportChannelId: { type: String },
    memberCountChannelId: { type: String },
    onlineCountChannelId: { type: String },
    autoPublish: { type: Boolean, default: false },
    globalChatChannelId: { type: String },
  },
  { timestamps: true, strict: false },
);

guildSchema.index({ guildId: 1, 'automod.enabled': 1 });

export const Guild = mongoose.models.Guild || mongoose.model('Guild', guildSchema);
