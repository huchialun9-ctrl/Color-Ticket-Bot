import mongoose from 'mongoose';

const webFormSchema = new mongoose.Schema(
  {
    formId: { type: String, required: true, unique: true, index: true },
    guildId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String },
    targetChannelId: { type: String, required: true },
    fields: { type: mongoose.Schema.Types.Mixed, default: [] }, // Array of { label, type, required }
  },
  { timestamps: true },
);

export const WebForm = mongoose.models.WebForm || mongoose.model('WebForm', webFormSchema);
