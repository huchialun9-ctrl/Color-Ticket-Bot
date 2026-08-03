import { Events } from 'discord.js';
import { ticketManager } from '../modules/ticketing/ticketManager.js';

export default {
  name: Events.InteractionCreate,
  async execute(client, interaction) {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) {
        return interaction.reply({ content: '未知指令。', ephemeral: true });
      }
      try {
        await command.execute(interaction);
      } catch (err) {
        console.error(`[command:${interaction.commandName}]`, err);
        const reply = { content: '執行指令時發生錯誤，已回報。', ephemeral: true };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(reply).catch(() => {});
        } else {
          await interaction.reply(reply).catch(() => {});
        }
      }
      return;
    }

    if (interaction.isButton()) {
      return ticketManager.handleButton(interaction);
    }

    if (interaction.isModalSubmit()) {
      return ticketManager.handleModal(interaction);
    }

    if (interaction.isStringSelectMenu()) {
      return ticketManager.handleSelect(interaction);
    }
  },
};
