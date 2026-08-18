import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { UserEconomy } from '../../../api/src/models/UserEconomy.js';
import { BlindBox } from '../../../api/src/models/BlindBox.js';
import { isDBReady } from '../db.js';

export default {
  data: new SlashCommandBuilder()
    .setName('blindbox')
    .setDescription('花費 150 代幣抽取社群盲盒')
    .addStringOption((o) =>
      o
        .setName('action')
        .setDescription('選擇動作：draw (抽盲盒) 或 list (查看獎品清單)')
        .setRequired(true)
        .addChoices(
          { name: '抽盲盒 🎁', value: 'draw' }, 
          { name: '獎品清單 📜', value: 'list' },
          { name: '新增獎品 (管理員)', value: 'add' },
          { name: '移除獎品 (管理員)', value: 'remove' }
        ),
    )
    .addStringOption((o) => o.setName('name').setDescription('獎品名稱 (新增/移除時使用)'))
    .addStringOption((o) => o.setName('rarity').setDescription('稀有度 (新增時使用) 例如: SSR, SR, R, N'))
    .addIntegerOption((o) => o.setName('weight').setDescription('中獎權重 (新增時使用) 數字越大越容易中'))
    .addRoleOption((o) => o.setName('role').setDescription('綁定獲得的身份組 (新增時選填)')),
  async execute(interaction) {
    if (!isDBReady()) {
      return interaction.reply({ content: '❌ 資料庫未就緒，請稍後再試！', ephemeral: true });
    }

    const { guildId, user, guild } = interaction;
    const action = interaction.options.getString('action');

    try {
      if (action === 'add') {
        const name = interaction.options.getString('name');
        const rarity = interaction.options.getString('rarity') || 'N';
        const weight = interaction.options.getInteger('weight') || 100;
        const role = interaction.options.getRole('role');

        if (!name) return interaction.reply({ content: '❌ 新增獎品必須提供 name 參數！', ephemeral: true });

        await BlindBox.create({
          guildId,
          name,
          rarity,
          weight,
          roleRewardId: role?.id || null,
        });

        return interaction.reply({ content: `✅ 成功新增盲盒獎品：**${name}** [${rarity}] (權重: ${weight})` });
      }

      if (action === 'remove') {
        const name = interaction.options.getString('name');
        if (!name) return interaction.reply({ content: '❌ 移除獎品必須提供 name 參數！', ephemeral: true });

        const res = await BlindBox.deleteOne({ guildId, name });
        if (res.deletedCount === 0) {
          return interaction.reply({ content: `❌ 找不到名為 **${name}** 的獎品。`, ephemeral: true });
        }
        return interaction.reply({ content: `✅ 成功移除獎品：**${name}**` });
      }

      if (action === 'list') {
        const prizes = await BlindBox.find({ guildId });
        if (prizes.length === 0) {
          return interaction.reply({ content: '📜 目前此伺服器尚無設定盲盒獎品清單。', ephemeral: true });
        }

        const listText = prizes
          .map((p) => `• **${p.name}** [${p.rarity}] (權重: ${p.weight})`)
          .join('\n');

        const embed = new EmbedBuilder()
          .setColor(0x5865f2)
          .setTitle('🎁 盲盒獎品清單')
          .setDescription(listText)
          .setFooter({ text: '輸入 /blindbox 選擇 抽盲盒 來抽取吧！' });

        return interaction.reply({ embeds: [embed] });
      }

      // Draw blindbox logic
      let record = await UserEconomy.findOne({ guildId, userId: user.id });
      if (!record || record.balance < 150) {
        const bal = record ? record.balance : 0;
        return interaction.reply({
          content: `❌ 餘額不足！抽取盲盒需要 **150** 枚代幣，您目前僅有 **${bal}** 枚。`,
          ephemeral: true,
        });
      }

      const prizes = await BlindBox.find({ guildId });
      if (prizes.length === 0) {
        return interaction.reply({
          content: '❌ 目前尚無配置盲盒獎品。請管理員在網頁後台進行設定。',
          ephemeral: true,
        });
      }

      // Weighted random selection
      const totalWeight = prizes.reduce((acc, p) => acc + (p.weight || 100), 0);
      let rand = Math.random() * totalWeight;
      let prize = null;

      for (const p of prizes) {
        rand -= p.weight || 100;
        if (rand <= 0) {
          prize = p;
          break;
        }
      }
      if (!prize) prize = prizes[prizes.length - 1];

      // Deduct balance and update inventory
      record.balance -= 150;
      if (!record.badges.includes(prize.name)) {
        record.badges.push(prize.name);
      }
      await record.save();

      let roleResult = '';
      if (prize.roleRewardId) {
        const member = await guild.members.fetch(user.id).catch(() => null);
        const role = guild.roles.cache.get(prize.roleRewardId);
        if (member && role) {
          await member.roles.add(role).catch(() => {});
          roleResult = `\n系統已自動為您指派身分組：**${role.name}**！`;
        }
      }

      const embed = new EmbedBuilder()
        .setColor(0xffa500)
        .setTitle('🎉 盲盒中獎了！')
        .setDescription(
          `恭喜 ${user} 抽中稀有度 [**${prize.rarity}**] 的獎品：\n🏆 **${prize.name}**！${roleResult}\n已從餘額扣除 150 代幣，目前餘額：**${record.balance}**。`
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (err) {
      console.error('[command][blindbox] error', err);
      await interaction.reply({ content: '❌ 抽取盲盒時發生錯誤。', ephemeral: true });
    }
  },
};
