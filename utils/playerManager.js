const fs = require('fs');
const path = require('path');

const PLAYERS_FILE = path.join(__dirname, '../data/players.json');
const DEFAULT_BALANCE = 5000;
const DAILY_REWARD = 1000;
const DAILY_COOLDOWN = 24 * 60 * 60 * 1000; // 24 giờ tính bằng milliseconds

/**
 * Đọc dữ liệu người chơi từ file
 * @returns {Object} Dữ liệu người chơi
 */
function getPlayers() {
  try {
    // Kiểm tra xem file có tồn tại không
    if (!fs.existsSync(PLAYERS_FILE)) {
      // Nếu không tồn tại, tạo file mới với dữ liệu rỗng
      fs.writeFileSync(PLAYERS_FILE, '{}', 'utf8');
      return {};
    }
    
    // Đọc dữ liệu từ file
    const data = fs.readFileSync(PLAYERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Lỗi khi đọc dữ liệu người chơi:', error);
    return {};
  }
}

/**
 * Lưu dữ liệu người chơi vào file
 * @param {Object} players Dữ liệu người chơi
 */
function savePlayers(players) {
  try {
    fs.writeFileSync(PLAYERS_FILE, JSON.stringify(players, null, 2), 'utf8');
  } catch (error) {
    console.error('Lỗi khi lưu dữ liệu người chơi:', error);
  }
}

/**
 * Lấy thông tin người chơi, tạo mới nếu chưa tồn tại
 * @param {string} userId ID của người chơi
 * @returns {Object} Thông tin người chơi
 */
function getPlayer(userId) {
  const players = getPlayers();
  
  // Nếu người chơi chưa tồn tại, tạo mới
  if (!players[userId]) {
    players[userId] = {
      balance: DEFAULT_BALANCE,
      lastDaily: null
    };
    savePlayers(players);
  }
  
  return players[userId];
}

/**
 * Cập nhật số dư của người chơi
 * @param {string} userId ID của người chơi
 * @param {number} amount Số tiền thay đổi (dương là cộng, âm là trừ)
 * @returns {number} Số dư mới của người chơi
 */
function updateBalance(userId, amount) {
  const players = getPlayers();
  const player = getPlayer(userId);
  
  player.balance += amount;
  
  // Đảm bảo số dư không âm
  if (player.balance < 0) {
    player.balance = 0;
  }
  
  players[userId] = player;
  savePlayers(players);
  
  return player.balance;
}

/**
 * Kiểm tra xem người chơi có đủ số dư không
 * @param {string} userId ID của người chơi
 * @param {number} amount Số tiền cần kiểm tra
 * @returns {boolean} true nếu đủ số dư, false nếu không đủ
 */
function hasEnoughBalance(userId, amount) {
  const player = getPlayer(userId);
  return player.balance >= amount;
}

/**
 * Nhận phần thưởng hàng ngày
 * @param {string} userId ID của người chơi
 * @returns {Object} Kết quả nhận thưởng {success, message, balance}
 */
function claimDaily(userId) {
  const players = getPlayers();
  const player = getPlayer(userId);
  const now = Date.now();
  
  // Kiểm tra xem người chơi đã nhận thưởng trong 24h qua chưa
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
  
  players[userId] = player;
  savePlayers(players);
  
  return {
    success: true,
    message: `Bạn đã nhận ${DAILY_REWARD} coin hàng ngày!`,
    balance: player.balance
  };
}

/**
 * Lấy bảng xếp hạng người chơi theo số dư
 * @param {number} limit Số lượng người chơi muốn lấy
 * @returns {Array} Danh sách người chơi đã sắp xếp
 */
function getLeaderboard(limit = 10) {
  const players = getPlayers();
  
  // Chuyển đổi object thành mảng và sắp xếp theo số dư giảm dần
  const leaderboard = Object.entries(players)
    .map(([userId, data]) => ({
      userId,
      balance: data.balance
    }))
    .sort((a, b) => b.balance - a.balance)
    .slice(0, limit);
  
  return leaderboard;
}

module.exports = {
  getPlayer,
  updateBalance,
  hasEnoughBalance,
  claimDaily,
  getLeaderboard
};