import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true, index: true },
    ticketId: { type: String, required: true, unique: true },
    channelId: { type: String },
    userId: { type: String },
    subject: { type: String },
    fields: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      enum: ['open', 'closed', 'archived'],
      default: 'open',
    },
    rating: { type: Number, min: 1, max: 5, default: null },
    transcriptUrl: { type: String },
    closedAt: { type: Date },
    closedBy: { type: String },
    memos: [
      {
        content: { type: String, required: true },
        addedBy: { type: String, required: true },
        addedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

// 高頻讀寫複合索引：伺服器 + 狀態 + 建立時間（批次管理/列表查詢）
ticketSchema.index({ guildId: 1, status: 1, createdAt: -1 });

export const Ticket = mongoose.models.Ticket || mongoose.model('Ticket', ticketSchema);
