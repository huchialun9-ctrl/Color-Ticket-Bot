import { Events, ChannelType } from 'discord.js';
import { auditLog } from '../modules/automod/auditLog.js';
import { getSettings } from '../modules/settings.js';
import { TempVoice } from '../../../api/src/models/TempVoice.js';
import { MemberXP } from '../../../api/src/models/MemberXP.js';

// 記憶體中暫存語音加入時間： key = `${guildId}-${userId}`, value = timestamp
const voiceSessions = new Map();

export default {
  name: Events.VoiceStateUpdate,
  async execute(client, oldState, newState) {
    const member = newState.member || oldState.member;
    if (member?.user.bot) return;

    const guild = newState.guild || oldState.guild;
    const settings = await getSettings(guild.id);
    const sessionKey = `${guild.id}-${member.id}`;

    // ---- 1. 語音經驗值 (Voice XP) 累加處理 ----
    // 進入語音
    if (!oldState.channelId && newState.channelId) {
      voiceSessions.set(sessionKey, Date.now());
    } 
    // 離開或換語音頻道時計算並結算經驗值
    else if (oldState.channelId && (!newState.channelId || oldState.channelId !== newState.channelId)) {
      const joinTime = voiceSessions.get(sessionKey);
      if (joinTime) {
        const ms = Date.now() - joinTime;
        const minutes = Math.floor(ms / 60000);
        if (minutes > 0) {
          const xpEarned = minutes * 12; // 每分鐘 12 經驗值
          try {
            await MemberXP.findOneAndUpdate(
              { guildId: guild.id, userId: member.id },
              { 
                $inc: { xp: xpEarned, voiceMinutes: minutes },
                $set: { lastXpEarnedAt: new Date() }
              },
              { upsert: true, new: true }
            ).then(async (doc) => {
              // 自動計算升級
              const nextLevel = Math.floor(0.15 * Math.sqrt(doc.xp)) + 1;
              if (nextLevel > doc.level) {
                doc.level = nextLevel;
                await doc.save();
                // 在語音頻道對應的文字頻道或發送通知（此處簡化為背景升級記錄）
                console.log(`[leveling] 成員 ${member.user.tag} 在語音活動中升級至 Level ${nextLevel}`);
              }
            });
          } catch (e) {
            console.error('[voiceStateUpdate][xp] 經驗值結算失敗', e.message);
          }
        }
        // 如果是換頻道，重新開始計時；如果是退出，直接刪除 Session
        if (newState.channelId) {
          voiceSessions.set(sessionKey, Date.now());
        } else {
          voiceSessions.delete(sessionKey);
        }
      }
    }

    // ---- 2. 審查日誌與動態語音頻道管理 ----
    if (!oldState.channelId && newState.channelId) {
      await auditLog(guild, 'voice_state', {
        member: member.user.tag,
        action: 'joined',
        channel: newState.channel.name,
      });

      // 檢查是否加入了「點擊建立語音頻道」的專用創作者頻道
      if (settings.voiceCreatorChannelId && newState.channelId === settings.voiceCreatorChannelId) {
        try {
          const newChannel = await guild.channels.create({
            name: `${member.displayName} 的專屬頻道`,
            type: ChannelType.GuildVoice,
            parent: newState.channel.parentId || null,
          });

          // 移動使用者到新頻道
          await newState.setChannel(newChannel);

          // 寫入資料庫標記為暫時性語音頻道
          await TempVoice.create({
            guildId: guild.id,
            channelId: newChannel.id,
            creatorId: member.id,
          });
          
          await sendVoiceControlPanel(newChannel, member);
        } catch (err) {
          console.error('[voiceStateUpdate][dynamic-voice] 建立頻道失敗', err.message);
        }
      }

    } else if (oldState.channelId && !newState.channelId) {
      await auditLog(guild, 'voice_state', {
        member: member.user.tag,
        action: 'left',
        channel: oldState.channel.name,
      });

      // 檢查離開的是否為臨時頻道，且人數已歸零
      await checkAndCleanTempChannel(guild, oldState.channel);

    } else if (oldState.channelId !== newState.channelId) {
      await auditLog(guild, 'voice_state', {
        member: member.user.tag,
        action: 'moved',
        from: oldState.channel.name,
        to: newState.channel.name,
      });

      // 移動頻道時，同時檢查舊頻道是否為臨時頻道且需銷毀
      await checkAndCleanTempChannel(guild, oldState.channel);

      // 同時檢查新頻道是否為「點擊建立語音頻道」
      if (settings.voiceCreatorChannelId && newState.channelId === settings.voiceCreatorChannelId) {
        try {
          const newChannel = await guild.channels.create({
            name: `${member.displayName} 的專屬頻道`,
            type: ChannelType.GuildVoice,
            parent: newState.channel.parentId || null,
          });
          await newState.setChannel(newChannel);
          await TempVoice.create({
            guildId: guild.id,
            channelId: newChannel.id,
            creatorId: member.id,
          });
          await sendVoiceControlPanel(newChannel, member);
        } catch (err) {
          console.error('[voiceStateUpdate][dynamic-voice] 建立頻道失敗', err.message);
        }
      }
    }
  },
};

/** 發送互動式語音控制面板 */
async function sendVoiceControlPanel(channel, member) {
  try {
    const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle('🎛️ 您的專屬語音房已建立')
      .setDescription(`歡迎，${member}！您是此頻道的房主。\n請點擊下方按鈕即可**免打指令**管理您的私人包廂：`)
      .setFooter({ text: '頻道無人時將自動銷毀' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('vc_lock').setLabel('🔒 鎖定頻道').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('vc_unlock').setLabel('🔓 解鎖頻道').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('vc_hide').setLabel('👁️ 隱藏頻道').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('vc_rename').setLabel('✏️ 重新命名').setStyle(ButtonStyle.Primary)
    );

    await channel.send({ content: `${member}`, embeds: [embed], components: [row] }).catch(() => {});
  } catch (err) {
    console.error('[voiceStateUpdate] sendVoiceControlPanel error', err.message);
  }
}

/** 檢查並清理無人的臨時語音頻道 */
async function checkAndCleanTempChannel(guild, channel) {
  if (!channel) return;
  try {
    const record = await TempVoice.findOne({ channelId: channel.id });
    if (record) {
      // 重新獲取最新頻道狀態確認人數
      const liveChannel = guild.channels.cache.get(channel.id);
      if (liveChannel && liveChannel.members.size === 0) {
        await liveChannel.delete().catch(() => {});
        await TempVoice.deleteOne({ channelId: channel.id });
        console.log(`[dynamic-voice] 臨時語音頻道已銷毀: ${channel.name}`);
      }
    }
  } catch (err) {
    console.error('[voiceStateUpdate][clean-voice] 清理失敗', err.message);
  }
}
