const mongoose = require('mongoose');

// Định nghĩa cấu trúc data trong MongoDB
const PlayerSchema = new mongoose.Schema({
    // Discord User ID (ID người chơi)
    userId: { 
        type: String, 
        required: true, 
        unique: true // Đảm bảo mỗi user chỉ có 1 record
    },
    // Số dư tài khoản, mặc định 1000
    balance: { 
        type: Number, 
        default: 1000 
    },
    // Thời điểm nhận daily cuối cùng
    lastDaily: { 
        type: Date, 
        default: null 
    }
});

// Export Model để các file khác có thể dùng
module.exports = mongoose.model('Player', PlayerSchema);
