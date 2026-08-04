import { Events } from 'discord.js';
import { pushGuildSnapshot } from '../modules/api/signer.js';
import { updatePresence } from '../modules/presence.js';

export default {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    updatePresence(client);
    console.log(`[ready] 登入為 ${client.user.tag}，伺服器數 ${client.guilds.cache.size}`);

    pushGuildSnapshot(client.guilds.cache.toJSON()).catch((err) => {
      console.error('[ready][sync]', err.message);
    });
  },
};
