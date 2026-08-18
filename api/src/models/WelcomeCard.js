import mongoose from 'mongoose';

const welcomeCardSchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true, unique: true, index: true },
    enabled: { type: Boolean, default: false },
    channelId: { type: String },
    backgroundUrl: { type: String, default: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe' },
    textColor: { type: String, default: '#ffffff' },
    customText: { type: String, default: '歡迎加入我們的社群！' },
  },
  { timestamps: true },
);

export const WelcomeCard = mongoose.models.WelcomeCard || mongoose.model('WelcomeCard', welcomeCardSchema);
