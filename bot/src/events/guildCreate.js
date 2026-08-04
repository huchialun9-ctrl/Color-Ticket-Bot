import { Events } from 'discord.js';
import { pushGuildSnapshot } from '../modules/api/signer.js';
import { updatePresence } from '../modules/presence.js';

export default {
  name: Events.GuildCreate,
  once: false,
  execute(guild) {
    updatePresence(guild.client);
    pushGuildSnapshot([guild]).catch((err) => {
      console.error('[guildCreate][sync]', err.message);
    });
  },
};
