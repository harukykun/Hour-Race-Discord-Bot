// File: commands/daily.js (CẬP NHẬT)

// ...
module.exports = {
  name: 'daily',
  description: 'Nhận quà tặng hằng ngày',
  async execute(message, args, client) { // THÊM ASYNC
    // Nhận quà hàng ngày
    const result = await playerManager.claimDaily(message.author.id); // THÊM AWAIT
    
    // ... (phần tạo embed giữ nguyên)
  },
};
const { EmbedBuilder } = require('discord.js');
const playerManager = require('../utils/playerManager');

module.exports = {
  name: 'daily',
  description: 'Nhận quà tặng hằng ngày',
  execute(message, args, client) {
    // Nhận quà hàng ngày
    const result = playerManager.claimDaily(message.author.id);
    
    // Tạo embed thông báo
    const embed = new EmbedBuilder()
      .setTitle('🎁 Quà hằng ngày')
      .setColor(result.success ? '#00FF00' : '#FF0000')
      .setDescription(result.message)
      .setTimestamp()
      .setFooter({ text: `${message.author.username}`, iconURL: message.author.displayAvatarURL() });
    
    // Thêm thông tin số dư
    embed.addFields({ name: 'Số dư hiện tại', value: `${result.balance} coin`, inline: true });
    
    return message.reply({ embeds: [embed] });
  },

};
