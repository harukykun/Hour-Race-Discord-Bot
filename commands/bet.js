// File: commands/bet.js (CẬP NHẬT)

// ...
module.exports = {
  name: 'bet',
  description: 'Đặt cược vào một con ngựa',
  async execute(message, args, client) { // THÊM ASYNC
    // ... (phần kiểm tra tham số giữ nguyên)
    
    // 2. Phân tích số tiền cược (Xử lý Logic All-in)
    let betAmount;
    const rawAmount = args[1].toLowerCase(); 

    if (rawAmount === 'allin') {
        // Lấy toàn bộ số dư từ betManager (đã là async)
        betAmount = await betManager.getBalance(message.author.id); // THÊM AWAIT
    } else {
        // ...
    }
    
    // ... (phần kiểm tra số tiền giữ nguyên)
    
    // Đặt cược thông qua betManager
    const result = await betManager.placeBet(message.author.id, horseNumber, betAmount); // THÊM AWAIT
    
    // ... (phần xử lý nội dung hiển thị giữ nguyên)
  },
};
const { EmbedBuilder } = require('discord.js');
const betManager = require('../utils/betManager');
const raceManager = require('../utils/raceManager');

module.exports = {
  name: 'bet',
  description: 'Đặt cược vào một con ngựa',
  execute(message, args, client) {
    // Kiểm tra đủ tham số
    if (args.length < 2) {
      return message.reply('Sử dụng: `!bet <số_ngựa> <số_tiền>` hoặc `!bet <số_ngựa> allin`\nVí dụ: `!bet 1 100`');
    }
    
    // 1. Phân tích số ngựa
    const horseNumber = parseInt(args[0]);
    
    // 2. Phân tích số tiền cược (Xử lý Logic All-in)
    let betAmount;
    const rawAmount = args[1].toLowerCase(); // Chuyển về chữ thường để check

    if (rawAmount === 'allin') {
        // Nếu lệnh là allin, lấy toàn bộ số dư từ betManager
        // Đảm bảo betManager có hàm getBalance nhé!
        betAmount = betManager.getBalance(message.author.id);
    } else {
        // Nếu không phải allin, parse số như bình thường
        betAmount = parseInt(args[1]);
    }
    
    // Kiểm tra tham số hợp lệ
    if (isNaN(horseNumber) || isNaN(betAmount)) {
      return message.reply('Số ngựa và số tiền cược phải là số hợp lệ.');
    }

    // Kiểm tra nếu all-in mà tài khoản bằng 0
    if (betAmount <= 0) {
        return message.reply('Bạn không còn đồng nào để all-in (hoặc số tiền không hợp lệ)!');
    }
    
    // Đặt cược thông qua betManager
    const result = betManager.placeBet(message.author.id, horseNumber, betAmount);
    
    // Xử lý nội dung hiển thị
    let description = result.message;
    
    // Nếu đặt cược thành công
    if (result.success) {
        const horseName = raceManager.getHorseName(horseNumber);
        
        // Thay đổi câu thông báo một chút nếu là All-in cho kịch tính (tùy chọn)
        if (rawAmount === 'allin') {
             description = `🔥 **ALL-IN KHÔ MÁU!** 🔥\nĐã tất tay **${betAmount} coin** vào chiến mã **${horseName}** (Số ${horseNumber}).\nMột là về bờ, hai là ra đê!`;
        } else {
             description = `Đã đặt cược **${betAmount} coin** vào chiến mã **${horseName}** (Số ${horseNumber}). Hãy chờ xem bạn cook hay bạn đổi đời :Đ.`;
        }
    }
    
    // Tạo embed thông báo
    const embed = new EmbedBuilder()
      .setTitle(result.success ? '🎲 Đặt cược thành công' : '❌ Đặt cược thất bại')
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

