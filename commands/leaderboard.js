// File: commands/leaderboard.js (CẬP NHẬT)

// ...
module.exports = {
  name: 'leaderboard',
  description: 'Xem bảng xếp hạng bú thẹt',
  async execute(message, args, client) {
    // Lấy bảng xếp hạng (top 10 người chơi)
    const leaderboard = await playerManager.getLeaderboard(10); // THÊM AWAIT
    
    // ... (phần còn lại giữ nguyên)
  },
};
const { EmbedBuilder } = require('discord.js');
const playerManager = require('../utils/playerManager');

module.exports = {
  name: 'leaderboard',
  description: 'Xem bảng xếp hạng bú thẹt',
  async execute(message, args, client) {
    // Lấy bảng xếp hạng (top 10 người chơi)
    const leaderboard = playerManager.getLeaderboard(10);
    
    // Kiểm tra xem có dữ liệu không
    if (leaderboard.length === 0) {
      return message.reply('Chưa có bet thủ nào trong bảng xếp hạng.');
    }
    
    // Tạo embed thông báo
    const embed = new EmbedBuilder()
      .setTitle('🏆 Bảng xếp hạng bú thẹt')
      .setColor('#0099ff')
      .setDescription('Top bet thủ có nhiều tiền nhất')
      .setTimestamp();
    
    // Thêm thông tin người chơi vào bảng xếp hạng
    let leaderboardText = '';
    
    // Lấy thông tin người dùng từ client cache
    for (let i = 0; i < leaderboard.length; i++) {
      const { userId, balance } = leaderboard[i];
      
      try {
        // Lấy thông tin người dùng từ client cache hoặc fetch nếu cần
        const user = await client.users.fetch(userId);
        const username = user ? user.username : 'Người chơi không xác định';
        
        // Thêm vào danh sách
        leaderboardText += `**${i + 1}.** ${username}: **${balance} coin**\n`;
      } catch (error) {
        console.error(`Không thể lấy thông tin người dùng ${userId}:`, error);
        leaderboardText += `**${i + 1}.** ID: ${userId}: **${balance} coin**\n`;
      }
    }
    
    embed.setDescription(leaderboardText);
    
    return message.reply({ embeds: [embed] });
  },

};
