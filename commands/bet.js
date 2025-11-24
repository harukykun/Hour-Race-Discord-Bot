const { EmbedBuilder } = require('discord.js');
const betManager = require('../utils/betManager');
// Thêm dòng này để lấy thông tin tên ngựa
const raceManager = require('../utils/raceManager');

module.exports = {
  name: 'bet',
  description: 'Đặt cược vào một con ngựa',
  execute(message, args, client) {
    // Kiểm tra đủ tham số
    if (args.length < 2) {
      return message.reply('Sử dụng: !bet <số_ngựa> <số_tiền>\nVí dụ: `!bet 1 100`');
    }
    
    // Phân tích tham số
    const horseNumber = parseInt(args[0]);
    const betAmount = parseInt(args[1]);
    
    // Kiểm tra tham số hợp lệ
    if (isNaN(horseNumber) || isNaN(betAmount)) {
      return message.reply('Số ngựa và số tiền cược phải là số.');
    }
    
    // Đặt cược thông qua betManager
    const result = betManager.placeBet(message.author.id, horseNumber, betAmount);
    
    // Xử lý nội dung hiển thị
    let description = result.message;
    
    // Nếu đặt cược thành công, hiển thị tên ngựa thay vì tin nhắn mặc định
    if (result.success) {
        // Lấy tên ngựa từ raceManager
        const horseName = raceManager.getHorseName(horseNumber);
        
        description = `Đã đặt cược **${betAmount} coin** vào chiến mã **${horseName}** (Số ${horseNumber}). Hãy chờ xem bạn cook hay bạn đổi đời :Đ.`;
    }
    
    // Tạo embed thông báo
    const embed = new EmbedBuilder()
      .setTitle('🎲 Đặt cược thành công')
      .setColor(result.success ? '#00FF00' : '#FF0000')
      .setDescription(description)
      .setTimestamp()
      .setFooter({ text: `${message.author.username}`, iconURL: message.author.displayAvatarURL() });
    
    // Thêm thông tin số dư nếu đặt cược thành công
    if (result.success) {
      embed.addFields({ name: 'Số dư còn lại', value: `${result.balance} coin`, inline: true });
    }
    
    return message.reply({ embeds: [embed] });
  },
};