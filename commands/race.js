const { EmbedBuilder } = require('discord.js');
const raceManager = require('../utils/raceManager');
const betManager = require('../utils/betManager');

module.exports = {
  name: 'race',
  description: 'Bắt đầu cuộc đua ngựa',
  async execute(message, args, client) {
    // Kiểm tra xem cuộc đua có đang diễn ra không
    if (raceManager.isRaceInProgress()) {
      return message.reply('Cuộc đua đang diễn ra. Vui lòng đợi kết thúc!');
    }
    
    // Kiểm tra xem có người đặt cược không
    const bets = betManager.getAllBets();
    if (bets.size === 0) {
      return message.reply('Chưa có ai đặt cược. Hãy dùng `!prerace` để xem ngựa và `!bet` để đặt cược!');
    }
    
    // Đảm bảo tên ngựa đã được tạo (phòng trường hợp user quên bấm !prerace)
    if (Object.keys(raceManager.getCurrentNames()).length === 0) {
        raceManager.generateRaceNames();
    }
    
    // Đặt trạng thái đua là đang diễn ra
    raceManager.setRaceStatus(true);
    
    // Thông báo bắt đầu cuộc đua
    const startEmbed = new EmbedBuilder()
      .setTitle('🏇 CUỘC ĐUA BẮT ĐẦU!')
      .setColor('#0099ff')
      .setDescription('Các tay đua kiệt xuất đã rời vạch xuất phát!')
      .setTimestamp();
    
    const raceMessage = await message.channel.send({ embeds: [startEmbed] });
    
    // Thiết lập thông số cuộc đua
    const trackLength = 20; // Tăng độ dài đường đua một chút vì nhiều ngựa
    const positions = Array(raceManager.HORSE_COUNT).fill(0); 
    let raceFinished = false;
    
    // Mô phỏng cuộc đua
    while (!raceFinished) {
      // Mô phỏng bước đua
      const newPositions = raceManager.simulateRaceStep(positions, trackLength);
      for (let i = 0; i < positions.length; i++) {
        positions[i] = newPositions[i];
      }
      
      // Tạo tin nhắn trạng thái
      const statusMessage = raceManager.createRaceStatusMessage(positions, trackLength);
      
      // Cập nhật tin nhắn
      await raceMessage.edit({ content: statusMessage, embeds: [] });
      
      // Thông báo ngựa dẫn đầu (Dùng tên)
      const leadingMessage = raceManager.createLeadingHorseMessage(positions);
      await message.channel.send(leadingMessage);
      
      // Kiểm tra kết thúc
      raceFinished = raceManager.isRaceFinished(positions, trackLength);
      
      // Đợi 2.5 giây (tăng lên xíu để người xem kịp nhìn vì 10 con ngựa)
      if (!raceFinished) {
        await new Promise(resolve => setTimeout(resolve, 2500)); 
      }
    }
    
    // Xác định ngựa thắng
    const winnerNumbers = raceManager.getWinners(positions);
    
    // Xử lý kết quả cược
    const betResults = betManager.processBetResults(winnerNumbers);
    
    // Chuyển đổi số ngựa thắng thành tên ngựa để hiển thị
    const winnerNames = winnerNumbers.map(num => `**${raceManager.getHorseName(num)}** (Số ${num})`);
    
    const winnerText = winnerNames.length === 1 
      ? `🎉 QUÁN QUÂN: ${winnerNames[0]}!` 
      : `🎉 KẾT QUẢ HÒA: ${winnerNames.join(' và ')} cùng về đích!`;
    
    const resultEmbed = new EmbedBuilder()
      .setTitle('🏁 KẾT QUẢ CHUNG CUỘC')
      .setColor('#FFD700')
      .setDescription(winnerText)
      .setTimestamp();
    
    // Thêm thông tin người thắng cược
    let winnerCount = 0;
    betResults.forEach(result => {
      if (result.won) {
        winnerCount++;
        resultEmbed.addFields({
          name: `Người chơi thắng cuộc`,
          value: `<@${result.userId}> đặt ${raceManager.getHorseName(result.horseNumber)} \n-> Thắng ${result.winAmount} coin!`,
          inline: false
        });
      }
    });
    
    if (winnerCount === 0) {
      resultEmbed.addFields({
        name: 'Thua trắng!',
        value: 'Không ai đoán đúng ngựa vô địch. Chúc may mắn lần sau!',
        inline: false
      });
    }
    
    // Gửi thông báo kết quả
    await message.channel.send({ embeds: [resultEmbed] });
    
    // Xóa cược và reset trạng thái
    betManager.clearAllBets();
    raceManager.setRaceStatus(false);
  },

};
