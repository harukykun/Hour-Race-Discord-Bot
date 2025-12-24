const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../data/players.json');
const DEFAULT_BALANCE = 10000000;
const DAILY_REWARD = 1000000;

function readData() {
    try {
        if (!fs.existsSync(DATA_PATH)) {
            const initialData = {};
            fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
            fs.writeFileSync(DATA_PATH, JSON.stringify(initialData));
            return initialData;
        }
        const data = fs.readFileSync(DATA_PATH, 'utf8');
        return data ? JSON.parse(data) : {};
    } catch (error) {
        return {};
    }
}

function writeData(data) {
    try {
        fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Loi khi ghi file JSON:", error);
    }
}

function isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
}

async function getPlayer(userId) {
    const data = readData();
    if (!data[userId]) {
        data[userId] = {
            userId: userId,
            balance: DEFAULT_BALANCE,
            lastDaily: null
        };
        writeData(data);
    }
    return data[userId];
}

async function updateBalance(userId, amount) {
    const data = readData();
    if (!data[userId]) {
        data[userId] = { 
            userId: userId, 
            balance: DEFAULT_BALANCE, 
            lastDaily: null 
        };
    }
    data[userId].balance = Math.max(0, data[userId].balance + amount);
    writeData(data);
    return data[userId].balance;
}

async function hasEnoughBalance(userId, amount) {
    const player = await getPlayer(userId);
    return player.balance >= amount;
}

async function claimDaily(userId) {
    const now = new Date();
    const data = readData();
    
    if (!data[userId]) {
        data[userId] = { 
            userId: userId, 
            balance: DEFAULT_BALANCE, 
            lastDaily: null 
        };
    }

    const player = data[userId];

    if (player.lastDaily) {
        const lastDailyDate = new Date(player.lastDaily);
        if (isSameDay(now, lastDailyDate)) {
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            
            const timeLeft = tomorrow - now;
            const hours = Math.floor((timeLeft / 3600000) % 24);
            const minutes = Math.floor((timeLeft / 60000) % 60);
            const seconds = Math.floor((timeLeft / 1000) % 60);

            return {
                success: false,
                message: "ạn đã điểm danh hôm nay rồi. Quay lại sau " + hours + "h " + minutes + "m " + seconds + "s",
                balance: player.balance
            };
        }
    }
    
    player.balance += DAILY_REWARD;
    player.lastDaily = now.toISOString();
    writeData(data);
    
    return {
        success: true,
        message: "Điểm danh thành công ngày " + now.getDate() + "/" + (now.getMonth() + 1),
        balance: player.balance
    };
}

async function getLeaderboard(limit = 10) {
    const data = readData();
    return Object.values(data)
        .sort((a, b) => b.balance - a.balance)
        .slice(0, limit);
}

module.exports = {
    getPlayer,
    updateBalance,
    hasEnoughBalance,
    claimDaily,
    getLeaderboard
};