const { EmbedBuilder } = require('discord.js');
const playerManager = require('../utils/playerManager');

module.exports = {
  name: 'balance',
  description: 'Xem số tiền hiện có',
  execute(message, args, client) {
    // Lấy thông tin người chơi
    const player = playerManager.getPlayer(message.author.id);
    
    // Tạo embed thông báo
    const embed = new EmbedBuilder()
      .setTitle('💰 Số dư tài khoản')
      .setColor('#FFD700')
      .setDescription(`Số dư hiện tại của bạn: **${player.balance} coin**`)
      .setTimestamp()
      .setFooter({ text: `${message.author.username}`, iconURL: message.author.displayAvatarURL() });
    
    return message.reply({ embeds: [embed] });
  },
};