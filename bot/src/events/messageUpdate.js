import { Events } from 'discord.js';
import { auditLog } from '../modules/automod/auditLog.js';

export default {
  name: Events.MessageUpdate,
  async execute(client, oldMessage, newMessage) {
    if (oldMessage.author?.bot) return;
    if (!oldMessage.guild) return;
    if (oldMessage.content === newMessage.content) return;

    await auditLog(newMessage.guild, 'message_edit', {
      channel: newMessage.channel.name,
      authorId: newMessage.author.id,
      before: oldMessage.content?.slice(0, 1000) || '',
      after: newMessage.content?.slice(0, 1000) || '',
    });
  },
};
