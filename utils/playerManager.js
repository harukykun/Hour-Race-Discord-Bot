// utils/playerManager.js

const Player = require('../models/Player'); // Import Schema Player

// Bỏ các import fs, path và logic liên quan đến file

const DEFAULT_BALANCE = 1000; 
const DAILY_REWARD = 500;
const DAILY_COOLDOWN = 24 * 60 * 60 * 1000; // 24 giờ

// Lưu ý: Tất cả các hàm bên dưới đều là ASYNC (bất đồng bộ)

/**
 * Lấy thông tin người chơi, tạo mới nếu chưa tồn tại
 * @param {string} userId ID của người chơi
 * @returns {Promise<Object>} Thông tin người chơi (Mongoose Document)
 */
async function getPlayer(userId) {
  // findOneAndUpdate với upsert: true sẽ tìm kiếm, nếu không có sẽ tạo mới
  const player = await Player.findOneAndUpdate(
    { userId: userId },
    { 
        $setOnInsert: { 
            balance: DEFAULT_BALANCE, 
            lastDaily: null 
        } 
    },
    { 
        new: true, // Trả về document đã được cập nhật/tạo mới
        upsert: true, // Nếu không tìm thấy, tạo mới (insert)
        setDefaultsOnInsert: true // Đảm bảo các default value được set khi upsert
    }
  );

  return player;
}

/**
 * Cập nhật số dư của người chơi
 * @param {string} userId ID của người chơi
 * @param {number} amount Số tiền thay đổi (dương là cộng, âm là trừ)
 * @returns {Promise<number>} Số dư mới của người chơi
 */
async function updateBalance(userId, amount) {
  // 1. Tìm người chơi
  let player = await getPlayer(userId);

  // 2. Tính số dư mới
  let newBalance = player.balance + amount;
  
  // Đảm bảo số dư không âm
  if (newBalance < 0) {
    newBalance = 0;
  }
  
  // 3. Cập nhật vào Database và trả về kết quả
  const updatedPlayer = await Player.findOneAndUpdate(
    { userId: userId },
    { $set: { balance: newBalance } },
    { new: true } // Trả về document đã cập nhật
  );

  return updatedPlayer.balance;
}

/**
 * Kiểm tra xem người chơi có đủ số dư không
 * @param {string} userId ID của người chơi
 * @param {number} amount Số tiền cần kiểm tra
 * @returns {Promise<boolean>} true nếu đủ số dư, false nếu không đủ
 */
async function hasEnoughBalance(userId, amount) {
  const player = await getPlayer(userId); 

  return player.balance >= amount;
}

/**
 * Nhận phần thưởng hàng ngày
 * @param {string} userId ID của người chơi
 * @returns {Promise<Object>} Kết quả nhận thưởng {success, message, balance}
 */
async function claimDaily(userId) {
  let player = await getPlayer(userId); 
  
  const now = Date.now();
  
  // Kiểm tra cooldown
  if (player.lastDaily && now - player.lastDaily < DAILY_COOLDOWN) {
    const timeLeft = new Date(player.lastDaily + DAILY_COOLDOWN - now);
    const hours = timeLeft.getUTCHours();
    const minutes = timeLeft.getUTCMinutes();
    const seconds = timeLeft.getUTCSeconds();
    
    return {
      success: false,
      message: `Bạn đã nhận thưởng hôm nay rồi. Vui lòng đợi ${hours}h ${minutes}m ${seconds}s nữa.`,
      balance: player.balance
    };
  }
  
  // Cập nhật số dư và thời gian nhận thưởng
  player.balance += DAILY_REWARD;
  player.lastDaily = now;
  
  // Lưu thay đổi vào DB
  await player.save();
  
  return {
    success: true,
    message: `Bạn đã nhận ${DAILY_REWARD} coin hàng ngày!`,
    balance: player.balance
  };
}

/**
 * Lấy bảng xếp hạng người chơi theo số dư
 * @param {number} limit Số lượng người chơi muốn lấy
 * @returns {Promise<Array>} Danh sách người chơi đã sắp xếp
 */
async function getLeaderboard(limit = 10) {
  // Dùng Mongoose find, sort, và limit
  const leaderboard = await Player.find({})
    .sort({ balance: -1 }) // -1 là sắp xếp giảm dần
    .limit(limit)
    .select('userId balance') // Chỉ lấy 2 trường này
    .lean(); // Chuyển sang plain JavaScript objects để dễ sử dụng

  return leaderboard;
}

module.exports = {
  getPlayer,
  updateBalance,
  hasEnoughBalance,
  claimDaily,
  getLeaderboard,
  // Xuất PlayerModel để các file khác có thể truy cập nếu cần
  PlayerModel: Player
};
