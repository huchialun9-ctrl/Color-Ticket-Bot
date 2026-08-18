import { Events } from 'discord.js';
import { auditLog } from '../modules/automod/auditLog.js';

export default {
  name: Events.MessageDelete,
  async execute(client, message) {
    if (message.author?.bot) return;
    if (!message.guild) return;
    if (!message.content && message.attachments.size === 0) return;

    await auditLog(message.guild, 'message_delete', {
      channel: message.channel.name,
      authorId: message.author?.id,
      content: message.content?.slice(0, 1000) || '[僅附件]',
    });
  },
};
