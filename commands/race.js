// File: commands/race.js

const { EmbedBuilder } = require('discord.js');
const raceManager = require('../utils/raceManager');
const betManager = require('../utils/betManager');

module.exports = {
  name: 'race',
  description: 'Bắt đầu cuộc đua ngựa',
  async execute(message, args, client, fromPrerace = false) {
    try {
        // --- 1. KIỂM TRA ĐIỀU KIỆN ---
        if (raceManager.isPreraceInProgress() && !fromPrerace) {
            return message.reply('⏳ **Đang đếm ngược!** Vui lòng đợi hết thời gian chờ.');
        }

        if (raceManager.isRaceInProgress()) {
          return message.reply('Cuộc đua đang diễn ra. Vui lòng đợi kết thúc!');
        }
        
        const bets = betManager.getAllBets();
        if (bets.size === 0) {
          if (fromPrerace) raceManager.setPreraceStatus(false);
          return message.reply('Chưa có ai đặt cược. Cuộc đua bị hủy! Hãy dùng `!prerace` lại.');
        }
        
        if (Object.keys(raceManager.getCurrentNames()).length === 0) {
            raceManager.generateRaceNames();
        }
        
        // --- 2. BẮT ĐẦU ĐUA ---
        raceManager.setRaceStatus(true);
        if (fromPrerace) raceManager.setPreraceStatus(false);
        
        const startEmbed = new EmbedBuilder()
          .setTitle('🏇 CUỘC ĐUA BẮT ĐẦU!')
          .setColor('#0099ff')
          .setDescription('Các tay đua kiệt xuất đã rời vạch xuất phát!')
          .setTimestamp();
        
        const raceMessage = await message.channel.send({ embeds: [startEmbed] });
        
        const trackLength = 15; 
        let positions = Array(raceManager.HORSE_COUNT).fill(0); 
        let raceFinished = false;
        
        // --- 3. VÒNG LẶP CHẠY ĐUA ---
        while (!raceFinished) {
          const prevPositions = [...positions];
          const newPositions = raceManager.simulateRaceStep(positions, trackLength);
          for (let i = 0; i < positions.length; i++) positions[i] = newPositions[i];
          
          const statusMessage = raceManager.createRaceStatusMessage(positions, trackLength);
          await raceMessage.edit({ content: statusMessage, embeds: [] });
          
          const leadingMessage = raceManager.createLeadingHorseMessage(positions);
          await message.channel.send(leadingMessage);

          // (Logic bình luận giữ nguyên) ...
          
          raceFinished = raceManager.isRaceFinished(positions, trackLength);
          if (!raceFinished) await new Promise(resolve => setTimeout(resolve, 3000)); 
        }
        
        // --- 4. XỬ LÝ KẾT QUẢ (PHẦN QUAN TRỌNG ĐÃ SỬA) ---
        // Lấy danh sách Top 1 và Top 2
        const { rank1, rank2 } = raceManager.getPodium(positions);
        
        // Tính tiền cược dựa trên Top 1 và Top 2
        const betResults = await betManager.processBetResults(rank1, rank2);
        
        // Tạo chuỗi hiển thị tên ngựa thắng
        const rank1Names = rank1.map(num => `**${raceManager.getHorseName(num)}** (#${num})`).join(', ');
        const rank2Names = rank2.length > 0 
            ? rank2.map(num => `**${raceManager.getHorseName(num)}** (#${num})`).join(', ')
            : "Không xác định";

        const resultEmbed = new EmbedBuilder()
          .setTitle('🏁 KẾT QUẢ CHUNG CUỘC')
          .setColor('#FFD700')
          .setDescription(`
          🥇 **HẠNG 1 (x3.6):** ${rank1Names}
          🥈 **HẠNG 2 (x2):** ${rank2Names}
          `)
          .setTimestamp();
        
        let winnerCount = 0;
        
        // Hiển thị người thắng
        // Gom nhóm kết quả để hiển thị cho gọn nếu 1 người thắng nhiều vé (Optional)
        betResults.forEach(result => {
          if (result.won) {
            winnerCount++;
            let typeText = result.rankType === 'top1' ? '🥇 Top 1' : '🥈 Top 2';
            let emoji = result.rankType === 'top1' ? '🤑' : '😋';
            
            resultEmbed.addFields({
              name: `${emoji} ${typeText} - Ngựa số ${result.horseNumber}`,
              value: `<@${result.userId}> cược ${result.betAmount} ➔ Húp **${result.winAmount} coin**!`,
              inline: false
            });
          }
        });
        
        // Hiển thị người thua All-in
        const allInLosers = betResults.filter(r => !r.won && r.isAllIn);
        if (allInLosers.length > 0) {
            // Lọc trùng ID nếu user đặt nhiều vé all-in (thực tế code chặn 1 lần allin nhưng cứ check cho chắc)
            const uniqueLosers = [...new Set(allInLosers.map(r => r.userId))];
            const loserMentions = uniqueLosers.map(id => `<@${id}>`).join(', ');
            
            resultEmbed.addFields({
                name: '💀 DANH SÁCH RA ĐÊ (Thua All-in)',
                value: `${loserMentions} đã trắng dé và phải ra đê ngủ với dế.`,
                inline: false
            });
        }

        if (winnerCount === 0) {
          resultEmbed.addFields({ name: 'Thua hết!', value: 'Không ai cược đúng. Nhà cái húp trọn!', inline: false });
        }
        
        await message.channel.send({ embeds: [resultEmbed] });
        betManager.clearAllBets();
        
        // Kết thúc
        raceManager.setRaceStatus(false);

    } catch (error) {
        console.error('Lỗi race:', error);
        raceManager.setRaceStatus(false);
        if (fromPrerace) raceManager.setPreraceStatus(false);
        return message.reply('Có lỗi khi đua!');
    }
  },
};

