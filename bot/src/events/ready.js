import { Events } from 'discord.js';
import { pushGuildSnapshot } from '../modules/api/signer.js';
import { startPresenceLoop } from '../modules/presence.js';
import { startScheduler } from '../modules/scheduler.js';
import { startTicketAutoClose } from '../modules/ticketing/ticketAutoClose.js';
import { initInviteCache } from '../modules/invites/inviteCache.js';
import { startServerStatsLoop } from '../modules/serverStats.js';

export default {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    startPresenceLoop(client);
    startScheduler(client);
    startTicketAutoClose(client);
    startServerStatsLoop(client);
    initInviteCache(client).catch(() => {});
    console.log(`[ready] 登入為 ${client.user.tag}，伺服器數 ${client.guilds.cache.size}`);

    pushGuildSnapshot(client.guilds.cache.toJSON()).catch((err) => {
      console.error('[ready][sync]', err.message);
    });
  },
};
