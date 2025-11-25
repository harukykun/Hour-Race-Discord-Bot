const { EmbedBuilder } = require('discord.js');
const raceManager = require('../utils/raceManager'); // Import để lấy số lượng ngựa

module.exports = {
  name: 'help',
  description: 'Hiển thị hướng dẫn sử dụng bot',
  execute(message, args, client) {
    const embed = new EmbedBuilder()
      .setTitle('🏇 Bot Đua Ngựa - Hướng Dẫn')
      .setColor('#0099ff')
      .setDescription('Chào mừng đến với trường đua ngựa!')
      .addFields(
        { name: '!prerace', value: 'Xem danh sách tên ngựa và số thứ tự ngựa trong trận tới. Countdown 60s cho mọi người cược', inline: false },
        { name: `!bet <ngựa> <tiền>`, value: `Đặt cược vào số thứ tự ngựa (1-${raceManager.HORSE_COUNT})`, inline: false },
        { name: '!balance', value: 'Xem túi tiền của bạn', inline: false },
        { name: '!leaderboard', value: 'Bảng xếp hạng đại gia', inline: false },
        { name: '!daily', value: 'Điểm danh nhận 500 coin mỗi ngày', inline: false }
      )
      .setTimestamp()
      .setFooter({ text: 'Mẹo: Dùng !prerace trước để chọn tên ngựa đẹp!' });
    
    return message.reply({ embeds: [embed] });
  },

};
