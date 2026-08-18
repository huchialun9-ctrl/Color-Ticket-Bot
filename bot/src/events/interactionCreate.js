import { Events, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { ticketManager } from '../modules/ticketing/ticketManager.js';
import { WorkflowSubmission } from '../../../api/src/models/WorkflowSubmission.js';

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
      const customId = interaction.customId;

      // ---- 網頁表單工作流審核按鈕 (Workflow Approval Buttons) ----
      if (customId.startsWith('wf_approve:') || customId.startsWith('wf_reject:')) {
        // 檢查審核權限
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles) && 
            !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
          return interaction.reply({ content: '您不具備審核此表單的權限！', ephemeral: true });
        }

        const action = customId.startsWith('wf_approve:') ? 'approved' : 'rejected';
        const subId = customId.split(':')[1];

        try {
          const sub = await WorkflowSubmission.findOne({ submissionId: subId });
          if (!sub) {
            return interaction.reply({ content: '找不到此申請提交記錄！', ephemeral: true });
          }

          if (sub.status !== 'pending') {
            return interaction.reply({ content: `此申請案件先前已由他人處理，目前狀態為: **${sub.status === 'approved' ? '已核准' : '已拒絕'}**。`, ephemeral: true });
          }

          sub.status = action;
          await sub.save();

          // 重新組裝 Embed 表示審核完成
          const oldEmbed = interaction.message.embeds[0];
          const updatedEmbed = EmbedBuilder.from(oldEmbed)
            .setColor(action === 'approved' ? 0x2ed573 : 0xff4757)
            .addFields(
              { name: '審核結果', value: action === 'approved' ? '✅ 已核准' : '❌ 已拒絕', inline: true },
              { name: '審核官', value: `${interaction.user.tag}`, inline: true }
            )
            .setTimestamp();

          // 禁用所有按鈕
          await interaction.message.edit({
            embeds: [updatedEmbed],
            components: [] // 移除按鈕以防重複點擊
          });

          return interaction.reply({ content: `成功將該申請標記為: **${action === 'approved' ? '核准' : '拒絕'}**！`, ephemeral: true });
        } catch (e) {
          console.error('[workflow][button] submission update failed', e.message);
          return interaction.reply({ content: '操作失敗，系統資料庫異常。', ephemeral: true });
        }
      }
      if (customId.startsWith('role_toggle:')) {
        const roleId = customId.split(':')[1];
        const role = interaction.guild.roles.cache.get(roleId);
        if (!role) {
          return interaction.reply({ content: '找不到對應的身分組。', ephemeral: true });
        }
        
        try {
          const hasRole = interaction.member.roles.cache.has(roleId);
          if (hasRole) {
            await interaction.member.roles.remove(roleId);
            return interaction.reply({ content: `已為您卸載身分組：**${role.name}**`, ephemeral: true });
          } else {
            await interaction.member.roles.add(roleId);
            return interaction.reply({ content: `已為您領取身分組：**${role.name}**`, ephemeral: true });
          }
        } catch (err) {
          console.error('[buttonRoles][interaction] failed to toggle role', err.message);
          return interaction.reply({ content: '身分組變更失敗，請確認 Bot 是否具備足夠的權限管理該身分組！', ephemeral: true });
        }
      }

      return ticketManager.handleButton(interaction);
    }

    if (interaction.isModalSubmit()) {
      if (interaction.customId === 'report_modal') {
        const reportCommand = client.commands.get('report');
        if (reportCommand && reportCommand.handleModal) {
          return reportCommand.handleModal(interaction);
        }
      }
      return ticketManager.handleModal(interaction);
    }

    if (interaction.isStringSelectMenu()) {
      return ticketManager.handleSelect(interaction);
    }
  },
};
