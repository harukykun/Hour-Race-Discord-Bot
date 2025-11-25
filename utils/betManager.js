const { Collection } = require('discord.js');
const playerManager = require('./playerManager');
const raceManager = require('./raceManager');

let bets = new Collection();

async function getBalance(userId) {
    const player = await playerManager.getPlayer(userId);
    return player ? player.balance : 0;
}

// 1. Thêm tham số isAllIn (mặc định là false)
async function placeBet(userId, horseNumber, amount, isAllIn = false) {
  if (raceManager.isRaceInProgress()) {
    return { success: false, message: 'Không thể đặt cược khi cuộc đua đang diễn ra!' };
  }
  
  if (bets.has(userId)) {
    const currentBet = bets.get(userId);
    return { success: false, message: `Bạn đã cược rồi (${currentBet.amount} coin). Chờ ván sau nhé!` };
  }
  
  if (horseNumber < 1 || horseNumber > raceManager.HORSE_COUNT) {
    return { success: false, message: `Số ngựa không hợp lệ (1-${raceManager.HORSE_COUNT}).` };
  }
  
  if (amount <= 0) {
    return { success: false, message: 'Tiền cược phải lớn hơn 0.' };
  }
  
  if (!await playerManager.hasEnoughBalance(userId, amount)) {
    const player = await playerManager.getPlayer(userId);
    return { success: false, message: `Không đủ tiền. Số dư: ${player.balance} coin.` };
  }
  
  // 2. Lưu trạng thái isAllIn vào Collection
  bets.set(userId, {
    horseNumber,
    amount,
    isAllIn // <-- Lưu tại đây
  });
  
  const newBalance = await playerManager.updateBalance(userId, -amount);
  
  return {
    success: true,
    message: `Đã cược ${amount} coin vào ngựa ${horseNumber}. Số dư: ${newBalance}.`,
    balance: newBalance
  };
}

function getBet(userId) { return bets.get(userId) || null; }
function getAllBets() { return bets; }
function clearAllBets() { bets = new Collection(); }

async function processBetResults(winners) {
  const results = [];
  
  for (const [userId, bet] of bets.entries()) {
    const { horseNumber, amount, isAllIn } = bet; // 3. Lấy thông tin isAllIn ra
    const isWinner = winners.includes(horseNumber);
    
    if (isWinner) {
      const winAmount = amount * 2;
      const newBalance = await playerManager.updateBalance(userId, winAmount);
      results.push({
        userId, won: true, horseNumber, betAmount: amount, 
        winAmount, newBalance, isAllIn // Trả về kết quả kèm cờ isAllIn
      });
    } else {
      const player = await playerManager.getPlayer(userId);
      results.push({
        userId, won: false, horseNumber, betAmount: amount, 
        winAmount: 0, newBalance: player.balance, isAllIn // Trả về kết quả kèm cờ isAllIn
      });
    }
  }
  return results;
}

module.exports = { placeBet, getBet, getAllBets, clearAllBets, processBetResults, getBalance };
