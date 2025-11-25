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
async function getBalance(userId) {
    const player = await playerManager.getPlayer(userId);
    return player ? player.balance : 0;
}

/**
 * Đặt cược vào một con ngựa
 * @param {string} userId ID của người chơi
 * @param {number} horseNumber Số ngựa (1-5)
 * @param {number} amount Số tiền cược
 * @returns {Promise<Object>} Kết quả đặt cược {success, message}
 */
async function placeBet(userId, horseNumber, amount) {
  // Kiểm tra xem cuộc đua có đang diễn ra không
  if (raceManager.isRaceInProgress()) {
    return {
      success: false,
      message: 'Không thể đặt cược khi cuộc đua đang diễn ra!'
    };
  }
  
  // Kiểm tra người chơi đã cược chưa (Tránh lỗi đặt đè làm mất tiền cược cũ)
  if (bets.has(userId)) {
    const currentBet = bets.get(userId);
    return {
        success: false,
        message: `Bạn đã đặt cược ${currentBet.amount} coin vào ngựa số ${currentBet.horseNumber} rồi. Vui lòng chờ vòng sau!`
    };
  }
  
  // Kiểm tra số ngựa hợp lệ
  if (horseNumber < 1 || horseNumber > raceManager.HORSE_COUNT) {
    return {
      success: false,
      message: `Số ngựa không hợp lệ. Vui lòng chọn từ 1 đến ${raceManager.HORSE_COUNT}.`
    };
  }
  
  // Kiểm tra số tiền cược hợp lệ
  if (amount <= 0) {
    return {
      success: false,
      message: 'Số tiền cược phải lớn hơn 0.'
    };
  }
  
  // Kiểm tra người chơi có đủ tiền không
  // LƯU Ý: hasEnoughBalance giờ là hàm async nên phải có await
  if (!await playerManager.hasEnoughBalance(userId, amount)) {
    const player = await playerManager.getPlayer(userId);
    return {
      success: false,
      message: `Bạn không đủ tiền để đặt cược. Số dư hiện tại: ${player.balance} coin.`
    };
  }
  
  // Lưu thông tin cược
  bets.set(userId, {
    horseNumber,
    amount
  });
  
  // Trừ tiền người chơi (updateBalance là async)
  const newBalance = await playerManager.updateBalance(userId, -amount);
  
  return {
    success: true,
    message: `Đã đặt cược ${amount} coin vào ngựa số ${horseNumber}. Số dư còn lại: ${newBalance} coin.`,
    balance: newBalance
  };
}

/**
 * Lấy thông tin cược của người chơi
 * @param {string} userId ID của người chơi
 * @returns {Object|null} Thông tin cược hoặc null nếu không có
 */
function getBet(userId) {
  return bets.get(userId) || null;
}

/**
 * Lấy tất cả thông tin cược
 * @returns {Collection} Collection chứa thông tin cược
 */
function getAllBets() {
  return bets;
}

/**
 * Xóa tất cả thông tin cược
 */
function clearAllBets() {
  bets = new Collection();
}

/**
 * Xử lý kết quả cược sau khi cuộc đua kết thúc
 * @param {Array} winners Danh sách số ngựa thắng cuộc
 * @returns {Promise<Array>} Danh sách kết quả cược của người chơi
 */
async function processBetResults(winners) {
  const results = [];
  
  // Xử lý từng người chơi đã đặt cược
  // Dùng for...of để có thể dùng await bên trong loop
  for (const [userId, bet] of bets.entries()) {
    const { horseNumber, amount } = bet;
    const isWinner = winners.includes(horseNumber);
    
    if (isWinner) {
      // Người chơi thắng, nhận gấp đôi số tiền cược
      const winAmount = amount * 2;
      // updateBalance là async
      const newBalance = await playerManager.updateBalance(userId, winAmount);
      
      results.push({
        userId,
        won: true,
        horseNumber,
        betAmount: amount,
        winAmount,
        newBalance
      });
    } else {
      // Người chơi thua, không nhận lại tiền
      const player = await playerManager.getPlayer(userId);
      
      results.push({
        userId,
        won: false,
        horseNumber,
        betAmount: amount,
        winAmount: 0,
        newBalance: player.balance
      });
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
