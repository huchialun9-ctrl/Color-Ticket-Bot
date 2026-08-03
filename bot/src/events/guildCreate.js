import { Events } from 'discord.js';
import { pushGuildSnapshot } from '../modules/api/signer.js';

export default {
  name: Events.GuildCreate,
  once: false,
  execute(guild) {
    pushGuildSnapshot([guild]).catch((err) => {
      console.error('[guildCreate][sync]', err.message);
    });
  },
};
