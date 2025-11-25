const { EmbedBuilder } = require('discord.js');
const raceManager = require('../utils/raceManager');
const betManager = require('../utils/betManager');

module.exports = {
  name: 'race',
  description: 'Bắt đầu cuộc đua ngựa',
  async execute(message, args, client) {
    try {
        if (raceManager.isRaceInProgress()) return message.reply('Đang đua rồi, từ từ thôi!');
        
        const bets = betManager.getAllBets();
        if (bets.size === 0) return message.reply('Chưa ai đặt cược cả!');
        
        if (Object.keys(raceManager.getCurrentNames()).length === 0) raceManager.generateRaceNames();
        
        raceManager.setRaceStatus(true);
        
        const startEmbed = new EmbedBuilder()
          .setTitle('🏇 CUỘC ĐUA BẮT ĐẦU!')
          .setColor('#0099ff')
          .setDescription('Các chiến mã đã xuất phát!')
          .setTimestamp();
        
        const raceMessage = await message.channel.send({ embeds: [startEmbed] });
        
        const trackLength = 18; 
        const positions = Array(raceManager.HORSE_COUNT).fill(0); 
        let raceFinished = false;
        
        while (!raceFinished) {
          const newPositions = raceManager.simulateRaceStep(positions, trackLength);
          for (let i = 0; i < positions.length; i++) positions[i] = newPositions[i];
          
          const statusMessage = raceManager.createRaceStatusMessage(positions, trackLength);
          await raceMessage.edit({ content: statusMessage, embeds: [] });
          const leadingMessage = raceManager.createLeadingHorseMessage(positions);
          await message.channel.send(leadingMessage);
          const leadingMessage = raceManager.createLeadingHorseMessage(positions);
          // await message.channel.send(leadingMessage); // Tắt dòng này nếu thấy spam quá
          
          raceFinished = raceManager.isRaceFinished(positions, trackLength);
          if (!raceFinished) await new Promise(resolve => setTimeout(resolve, 2500)); 
        }
        
        const winnerNumbers = raceManager.getWinners(positions);
        const betResults = await betManager.processBetResults(winnerNumbers);
        
        const winnerNames = winnerNumbers.map(num => `**${raceManager.getHorseName(num)}** (Số ${num})`);
        const winnerText = winnerNames.length === 1 
          ? `🎉 QUÁN QUÂN: ${winnerNames[0]}!` 
          : `🎉 KẾT QUẢ HÒA: ${winnerNames.join(' và ')}!`;
        
        const resultEmbed = new EmbedBuilder()
          .setTitle('🏁 KẾT QUẢ CHUNG CUỘC')
          .setColor('#FFD700')
          .setDescription(winnerText)
          .setTimestamp();
        
        let winnerCount = 0;
        
        // 1. Xử lý người thắng
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
        
        // 2. Xử lý người THUA ALL-IN (Tính năng mới)
        const allInLosers = betResults.filter(r => !r.won && r.isAllIn);
        if (allInLosers.length > 0) {
            const loserMentions = allInLosers.map(r => `<@${r.userId}>`).join(', ');
            resultEmbed.addFields({
                name: '💀 DANH SÁCH RA ĐÊ (Thua All-in)',
                value: `${loserMentions} đã trắng dé và phải ra đê ngủ với dế.\n*Xin chia buồn... hoặc không :)*`,
                inline: false
            });
            // Tô viền đỏ nếu có người chết all-in
            resultEmbed.setColor('#FF0000'); 
        }

        if (winnerCount === 0) {
          resultEmbed.addFields({ name: 'Thua hết!', value: 'Nhà cái húp trọn!', inline: false });
        }
        
        await message.channel.send({ embeds: [resultEmbed] });
        
        betManager.clearAllBets();
        raceManager.setRaceStatus(false);

    } catch (error) {
        console.error('Lỗi race:', error);
        raceManager.setRaceStatus(false);
        return message.reply('Có lỗi khi đua!');
    }
  },
};


