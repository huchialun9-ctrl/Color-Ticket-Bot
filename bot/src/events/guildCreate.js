import { Events, EmbedBuilder } from 'discord.js';
import { pushGuildSnapshot } from '../modules/api/signer.js';
import { updatePresence } from '../modules/presence.js';

export default {
  name: Events.GuildCreate,
  once: false,
  async execute(guild) {
    updatePresence(guild.client);
    pushGuildSnapshot([guild]).catch((err) => {
      console.error('[guildCreate][sync]', err.message);
    });

    // 自動私訊給伺服器擁有者一長列說明與引導資料
    try {
      const owner = await guild.fetchOwner();
      const welcomeEmbed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle('🐼 歡迎使用 胖達CHubbMan 伺服器管理大師！')
        .setDescription(`感謝您將 胖達CHubbMan 邀請至您的伺服器 **${guild.name}**！我們為您準備了全方位的社群管理、票務客服、自動化與經濟模組。`)
        .addFields(
          { name: '🌐 官方管理控制台 (網頁儀表板)', value: '👉 https://color-ticket-bot.onrender.com\n使用您的 Discord 帳號一鍵登入，即可圖形化配置所有設定。' },
          { name: '🎫 1. 客服工單系統', value: '在控制台設計「自定義表單欄位」並「發布按鈕面板」，用戶點擊按鈕即可建立獨立私密票務頻道。' },
          { name: '🛡️ 2. 全域聯防黑名單', value: '與其他託管伺服器共享黑名單網絡。若黑名單成員加入，系統秒級自動剔除並發送警報。' },
          { name: '📢 3. 排程與自動化公告', value: '預先排定發文時間，或設定「關鍵字自動回覆」（限工單頻道），減輕客服負擔。' },
          { name: '🔊 4. 語音動態管理 (Join to Create)', value: '設定語音母頻道，當成員加入時自動建立子語音房，全數離開後自動刪除。' },
          { name: '🎮 5. 活躍積分與社群經濟', value: '• `/daily` 每日簽到領取代幣\n• `/blindbox` 盲盒抽獎（可設中獎機率與身份組獎勵）\n• `/profile` 查看當前活躍等級、經驗值名片\n• `/pet` 餵食虛擬寵物、升級命名\n• `/predict` 發起預測，成員押注並依比例分紅\n• `/fortune` 運勢占卜與 `/trivia` 限時答題' },
          { name: '⚙️ 6. 身分組互斥規則鎖', value: '設定互斥身份組（如男/女、新手/老手），被授予新身份組時自動卸載相衝突的舊身份。' }
        )
        .setFooter({ text: '胖達CHubbMan · 24/7 守護您的社群安全與熱度' })
        .setTimestamp();

      await owner.send({ embeds: [welcomeEmbed] });
      console.log(`[guildCreate] Successfully sent welcome DM to owner of ${guild.name}`);
    } catch (err) {
      console.error(`[guildCreate][welcome-dm] Failed to send DM to owner of ${guild.name}:`, err.message);
    }
  },
};
