// File: utils/betManager.js

const { Collection } = require('discord.js');
const playerManager = require('./playerManager');
const raceManager = require('./raceManager');

// Map<userId, Array<{horseNumber, amount, isAllIn}>>
let bets = new Collection();

async function getBalance(userId) {
    const player = await playerManager.getPlayer(userId);
    return player ? player.balance : 0;
}

async function placeBet(userId, horseNumber, amount, isAllIn = false) {
  // ... (Giữ nguyên logic placeBet cũ của bạn) ...
  if (raceManager.isRaceInProgress()) return { success: false, message: 'Không thể đặt cược khi cuộc đua đang diễn ra!' };
  
  const userBets = bets.get(userId) || [];
  if (userBets.length >= 3) return { success: false, message: `Bạn chỉ được cược tối đa 3 mã ngựa!` };
  if (horseNumber < 1 || horseNumber > raceManager.HORSE_COUNT) return { success: false, message: `Số ngựa không hợp lệ.` };
  if (amount <= 0) return { success: false, message: 'Tiền cược phải lớn hơn 0.' };
  
  if (!await playerManager.hasEnoughBalance(userId, amount)) {
    const player = await playerManager.getPlayer(userId);
    return { success: false, message: `Không đủ tiền. Số dư: ${player.balance}.` };
  }
  
  const newBalance = await playerManager.updateBalance(userId, -amount);
  userBets.push({ horseNumber, amount, isAllIn });
  bets.set(userId, userBets);
  
  return {
    success: true,
    message: `Đã cược thêm **${amount} coin** vào ngựa **${horseNumber}**. (Vé ${userBets.length}/3)\nSố dư còn lại: ${newBalance}.`,
    balance: newBalance
  };
}

function getBet(userId) { return bets.get(userId) || null; }
function getAllBets() { return bets; }
function clearAllBets() { bets = new Collection(); }

// --- HÀM CẬP NHẬT: processBetResults ---
// Nhận vào danh sách Top 1 và Top 2
async function processBetResults(rank1Horses, rank2Horses) {
  const results = [];
  
  // Duyệt qua từng người chơi
  for (const [userId, userBets] of bets.entries()) {
    // Duyệt qua từng vé cược của người chơi đó
    for (const bet of userBets) {
        const { horseNumber, amount, isAllIn } = bet;
        
        let winAmount = 0;
        let won = false;
        let rankType = null; // 'top1' hoặc 'top2'

        // Check Top 1 (x2)
        if (rank1Horses.includes(horseNumber)) {
            won = true;
            winAmount = Math.floor(amount * 2);
            rankType = 'top1';
        } 
        // Check Top 2 (x1.5)
        else if (rank2Horses.includes(horseNumber)) {
            won = true;
            winAmount = Math.floor(amount * 1.5); // Làm tròn xuống
            rankType = 'top2';
        }

        if (won) {
          // Cộng tiền thắng
          const newBalance = await playerManager.updateBalance(userId, winAmount);
          results.push({
            userId, 
            won: true, 
            horseNumber, 
            betAmount: amount, 
            winAmount, 
            newBalance, 
            isAllIn,
            rankType // Lưu lại loại thắng để hiển thị
          });
        } else {
          // Thua
          const player = await playerManager.getPlayer(userId);
          results.push({
            userId, 
            won: false, 
            horseNumber, 
            betAmount: amount, 
            winAmount: 0, 
            newBalance: player.balance, 
            isAllIn,
            rankType: null
          });
        }
    }
  }
  return results;
}

module.exports = { placeBet, getBet, getAllBets, clearAllBets, processBetResults, getBalance };
