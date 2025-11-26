// File: commands/race.js

const { EmbedBuilder } = require('discord.js');
const raceManager = require('../utils/raceManager');
const betManager = require('../utils/betManager');

module.exports = {
  name: 'race',
  description: 'Bắt đầu cuộc đua ngựa',
  // Thêm tham số mặc định fromPrerace = false
  async execute(message, args, client, fromPrerace = false) {
    try {
        // 1. Logic kiểm tra Prerace
        // Nếu ĐANG prerace VÀ KHÔNG PHẢI do hệ thống gọi (tức là người dùng gõ !race) -> Chặn
        if (raceManager.isPreraceInProgress() && !fromPrerace) {
            return message.reply('⏳ **Đang đếm ngược!** Vui lòng đợi hết thời gian chờ, cuộc đua sẽ tự động bắt đầu.');
        }

        if (raceManager.isRaceInProgress()) {
          return message.reply('Cuộc đua đang diễn ra. Vui lòng đợi kết thúc!');
        }
        
        // Kiểm tra cược
        const bets = betManager.getAllBets();
        if (bets.size === 0) {
          // Nếu không có ai cược mà hệ thống tự chạy -> Phải reset lại trạng thái Prerace để cho phép tạo trận mới
          if (fromPrerace) raceManager.setPreraceStatus(false);
          return message.reply('Chưa có ai đặt cược. Cuộc đua bị hủy! Hãy dùng `!prerace` lại.');
        }
        
        if (Object.keys(raceManager.getCurrentNames()).length === 0) {
            raceManager.generateRaceNames();
        }
        
        // --- THAY ĐỔI QUAN TRỌNG ---
        // Bật trạng thái đua NGAY LẬP TỨC
        raceManager.setRaceStatus(true);
        
        // Sau khi đã bật trạng thái đua (Race=true), ta mới tắt trạng thái chờ (Prerace=false)
        // Điều này đảm bảo tại mọi thời điểm, ít nhất 1 trong 2 cờ là True -> Không ai có thể gọi lệnh !prerace
        if (fromPrerace) {
            raceManager.setPreraceStatus(false);
        }
        
        // ... (Phần code bên dưới giữ nguyên không đổi) ...
        const startEmbed = new EmbedBuilder()
          .setTitle('🏇 CUỘC ĐUA BẮT ĐẦU!')
          .setColor('#0099ff')
          .setDescription('Các tay đua kiệt xuất đã rời vạch xuất phát!')
          .setTimestamp();
        
        const raceMessage = await message.channel.send({ embeds: [startEmbed] });
        
        const trackLength = 15; 
        let positions = Array(raceManager.HORSE_COUNT).fill(0); 
        let raceFinished = false;
        
        while (!raceFinished) {
          const prevPositions = [...positions];
          const newPositions = raceManager.simulateRaceStep(positions, trackLength);
          for (let i = 0; i < positions.length; i++) {
            positions[i] = newPositions[i];
          }
          
          const statusMessage = raceManager.createRaceStatusMessage(positions, trackLength);
          await raceMessage.edit({ content: statusMessage, embeds: [] });
          
          const leadingMessage = raceManager.createLeadingHorseMessage(positions);
          await message.channel.send(leadingMessage);

          // Bình luận
          let maxMove = 0;
          let moverIndex = -1;
          for(let i=0; i < positions.length; i++) {
              const move = positions[i] - prevPositions[i];
              if (move > maxMove) { maxMove = move; moverIndex = i; }
          }
          const prevLeaderIndex = prevPositions.indexOf(Math.max(...prevPositions));
          const currLeaderIndex = positions.indexOf(Math.max(...positions));
          const leaderName = raceManager.getHorseName(currLeaderIndex + 1);

          let commentary = "";
          if (currLeaderIndex !== prevLeaderIndex) {
              commentary = `🔥 **ĐỘT BIẾN:** Chiến mã **${leaderName}** (Số ${currLeaderIndex + 1}) đã cướp lấy vị trí dẫn đầu!`;
          } else if (maxMove >= 3) {
              const moverName = raceManager.getHorseName(moverIndex + 1);
              commentary = `🚀 **TỐC ĐỘ:** **${moverName}** vừa có pha bứt tốc kinh hoàng!`;
          } else {
               const randomComments = [
                  "Các tay đua đang bám đuổi nhau sát nút!",
                  "Khán giả đang reo hò cuồng nhiệt!",
                  `Liệu **${leaderName}** có giữ được phong độ không?`
              ];
              if (Math.random() > 0.6) commentary = randomComments[Math.floor(Math.random() * randomComments.length)];
          }

          if (commentary) await message.channel.send(commentary);
          
          raceFinished = raceManager.isRaceFinished(positions, trackLength);
          if (!raceFinished) await new Promise(resolve => setTimeout(resolve, 3000)); 
        }
        
        // Xử lý kết quả
        const winnerNumbers = raceManager.getWinners(positions);
        const betResults = await betManager.processBetResults(winnerNumbers);
        
        const winnerNames = winnerNumbers.map(num => `**${raceManager.getHorseName(num)}** (Số ${num})`);
        const winnerText = winnerNames.length === 1 
          ? `🎉 QUÁN QUÂN: ${winnerNames[0]}!` 
          : `🎉 KẾT QUẢ HÒA: ${winnerNames.join(' và ')} cùng về đích!`;
        
        const resultEmbed = new EmbedBuilder()
          .setTitle('🏁 KẾT QUẢ CHUNG CUỘC')
          .setColor('#FFD700')
          .setDescription(winnerText)
          .setTimestamp();
        
        let winnerCount = 0;
        betResults.forEach(result => {
          if (result.won) {
            winnerCount++;
            resultEmbed.addFields({
              name: `🏆 Đại gia thắng cược`,
              value: `<@${result.userId}> húp trọn **${result.winAmount} coin**!`,
              inline: false
            });
          }
        });
        
        const allInLosers = betResults.filter(r => !r.won && r.isAllIn);
        if (allInLosers.length > 0) {
            const loserMentions = allInLosers.map(r => `<@${r.userId}>`).join(', ');
            resultEmbed.addFields({
                name: '💀 DANH SÁCH RA ĐÊ (Thua All-in)',
                value: `${loserMentions} đã trắng dé và phải ra đê ngủ với dế.\nXin chia buồn... hoặc không :).`,
                inline: false
            });
            resultEmbed.setColor('#FF0000'); 
        }

        if (winnerCount === 0) {
          resultEmbed.addFields({ name: 'Thua hết!', value: 'Không ai đoán đúng ngựa vô địch. Nhà cái húp trọn!', inline: false });
        }
        
        await message.channel.send({ embeds: [resultEmbed] });
        betManager.clearAllBets();
        
        // KẾT THÚC: Tắt trạng thái race
        raceManager.setRaceStatus(false);

    } catch (error) {
        console.error('Lỗi race:', error);
        // Reset hết nếu lỗi
        raceManager.setRaceStatus(false);
        if (fromPrerace) raceManager.setPreraceStatus(false);
        return message.reply('Có lỗi khi đua!');
    }
  },
};
