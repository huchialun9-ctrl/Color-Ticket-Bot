import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { UserEconomy } from '../../../api/src/models/UserEconomy.js';
import { isDBReady } from '../db.js';

function calcStats(record) {
  const now = new Date();
  
  // 飽食度下降：每小時掉 5 點
  const hoursSinceFed = (now - new Date(record.petLastFed || now)) / 36e5;
  let fullness = (record.petFullness ?? 100) - Math.floor(hoursSinceFed * 5);
  if (fullness < 0) fullness = 0;
  
  // 心情下降：每小時掉 4 點
  const hoursSincePlayed = (now - new Date(record.petLastPlayed || now)) / 36e5;
  let mood = (record.petMood ?? 100) - Math.floor(hoursSincePlayed * 4);
  if (mood < 0) mood = 0;

  return { fullness, mood };
}

export default {
  data: new SlashCommandBuilder()
    .setName('pet')
    .setDescription('虛擬電子雞：與您的專屬寵物互動')
    .addSubcommand((sub) =>
      sub.setName('status').setDescription('查看寵物的狀態（等級、飽食度、心情）'),
    )
    .addSubcommand((sub) =>
      sub.setName('feed').setDescription('花費 15 代幣餵食寵物（恢復飽食度 + 增加經驗）'),
    )
    .addSubcommand((sub) =>
      sub.setName('play').setDescription('花費 10 代幣陪寵物玩耍（恢復心情 + 增加經驗）'),
    )
    .addSubcommand((sub) =>
      sub
        .setName('rename')
        .setDescription('花費 50 代幣重新命名寵物')
        .addStringOption((o) => o.setName('name').setDescription('新名稱').setRequired(true)),
    ),
  async execute(interaction) {
    if (!isDBReady()) {
      return interaction.reply({ content: '❌ 資料庫未就緒，請稍後再試！', ephemeral: true });
    }

    const { guildId, user } = interaction;
    const sub = interaction.options.getSubcommand();

    try {
      let record = await UserEconomy.findOne({ guildId, userId: user.id });
      if (!record) {
        record = await UserEconomy.create({ guildId, userId: user.id });
      }

      const { fullness, mood } = calcStats(record);
      // 更新即時狀態
      record.petFullness = fullness;
      record.petMood = mood;

      // === STATUS ===
      if (sub === 'status') {
        const xpNeeded = record.petLevel * 100;
        let emoji = '😐';
        if (mood > 70 && fullness > 70) emoji = '🥰';
        else if (mood < 30 || fullness < 30) emoji = '😭';

        const embed = new EmbedBuilder()
          .setColor(0xf1c40f)
          .setTitle(`${emoji} ${record.petName} 的狀態面板`)
          .setDescription(`這是您專屬的虛擬寵物，請記得常常來餵食和陪牠玩哦！`)
          .addFields(
            { name: '🌟 等級', value: `**LV.${record.petLevel}** (${record.petXP}/${xpNeeded} XP)`, inline: true },
            { name: '🍗 飽食度', value: `**${fullness}%** ${fullness < 30 ? '*(肚子餓)*' : ''}`, inline: true },
            { name: '⚽ 心情', value: `**${mood}%** ${mood < 30 ? '*(想玩耍)*' : ''}`, inline: true },
            { name: '💰 您的代幣餘額', value: `**${record.balance}** 代幣`, inline: false }
          )
          .setTimestamp();
        
        // Save the recalculated stats
        await record.save();
        return interaction.reply({ embeds: [embed] });
      }

      // === FEED ===
      if (sub === 'feed') {
        if (record.balance < 15) {
          return interaction.reply({ content: '❌ 餘額不足！餵食需要 **15** 代幣。', ephemeral: true });
        }
        if (fullness >= 100) {
          return interaction.reply({ content: `🍗 **${record.petName}** 已經吃得很飽了，吃不下啦！`, ephemeral: true });
        }

        record.balance -= 15;
        record.petFullness = Math.min(100, fullness + 30);
        record.petXP += 40;
        record.petLastFed = new Date();

        let levelUpText = '';
        const xpNeeded = record.petLevel * 100;
        if (record.petXP >= xpNeeded) {
          record.petXP -= xpNeeded;
          record.petLevel += 1;
          levelUpText = `\n🎉 恭喜！**${record.petName}** 升級到了 **LV.${record.petLevel}**！`;
        }

        await record.save();

        const embed = new EmbedBuilder()
          .setColor(0x2ed573)
          .setTitle(`🍗 餵食 ${record.petName}`)
          .setDescription(
            `您花了 15 代幣餵食 **${record.petName}**。飽食度恢復至 **${record.petFullness}%**！\n成長經驗值 +40 (當前: ${record.petXP}/${record.petLevel * 100})${levelUpText}\n目前餘額: **${record.balance}**。`
          );
        return interaction.reply({ embeds: [embed] });
      }

      // === PLAY ===
      if (sub === 'play') {
        if (record.balance < 10) {
          return interaction.reply({ content: '❌ 餘額不足！玩耍需要 **10** 代幣。', ephemeral: true });
        }
        if (fullness < 20) {
          return interaction.reply({ content: `😭 **${record.petName}** 肚子太餓了，沒有力氣玩，請先餵食！`, ephemeral: true });
        }
        if (mood >= 100) {
          return interaction.reply({ content: `⚽ **${record.petName}** 現在心情非常完美！`, ephemeral: true });
        }

        record.balance -= 10;
        record.petMood = Math.min(100, mood + 40);
        record.petFullness = Math.max(0, fullness - 10); // 玩耍會扣飽食度
        record.petXP += 25;
        record.petLastPlayed = new Date();

        let levelUpText = '';
        const xpNeeded = record.petLevel * 100;
        if (record.petXP >= xpNeeded) {
          record.petXP -= xpNeeded;
          record.petLevel += 1;
          levelUpText = `\n🎉 恭喜！**${record.petName}** 升級到了 **LV.${record.petLevel}**！`;
        }

        await record.save();

        const embed = new EmbedBuilder()
          .setColor(0xffa502)
          .setTitle(`⚽ 陪 ${record.petName} 玩耍`)
          .setDescription(
            `您花了 10 代幣陪 **${record.petName}** 玩飛盤。心情恢復至 **${record.petMood}%**！\n成長經驗值 +25 (當前: ${record.petXP}/${record.petLevel * 100})${levelUpText}\n目前餘額: **${record.balance}**。`
          );
        return interaction.reply({ embeds: [embed] });
      }

      // === RENAME ===
      if (sub === 'rename') {
        const newName = interaction.options.getString('name');
        if (record.balance < 50) {
          return interaction.reply({ content: '❌ 餘額不足！重新命名需要 **50** 代幣。', ephemeral: true });
        }

        record.balance -= 50;
        const oldName = record.petName;
        record.petName = newName;
        await record.save();

        const embed = new EmbedBuilder()
          .setColor(0x3498db)
          .setTitle('🏷️ 寵物命名成功')
          .setDescription(
            `您花了 50 代幣將寵物 **${oldName}** 重新命名為 **${newName}**！\n目前餘額: **${record.balance}**。`
          );
        return interaction.reply({ embeds: [embed] });
      }
    } catch (err) {
      console.error('[command][pet] error', err);
      await interaction.reply({ content: '❌ 進行寵物互動時發生錯誤。', ephemeral: true });
    }
  },
};
