const { Collection } = require('discord.js');
const playerManager = require('./playerManager');
const raceManager = require('./raceManager');

// Thay đổi: bets lưu Array các vé cược thay vì object đơn
// Map<userId, Array<{horseNumber, amount, isAllIn}>>
let bets = new Collection();

async function getBalance(userId) {
    const player = await playerManager.getPlayer(userId);
    return player ? player.balance : 0;
}

// 1. Cập nhật hàm placeBet để xử lý nhiều vé cược
async function placeBet(userId, horseNumber, amount, isAllIn = false) {
  if (raceManager.isRaceInProgress()) {
    return { success: false, message: 'Không thể đặt cược khi cuộc đua đang diễn ra!' };
  }
  
  // Lấy danh sách các vé cược hiện tại của user (nếu chưa có thì tạo mảng mới)
  const userBets = bets.get(userId) || [];
  
  // KIỂM TRA: Giới hạn 3 vé cược
  if (userBets.length >= 3) {
    return { 
        success: false, 
        message: `Bạn chỉ được cược tối đa 3 mã ngựa! Bạn đã cược vào số: ${userBets.map(b => b.horseNumber).join(', ')}.` 
    };
  }
  
  if (horseNumber < 1 || horseNumber > raceManager.HORSE_COUNT) {
    return { success: false, message: `Số ngựa không hợp lệ (1-${raceManager.HORSE_COUNT}).` };
  }
  
  if (amount <= 0) {
    return { success: false, message: 'Tiền cược phải lớn hơn 0.' };
  }
  
  // Kiểm tra số dư
  if (!await playerManager.hasEnoughBalance(userId, amount)) {
    const player = await playerManager.getPlayer(userId);
    return { success: false, message: `Không có tiền mà cứ đòi cược lớn. ${player.balance} coin bọ :Đ.` };
  }
  
  // Trừ tiền ngay lập tức
  const newBalance = await playerManager.updateBalance(userId, -amount);
  
  // Lưu vé cược mới vào mảng
  userBets.push({
    horseNumber,
    amount,
    isAllIn
  });
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

// 2. Cập nhật hàm xử lý kết quả để duyệt qua từng vé cược
async function processBetResults(winners) {
  const results = [];
  
  // Duyệt qua từng người chơi
  for (const [userId, userBets] of bets.entries()) {
    // Duyệt qua từng vé cược của người chơi đó
    for (const bet of userBets) {
        const { horseNumber, amount, isAllIn } = bet;
        const isWinner = winners.includes(horseNumber);
        
        if (isWinner) {
          const winAmount = amount * 2;
          // Cộng tiền thắng
          const newBalance = await playerManager.updateBalance(userId, winAmount);
          
          results.push({
            userId, 
            won: true, 
            horseNumber, 
            betAmount: amount, 
            winAmount, 
            newBalance, 
            isAllIn
          });
        } else {
          // Thua thì không làm gì (tiền đã trừ lúc bet)
          const player = await playerManager.getPlayer(userId);
          results.push({
            userId, 
            won: false, 
            horseNumber, 
            betAmount: amount, 
            winAmount: 0, 
            newBalance: player.balance, 
            isAllIn
          });
        }
    }
  }
  return results;
}

// ... (Keep the code above unchanged)

// 2. Updated function to process bets for Rank 1 and Rank 2
async function processBetResults(rank1Horses, rank2Horses) {
  const results = [];
  
  // Iterate through each user
  for (const [userId, userBets] of bets.entries()) {
    // Iterate through each bet ticket of the user
    for (const bet of userBets) {
        const { horseNumber, amount, isAllIn } = bet;
        
        let winAmount = 0;
        let won = false;
        let rankType = null; // 'top1' or 'top2'

        // Check Top 1 (x2 Payout)
        if (rank1Horses.includes(horseNumber)) {
            won = true;
            winAmount = Math.floor(amount * 2);
            rankType = 'top1';
        } 
        // Check Top 2 (x1.5 Payout)
        else if (rank2Horses.includes(horseNumber)) {
            won = true;
            winAmount = Math.floor(amount * 1.5); // Floor to avoid decimals
            rankType = 'top2';
        }

        if (won) {
          // Add winning amount
          const newBalance = await playerManager.updateBalance(userId, winAmount);
          results.push({
            userId, 
            won: true, 
            horseNumber, 
            betAmount: amount, 
            winAmount, 
            newBalance, 
            isAllIn,
            rankType // Save rank type for display
          });
        } else {
          // Lost
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


