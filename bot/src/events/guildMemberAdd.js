import { Events } from 'discord.js';
import { antiRaid } from '../modules/automod/antiRaid.js';

export default {
  name: Events.GuildMemberAdd,
  async execute(client, member) {
    if (member.user.bot) return;
    await antiRaid.handleMemberAdd(member);
  },
};
