const { EmbedBuilder } = require('discord.js');
const playerManager = require('../utils/playerManager');

module.exports = {
  name: 'balance',
  description: 'Xem số tiền hiện có',
  // 1. Thêm từ khóa async để chạy bất đồng bộ
  async execute(message, args, client) {
    try {
        // 2. Thêm await để chờ lấy dữ liệu từ MongoDB
        const player = await playerManager.getPlayer(message.author.id);
        
        // Tạo embed thông báo
        const embed = new EmbedBuilder()
          .setTitle('💰 Số dư tài khoản')
          .setColor('#FFD700')
          .setDescription(`Số dư hiện tại của bạn: **${player.balance} coin**`)
          .setTimestamp()
          .setFooter({ text: `${message.author.username}`, iconURL: message.author.displayAvatarURL() });
        
        return message.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Lỗi lệnh balance:', error);
        return message.reply('Có lỗi xảy ra khi kiểm tra số dư.');
    }
  },
};
