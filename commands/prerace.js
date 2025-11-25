// File: commands/prerace.js

const { EmbedBuilder } = require('discord.js');
const raceManager = require('../utils/raceManager');
const betManager = require('../utils/betManager');
const raceCommand = require('./race'); // [Thêm] Import lệnh race

module.exports = {
  name: 'prerace',
  description: 'Chuẩn bị danh sách ngựa và đếm ngược bắt đầu',
  async execute(message, args, client) {
    // 1. Kiểm tra nếu đang đua hoặc đang đếm ngược thì chặn
    if (raceManager.isRaceInProgress()) {
      return message.reply('❌ Cuộc đua đang diễn ra, không thể tạo trận mới!');
    }
    if (raceManager.isPreraceInProgress()) {
        return message.reply('⏳ Đang trong thời gian chờ đặt cược rồi! Hãy nhanh tay đặt cược.');
    }

    // 2. Bật trạng thái Prerace
    raceManager.setPreraceStatus(true);

    // Tạo danh sách tên ngẫu nhiên
    const horses = raceManager.generateRaceNames();

    // Chuẩn bị nội dung danh sách ngựa
    let listText = '';
    for (let i = 1; i <= raceManager.HORSE_COUNT; i++) {
      listText += `**#${i}**: ${horses[i]}\n`;
    }

    let timeLeft = 60; // 60 giây

    // Hàm tạo Embed (để dùng lại khi edit tin nhắn)
    const createEmbed = (seconds) => {
        return new EmbedBuilder()
          .setTitle('📋 DANH SÁCH CÁC MÃ NƯƠNG TRONG TRẬN NÀY - CHUẨN BỊ KHỞI TRANH')
          .setColor(seconds > 10 ? '#FFA500' : '#FF0000') // Đổi màu đỏ khi sắp hết giờ
          .setDescription(`⏱️ **Thời gian đặt cược còn lại: ${seconds} giây!**\nNhanh tay dùng lệnh: \`!bet <số_thứ_tự> <tiền>\`\nCuộc đua sẽ **TỰ ĐỘNG** bắt đầu khi hết giờ.`)
          .addFields({ name: '🏇 Các ứng cử viên vô địch:', value: listText, inline: false })
          .setTimestamp();
    };

    // Gửi tin nhắn đầu tiên
    const countdownMessage = await message.reply({ embeds: [createEmbed(timeLeft)] });

    // 3. Tạo vòng lặp đếm ngược (update mỗi 5s để tránh rate limit của Discord)
    const interval = setInterval(async () => {
        timeLeft -= 5;
        
        if (timeLeft > 0) {
            try {
                // Sửa nội dung tin nhắn cũ để hiện thời gian mới
                await countdownMessage.edit({ embeds: [createEmbed(timeLeft)] });
            } catch (err) {
                console.error("Không thể edit tin nhắn countdown:", err);
            }
        } else {
            // HẾT GIỜ -> Dừng đếm ngược
            clearInterval(interval);
            
            try {
                // Thông báo hết giờ
                await countdownMessage.edit({ 
                    content: '🚫 **ĐÃ HẾT GIỜ ĐẶT CƯỢC!**', 
                    embeds: [createEmbed(0)] 
                });
                
                // Tắt trạng thái Prerace để lệnh Race có thể chạy
                raceManager.setPreraceStatus(false);

                // Tự động gọi lệnh Race
                await message.channel.send('🏁 **Hệ thống tự động bắt đầu cuộc đua!**');
                await raceCommand.execute(message, [], client);
                
            } catch (err) {
                console.error("Lỗi khi tự động bắt đầu đua:", err);
                message.channel.send('Có lỗi xảy ra khi tự động bắt đầu cuộc đua.');
                raceManager.setPreraceStatus(false); // Reset nếu lỗi
            }
        }
    }, 5000); // Chạy mỗi 5000ms = 5 giây
  },
};

