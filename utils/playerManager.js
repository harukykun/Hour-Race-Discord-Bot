// File: utils/playerManager.js (CẬP NHẬT LOGIC 00:00)

const Player = require('../models/Player'); 

const DEFAULT_BALANCE = 1000;
const DAILY_REWARD = 1000000;

// KHÔNG CẦN DÙNG BIẾN 'DAILY_COOLDOWN' CỐ ĐỊNH NỮA

/**
 * Hàm hỗ trợ: Kiểm tra xem 2 thời điểm có cùng một ngày không
 * @param {Date} date1 
 * @param {Date} date2 
 * @returns {boolean}
 */
function isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
}

async function getPlayer(userId) {
    // (Giữ nguyên logic cũ)
    let player = await Player.findOneAndUpdate(
        { userId: userId },
        { 
            $setOnInsert: { 
                balance: DEFAULT_BALANCE, 
                lastDaily: null 
            }
        },
        { new: true, upsert: true }
    );
    return player;
}

// ... (Giữ nguyên updateBalance và hasEnoughBalance) ...
async function updateBalance(userId, amount) {
    const player = await getPlayer(userId); 
    const newBalance = Math.max(0, player.balance + amount);
    const updatedPlayer = await Player.findOneAndUpdate(
        { userId: userId },
        { balance: newBalance },
        { new: true }
    );
    return updatedPlayer.balance;
}

async function hasEnoughBalance(userId, amount) {
    const player = await Player.findOne({ userId: userId });
    if (!player) {
        const newPlayer = await getPlayer(userId);
        return newPlayer.balance >= amount;
    }
    return player.balance >= amount;
}

/**
 * Nhận phần thưởng hàng ngày (Reset vào 00:00)
 */
async function claimDaily(userId) {
    // Lấy thời gian hiện tại
    const now = new Date(); // Thời gian thực tế của server (hoặc máy chạy bot)
    
    // Lưu ý: Nếu muốn dùng giờ Việt Nam (GMT+7) thì cần xử lý thêm múi giờ.
    // Code dưới đây dùng giờ của hệ thống server.
    
    let player = await getPlayer(userId); 

    // Kiểm tra nếu đã nhận thưởng rồi
    if (player.lastDaily) {
        // Chuyển lastDaily từ DB ra object Date
        const lastDailyDate = new Date(player.lastDaily);

        // So sánh: Nếu "hôm nay" trùng với "ngày nhận cuối cùng" -> Chưa qua 12h đêm
        if (isSameDay(now, lastDailyDate)) {
            // Tính thời gian còn lại đến 00:00 ngày mai
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            
            const timeLeft = tomorrow - now;
            const hours = Math.floor((timeLeft / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((timeLeft / (1000 * 60)) % 60);
            const seconds = Math.floor((timeLeft / 1000) % 60);

            return {
                success: false,
                message: `Bạn đã điểm danh hôm nay rồi. Hãy quay lại sau ${hours}h ${minutes}m ${seconds}s nữa (qua 12h đêm)!`,
                balance: player.balance
            };
        }
    }
    
    // Nếu chưa nhận hôm nay (hoặc là lần đầu tiên)
    player.balance += DAILY_REWARD;
    player.lastDaily = now; // Lưu thời điểm nhận là BÂY GIỜ
    
    await player.save();
    
    return {
        success: true,
        message: `Điểm danh thành công ngày ${now.getDate()}/${now.getMonth() + 1}! Bạn nhận được ${DAILY_REWARD} coin.`,
        balance: player.balance
    };
}

// ... (Giữ nguyên getLeaderboard) ...
async function getLeaderboard(limit = 10) {
    const leaderboard = await Player.find({})
        .sort({ balance: -1 }) 
        .limit(limit)
        .select('userId balance') 
        .lean(); 
    return leaderboard;
}

module.exports = {
    getPlayer,
    updateBalance,
    hasEnoughBalance,
    claimDaily,
    getLeaderboard
};

