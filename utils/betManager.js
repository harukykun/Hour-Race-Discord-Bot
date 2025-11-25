// File: utils/betManager.js (CẬP NHẬT)

const { Collection } = require('discord.js');
const playerManager = require('./playerManager');
const raceManager = require('./raceManager');

// Collection lưu trữ thông tin cược
let bets = new Collection();

/**
 * Lấy số dư hiện tại của người chơi (Hỗ trợ tính năng All-in)
 * @param {string} userId ID của người chơi
 * @returns {Promise<number>} Số dư hiện tại
 */
async function getBalance(userId) { // THÊM ASYNC
    const player = await playerManager.getPlayer(userId); // THÊM AWAIT
    return player ? player.balance : 0;
}

/**
 * Đặt cược vào một con ngựa
 * ... (các tham số và mô tả)
 */
async function placeBet(userId, horseNumber, amount) { // THÊM ASYNC
  // ... (phần kiểm tra cuộc đua và kiểm tra cược cũ giữ nguyên)
  
  // Kiểm tra người chơi có đủ tiền không
  if (!await playerManager.hasEnoughBalance(userId, amount)) { // THÊM AWAIT
    const player = await playerManager.getPlayer(userId); // THÊM AWAIT
    return {
      success: false,
      message: `Bạn không đủ tiền để đặt cược. Số dư hiện tại: ${player.balance} coin.`
    };
  }
  
  // Lưu thông tin cược (giữ nguyên vì dùng Collection)
  bets.set(userId, {
    horseNumber,
    amount
  });
  
  // Trừ tiền người chơi
  const newBalance = await playerManager.updateBalance(userId, -amount); // THÊM AWAIT
  
  // ... (phần trả về kết quả giữ nguyên)
}

/**
 * Xử lý kết quả cược sau khi cuộc đua kết thúc
 * ... (các tham số và mô tả)
 */
async function processBetResults(winners) { // THÊM ASYNC
  const results = [];
  
  // Xử lý từng người chơi đã đặt cược
  // Dùng for...of để có thể dùng await bên trong loop
  for (const [userId, bet] of bets.entries()) { 
    const { horseNumber, amount } = bet;
    const isWinner = winners.includes(horseNumber);
    
    if (isWinner) {
      // Người chơi thắng, nhận gấp đôi số tiền cược
      const winAmount = amount * 2;
      const newBalance = await playerManager.updateBalance(userId, winAmount); // THÊM AWAIT
      
      // ... (phần push kết quả giữ nguyên)
    } else {
      // Người chơi thua, không nhận lại tiền
      const player = await playerManager.getPlayer(userId); // THÊM AWAIT
      
      // ... (phần push kết quả giữ nguyên)
    }
  }
  
  return results;
}

module.exports = {
  placeBet,
  getBet,
  getAllBets,
  clearAllBets,
  processBetResults,
  getBalance
};
