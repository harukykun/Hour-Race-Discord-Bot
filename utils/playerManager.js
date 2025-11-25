// File: utils/playerManager.js (ĐÃ VIẾT LẠI)

// Import Player Model mới
const Player = require('../models/Player'); 

// KHÔNG CẦN 'const fs = require('fs');' VÀ CÁC THAM SỐ ĐƯỜNG DẪN NỮA

const DEFAULT_BALANCE = 1000;
const DAILY_REWARD = 500;
const DAILY_COOLDOWN = 24 * 60 * 60 * 1000; // 24 giờ

/**
 * Lấy thông tin người chơi, tạo mới nếu chưa tồn tại.
 * @param {string} userId ID của người chơi
 * @returns {Promise<Object>} Thông tin người chơi (Mongoose Document)
 */
async function getPlayer(userId) {
    // Dùng findOneAndUpdate với upsert: true để tìm, nếu không có thì tạo mới
    let player = await Player.findOneAndUpdate(
        { userId: userId },
        { 
            $setOnInsert: { // Chỉ set các giá trị này khi document được tạo mới
                balance: DEFAULT_BALANCE, 
                lastDaily: null 
            }
        },
        { 
            new: true,       // Trả về document đã được cập nhật/tạo mới
            upsert: true     // Nếu không tìm thấy, tạo mới document
        }
    );
    return player;
}

/**
 * Cập nhật số dư của người chơi.
 * @param {string} userId ID của người chơi
 * @param {number} amount Số tiền thay đổi (dương là cộng, âm là trừ)
 * @returns {Promise<number>} Số dư mới của người chơi
 */
async function updateBalance(userId, amount) {
    // 1. Lấy thông tin người chơi (để đảm bảo người chơi tồn tại)
    const player = await getPlayer(userId); 
    
    // 2. Cập nhật số dư trong Database
    const newBalance = player.balance + amount;
    
    // Đảm bảo số dư không âm trước khi lưu
    const finalBalance = Math.max(0, newBalance);

    const updatedPlayer = await Player.findOneAndUpdate(
        { userId: userId },
        { balance: finalBalance },
        { new: true } // Trả về document mới
    );

    return updatedPlayer.balance;
}

/**
 * Kiểm tra xem người chơi có đủ số dư không.
 * @param {string} userId ID của người chơi
 * @param {number} amount Số tiền cần kiểm tra
 * @returns {Promise<boolean>} true nếu đủ số dư, false nếu không đủ
 */
async function hasEnoughBalance(userId, amount) {
    // Dùng findOne để đọc dữ liệu mới nhất
    const player = await Player.findOne({ userId: userId });
    
    if (!player) {
        // Nếu không có player, tạo player mới và kiểm tra (thường sẽ đủ)
        const newPlayer = await getPlayer(userId);
        return newPlayer.balance >= amount;
    }
    
    return player.balance >= amount;
}

/**
 * Nhận phần thưởng hàng ngày.
 * @param {string} userId ID của người chơi
 * @returns {Promise<Object>} Kết quả nhận thưởng {success, message, balance}
 */
async function claimDaily(userId) {
    const now = Date.now();
    
    let player = await getPlayer(userId); // Đảm bảo player tồn tại
    
    // Kiểm tra cooldown
    // Chuyển lastDaily (Date object) thành timestamp để so sánh
    if (player.lastDaily && now - player.lastDaily.getTime() < DAILY_COOLDOWN) { 
        const timeLeft = new Date(player.lastDaily.getTime() + DAILY_COOLDOWN - now);
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
    player.lastDaily = new Date(now);
    
    await player.save(); // Lưu thay đổi vào DB
    
    return {
        success: true,
        message: `Bạn đã nhận ${DAILY_REWARD} coin hàng ngày!`,
        balance: player.balance
    };
}

/**
 * Lấy bảng xếp hạng người chơi theo số dư.
 * @param {number} limit Số lượng người chơi muốn lấy
 * @returns {Promise<Array>} Danh sách người chơi đã sắp xếp
 */
async function getLeaderboard(limit = 10) {
    // Dùng Mongoose để tìm, sắp xếp và giới hạn
    const leaderboard = await Player.find({})
        .sort({ balance: -1 }) // Sắp xếp giảm dần theo balance
        .limit(limit)
        .select('userId balance') // Chỉ lấy 2 trường này
        .lean(); // Tối ưu: Chuyển sang Object JS thuần
        
    return leaderboard;
}

module.exports = {
    getPlayer,
    updateBalance,
    hasEnoughBalance,
    claimDaily,
    getLeaderboard
};
