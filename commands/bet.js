const { EmbedBuilder } = require('discord.js');
const betManager = require('../utils/betManager');
const raceManager = require('../utils/raceManager');

module.exports = {
  name: 'bet',
  description: 'Đặt cược (có chế độ all-in)',
  async execute(message, args, client) {
    try {
        if (args.length < 2) return message.reply('Dùng: `!bet <ngựa> <tiền>` hoặc `!bet <ngựa> allin`');
        
        const horseNumber = parseInt(args[0]);
        let betAmount;
        let isAllIn = false; // Biến cờ đánh dấu
        
        const rawAmount = args[1].toLowerCase(); 

        if (rawAmount === 'allin') {
            betAmount = await betManager.getBalance(message.author.id);
            isAllIn = true; // Bật cờ lên
        } else {
            betAmount = parseInt(args[1]);
        }
        
        if (isNaN(horseNumber) || isNaN(betAmount)) return message.reply('Số liệu không hợp lệ.');
        if (betAmount <= 0) return message.reply('Trắng dé rồi thì all in kiểu gì?.');
        
        // Truyền biến isAllIn vào hàm placeBet
        const result = await betManager.placeBet(message.author.id, horseNumber, betAmount, isAllIn);
        
        let description = result.message;
        if (result.success) {
            const horseName = raceManager.getHorseName(horseNumber);
            if (isAllIn) { // Nếu là all-in thì thông báo ngầu hơn
                 description = `🔥 **ALL-IN KHÔ MÁU!** 🔥\nĐã tất tay **${betAmount} coin** vào **${horseName}** (Số ${horseNumber}).\n"Được ăn cả, ngã về không!"`;
            } else {
                 description = `Đã cược **${betAmount} coin** vào **${horseName}** (Số ${horseNumber}).`;
            }
        }
        
        const embed = new EmbedBuilder()
          .setTitle(result.success ? '🎲 Đặt cược thành công' : '❌ Đặt cược thất bại')
          .setColor(result.success ? (isAllIn ? '#FF0000' : '#00FF00') : '#FF0000') // All-in màu đỏ cho cháy
          .setDescription(description)
          .setTimestamp()
          .setFooter({ text: message.author.username, iconURL: message.author.displayAvatarURL() });
        
        if (result.success) embed.addFields({ name: 'Số dư còn lại', value: `${result.balance} coin`, inline: true });
        
        return message.reply({ embeds: [embed] });

    } catch (error) {
        console.error(error);
        return message.reply('Lỗi khi đặt cược.');
    }
  },
};

