// File: commands/prerace.js

const { EmbedBuilder } = require('discord.js');
const raceManager = require('../utils/raceManager');
const betManager = require('../utils/betManager');
const raceCommand = require('./race'); // <-- Import lệnh Race để gọi tự động

module.exports = {
  name: 'prerace',
  description: 'Chuẩn bị danh sách ngựa và bắt đầu đếm ngược 60s',
  async execute(message, args, client) { // Thêm async để gọi raceCommand
    
    // 1. Kiểm tra trạng thái: Đang đua hoặc Đang đếm ngược thì chặn
    if (raceManager.isRaceInProgress()) {
      return message.reply('❌ Cuộc đua đang diễn ra, không thể tạo trận mới!');
    }
    if (raceManager.isPreraceInProgress()) {
        return message.reply('⏳ Đang trong thời gian chờ đặt cược rồi! Hãy nhanh tay đặt cược.');
    }

    // 2. Bật trạng thái đếm ngược
    raceManager.setPreraceStatus(true);
    
    // Xóa cược cũ nếu muốn (ở đây giữ nguyên logic cũ là không xóa clearAllBets tại đây mà clear sau khi đua xong)

    // Tạo danh sách tên ngẫu nhiên mới
    const horses = raceManager.generateRaceNames();

    // Tạo Embed hiển thị danh sách
    const embed = new EmbedBuilder()
      .setTitle('📋 DANH SÁCH CHIẾN MÃ - CHUẨN BỊ KHỞI TRANH')
      .setColor('#FFA500')
      .setDescription('⏱️ **Thời gian đặt cược: 60 giây!**\nNhanh tay dùng lệnh: `!bet <số_thứ_tự> <tiền>`\nCuộc đua sẽ tự động bắt đầu sau khi hết giờ.')
      .setTimestamp();

    let listText = '';
    for (let i = 1; i <= raceManager.HORSE_COUNT; i++) {
      listText += `**#${i}**: ${horses[i]}\n`;
    }

    embed.addFields({ name: '🏇 Các ứng cử viên vô địch:', value: listText, inline: false });
    
    await message.reply({ embeds: [embed] });

    // 3. Gửi thông báo đếm ngược (Optional: Thông báo thêm lúc còn 10s)
    setTimeout(() => {
        if (!raceManager.isRaceInProgress()) { // Kiểm tra lại cho chắc
            message.channel.send('⚠️ **Chỉ còn 10 giây để đặt cược!** ⚠️');
        }
    }, 50000); // 50 giây

    // 4. Hẹn giờ 60 giây để bắt đầu đua
    setTimeout(async () => {
        // Tắt trạng thái Prerace để lệnh Race có thể chạy (vì Race check isRaceInProgress thôi, nhưng ta cần reset biến này cho lần sau)
        raceManager.setPreraceStatus(false);
        
        // Thông báo hết giờ
        await message.channel.send('🚫 **HẾT GIỜ ĐẶT CƯỢC!** Cuộc đua bắt đầu ngay bây giờ!');
        
        // Gọi lệnh Race tự động
        try {
            // Truyền message, args rỗng và client vào
            await raceCommand.execute(message, [], client);
        } catch (error) {
            console.error('Lỗi khi tự động bắt đầu đua:', error);
            message.channel.send('Có lỗi xảy ra khi tự động bắt đầu cuộc đua.');
        }

    }, 60000); // 60000 ms = 60 giây
  },
};
