import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ComponentType } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('查看 胖達CHubbMan 完整指令說明手冊與互動選單'),
  async execute(interaction) {
    const mainEmbed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('🐼 胖達CHubbMan 幫助手冊與指令指南')
      .setDescription('歡迎使用胖達小幫手！請使用下方下拉選單，依分類探索本機器人的完整指令與使用說明。')
      .addFields(
        { name: '🌐 控制台網頁', value: '👉 https://color-ticket-bot.onrender.com' },
        { name: '📁 1. 系統安全與管理', value: 'AutoMod 洗版防護、聯防黑名單、警告/禁言與緊急鎖定。' },
        { name: '📁 2. 🎫 客服工單系統', value: '建立私密一對一客服單頻道、滿意度評分與自動日誌。' },
        { name: '📁 3. 🎮 社群經濟與活躍', value: '簽到領幣、盲盒抽獎、個人名片、虛擬寵物、運勢占卜與趣味問答。' }
      )
      .setFooter({ text: '請在下方選擇您想查閱的指令分類 ⇩' });

    const menu = new StringSelectMenuBuilder()
      .setCustomId('help-category')
      .setPlaceholder('選擇指令分類...')
      .addOptions([
        {
          label: '系統安全與管理',
          description: '包含警告、一鍵清理、頻道鎖定、系統狀態等',
          value: 'security',
          emoji: '🛡️',
        },
        {
          label: '客服工單系統',
          description: '客服單開啟、滿意度評價與客服單關閉',
          value: 'tickets',
          emoji: '🎫',
        },
        {
          label: '社群經濟與娛樂',
          description: '簽到、盲盒抽獎、活躍卡片、虛擬寵物、運勢占卜',
          value: 'economy',
          emoji: '🎮',
        },
      ]);

    const row = new ActionRowBuilder().addComponents(menu);

    const response = await interaction.reply({
      embeds: [mainEmbed],
      components: [row],
      ephemeral: true,
    });

    // 建立元件收集器，處理用戶下拉選取事件 (10 分鐘有效)
    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 600000,
    });

    collector.on('collect', async (i) => {
      if (i.customId !== 'help-category') return;

      const selection = i.values[0];
      const replyEmbed = new EmbedBuilder().setColor(0x5865f2).setTimestamp();

      if (selection === 'security') {
        replyEmbed
          .setTitle('🛡️ 系統安全與管理指令')
          .setDescription('管理員用於維護伺服器秩序與防護的安全工具。')
          .addFields(
            { name: '`/warn <user> [reason]`', value: '對指定成員進行警告。累積警告次數達到閾值後自動禁言 1 小時。' },
            { name: '`/purge <amount> [user] [filter]`', value: '批次快速清理頻道訊息（最多 100 則，僅限 14 天內訊息）。' },
            { name: '`/lockdown <lock|unlock>`', value: '一鍵鎖定目前頻道（關閉 @everyone 發言權限）或解除鎖定。' },
            { name: '`/status`', value: '檢視 Bot 目前的延遲、系統負載與運行時間。' },
            { name: '`/invite`', value: '獲取邀請機器人進駐其他伺服器的官方授權連結。' }
          );
      } else if (selection === 'tickets') {
        replyEmbed
          .setTitle('🎫 客服工單系統指令')
          .setDescription('提供一對一高度加密隱私的客服單處理流程。')
          .addFields(
            { name: '`/ticket panel`', value: '在當前頻道發布一個預設的工單開啟按鈕面板（推薦改用網頁控制台進行自訂欄位設計）。' },
            { name: '`/ticket close`', value: '在工單頻道內輸入此指令，即可關閉當前客服單，存檔日誌並產出網頁對話備份。' }
          );
      } else if (selection === 'economy') {
        replyEmbed
          .setTitle('🎮 社群經濟與活躍指令')
          .setDescription('增強社群黏著度、代幣互動與娛樂性的指令。')
          .addFields(
            { name: '`/daily`', value: '每日簽到（每 24 小時一次），賺取隨機數量的伺服器代幣。' },
            { name: '`/blindbox [action]`', value: '• `view`：檢視盲盒獎項與中獎率\n• `draw`：消耗代幣抽取盲盒，可能獲得限定身份組。' },
            { name: '`/predict [action]`', value: '• `create`：發起預測\n• `bet`：押注代幣\n• `resolve`：結算預測並分紅彩池。' },
            { name: '`/profile [user]`', value: '查看自己或他人的活躍等級 (Level)、經驗值 (XP)、代幣餘額與解鎖成就。' },
            { name: '`/pet [action]`', value: '虛擬電子雞寵物系統。可查看狀態 (`status`)、消耗代幣餵食 (`feed`)、陪玩 (`play`) 或改名 (`rename`)。' },
            { name: '`/fortune`', value: '抽取今日運勢占卜，獲得今日隨機點評與建議。' },
            { name: '`/trivia`', value: '發起益智搶答。第一個在限時內回答正確者，可獲得代幣獎勵！' },
            { name: '`/birthday <MM-DD>`', value: '設定個人生日，讓伺服器夥伴在特別的日子祝賀您。' }
          );
      }

      await i.update({ embeds: [replyEmbed] });
    });

    collector.on('end', () => {
      // 收集器過期後將下拉選單停用，防範操作無反應
      const disabledMenu = StringSelectMenuBuilder.from(menu).setDisabled(true);
      const disabledRow = new ActionRowBuilder().addComponents(disabledMenu);
      interaction.editReply({ components: [disabledRow] }).catch(() => {});
    });
  },
};
