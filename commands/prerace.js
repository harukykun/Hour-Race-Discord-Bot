const { EmbedBuilder } = require('discord.js');
const raceManager = require('../utils/raceManager');
const betManager = require('../utils/betManager');

module.exports = {
  name: 'prerace',
  description: 'Chuẩn bị danh sách ngựa và xem thông tin trước khi đua',
  execute(message, args, client) {
    // Kiểm tra nếu đua đang diễn ra thì không reset tên
    if (raceManager.isRaceInProgress()) {
      return message.reply('Cuộc đua đang diễn ra, không thể tạo danh sách mới!');
    }

    // Reset cược cũ nếu có (tùy chọn, ở đây ta giữ nguyên để người chơi cược tiếp)
    // betManager.clearAllBets(); 

    // Tạo danh sách tên ngẫu nhiên mới
    const horses = raceManager.generateRaceNames();

    // Tạo Embed hiển thị danh sách
    const embed = new EmbedBuilder()
      .setTitle('📋 DANH SÁCH CHIẾN MÃ TRẬN TỚI')
      .setColor('#FFA500')
      .setDescription('Hãy xem tên và chọn số thứ tự may mắn để đặt cược!\nDùng lệnh: `!bet <số_thứ_tự> <tiền>`')
      .setTimestamp();

    // Tạo nội dung danh sách chia làm 2 cột (vì 10 con hơi dài)
    let listText = '';
    for (let i = 1; i <= raceManager.HORSE_COUNT; i++) {
      listText += `**#${i}**: ${horses[i]}\n`;
    }

    embed.addFields({ name: '🏇 các mã nương sẽ tham gia trong cuộc đua tới:', value: listText, inline: false });
    embed.setFooter({ text: 'Cuộc đua sẽ rất khốc liệt với 10 mã nương!' });

    return message.reply({ embeds: [embed] });
  },
};