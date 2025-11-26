// File: commands/prerace.js

const { EmbedBuilder } = require('discord.js');
const raceManager = require('../utils/raceManager');
// const betManager = require('../utils/betManager'); // Có thể bỏ nếu không dùng trực tiếp
const raceCommand = require('./race'); 

module.exports = {
  name: 'prerace',
  description: 'Chuẩn bị danh sách ngựa và đếm ngược bắt đầu',
  async execute(message, args, client) {
    // 1. Kiểm tra chặt chẽ điều kiện
    if (raceManager.isRaceInProgress()) {
      return message.reply('❌ Cuộc đua đang diễn ra, không thể tạo trận mới!');
    }
    if (raceManager.isPreraceInProgress()) {
        return message.reply('⏳ Đang trong thời gian chờ đặt cược rồi! Hãy nhanh tay đặt cược.');
    }

    // 2. Bật trạng thái Prerace
    raceManager.setPreraceStatus(true);

    const horses = raceManager.generateRaceNames();

    let listText = '';
    for (let i = 1; i <= raceManager.HORSE_COUNT; i++) {
      listText += `**#${i}**: ${horses[i]}\n`;
    }

    let timeLeft = 60; // 60 giây đếm ngược

    const createEmbed = (seconds) => {
        return new EmbedBuilder()
          .setTitle('📋 DANH SÁCH CÁC MÃ NƯƠNG TRONG TRẬN NÀY - CHUẨN BỊ KHỞI TRANH')
          .setColor(seconds > 10 ? '#FFA500' : '#FF0000') 
          .setDescription(`⏱️ **Thời gian đặt cược còn lại: ${seconds} giây!**\nNhanh tay dùng lệnh: \`!bet <số_thứ_tự> <tiền>\`\nCuộc đua sẽ **TỰ ĐỘNG** bắt đầu khi hết giờ.`)
          .addFields({ name: '🏇 Các ứng cử viên vô địch:', value: listText, inline: false })
          .setTimestamp();
    };

    const countdownMessage = await message.reply({ embeds: [createEmbed(timeLeft)] });

    const interval = setInterval(async () => {
        timeLeft -= 5;
        
        if (timeLeft > 0) {
            try {
                await countdownMessage.edit({ embeds: [createEmbed(timeLeft)] });
            } catch (err) {
                console.error("Không thể edit tin nhắn countdown:", err);
            }
        } else {
            // HẾT GIỜ
            clearInterval(interval);
            
            try {
                await countdownMessage.edit({ 
                    content: '🚫 **ĐÃ HẾT GIỜ ĐẶT CƯỢC!**', 
                    embeds: [createEmbed(0)] 
                });
                
                // --- THAY ĐỔI QUAN TRỌNG Ở ĐÂY ---
                // KHÔNG gọi raceManager.setPreraceStatus(false) ở đây.
                // Chúng ta giữ nó là TRUE để chặn mọi người dùng khác.
                
                await message.channel.send('🏁 **Hệ thống tự động bắt đầu cuộc đua!**');
                
                // Gọi lệnh Race và truyền thêm tham số true (isSystemCall)
                await raceCommand.execute(message, [], client, true);
                
            } catch (err) {
                console.error("Lỗi khi tự động bắt đầu đua:", err);
                message.channel.send('Có lỗi xảy ra khi tự động bắt đầu cuộc đua.');
                // Nếu lỗi sập luôn thì mới reset
                raceManager.setPreraceStatus(false); 
            }
        }
    }, 5000); 
  },
};
