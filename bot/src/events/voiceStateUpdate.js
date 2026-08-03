import { Events } from 'discord.js';
import { auditLog } from '../modules/automod/auditLog.js';

export default {
  name: Events.VoiceStateUpdate,
  async execute(client, oldState, newState) {
    const member = newState.member || oldState.member;
    if (member?.user.bot) return;

    if (!oldState.channelId && newState.channelId) {
      await auditLog(newState.guild, 'voice_state', {
        member: member.user.tag,
        action: 'joined',
        channel: newState.channel.name,
      });
    } else if (oldState.channelId && !newState.channelId) {
      await auditLog(oldState.guild, 'voice_state', {
        member: member.user.tag,
        action: 'left',
        channel: oldState.channel.name,
      });
    } else if (oldState.channelId !== newState.channelId) {
      await auditLog(newState.guild, 'voice_state', {
        member: member.user.tag,
        action: 'moved',
        from: oldState.channel.name,
        to: newState.channel.name,
      });
    }
  },
};
