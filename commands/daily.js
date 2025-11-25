const { EmbedBuilder } = require('discord.js');
const playerManager = require('../utils/playerManager');

module.exports = {
  name: 'daily',
  description: 'Nhận quà tặng hằng ngày',
  async execute(message, args, client) { // <-- QUAN TRỌNG: Thêm 'async'
    try {
        // Nhận quà hàng ngày
        // <-- QUAN TRỌNG: Thêm 'await'
        const result = await playerManager.claimDaily(message.author.id);
        
        // Tạo embed thông báo
        const embed = new EmbedBuilder()
          .setTitle('🎁 Quà hằng ngày')
          .setColor(result.success ? '#00FF00' : '#FF0000')
          .setDescription(result.message || 'Có lỗi xảy ra, không có nội dung thông báo.') // Fallback nếu message null
          .setTimestamp()
          .setFooter({ text: `${message.author.username}`, iconURL: message.author.displayAvatarURL() });
        
        // Thêm thông tin số dư
        embed.addFields({ name: 'Số dư hiện tại', value: `${result.balance} coin`, inline: true });
        
        return message.reply({ embeds: [embed] });
    } catch (error) {
        console.error(error);
        return message.reply('Có lỗi khi nhận quà hàng ngày.');
    }
  },
};
