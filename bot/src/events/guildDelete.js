import { Events } from 'discord.js';
import { updatePresence } from '../modules/presence.js';

export default {
  name: Events.GuildDelete,
  once: false,
  execute(guild) {
    updatePresence(guild.client);
  },
};
