/**
 * Module quản lý cuộc đua ngựa
 */

// SỐ LƯỢNG NGỰA TĂNG LÊN 10 THEO YÊU CẦU
const HORSE_COUNT = 10;

// Trạng thái cuộc đua
let raceInProgress = false;

// Lưu trữ tên ngựa của trận hiện tại (Map: số thứ tự -> tên)
let currentRaceNames = {};

// Danh sách emoji
const HORSE_EMOJI = '🏇';
const FINISH_EMOJI = '🏁';

// Danh sách tên ngựa vui nhộn để random
const HORSE_NAMES_POOL = [
  "Special Week", "Silence Suzuka", "Tokai Teio", "Mejiro McQueen", "Gold Ship",
  "Vodka", "Daiwa Scarlet", "Oguri Cap", "Symboli Rudolf", "Rice Shower",
  "Grass Wonder", "El Condor Pasa", "Air Groove", "Mayaano Top Gun", "Mihono Bourbon",
  "Mejiro Ryan", "Hishi Amazon", "Fuji Kiseki", "Maruzensky", "Seiun Sky",
  "Biwa Hayahide", "Narita Taishin", "Winning Ticket", "Tamamo Cross", "Super Creek",
  "Inari One", "Haru Urara", "Twin Turbo", "Nice Nature", "Kitasan Black",
  "Satono Diamond", "Curren Chan", "Agnes Tachyon", "Manhattan Cafe", "King Halo",
  "Matikanetannhauser", "Machikane Fukukitaru", "Narita Brian", "T.M. Opera O", "Admire Vega", "Still in Love", "Meisho Doto",
];

/**
 * Kiểm tra xem cuộc đua có đang diễn ra không
 */
function isRaceInProgress() {
  return raceInProgress;
}

/**
 * Đặt trạng thái cuộc đua
 */
function setRaceStatus(status) {
  raceInProgress = status;
}

/**
 * Tạo danh sách tên ngẫu nhiên cho trận đấu mới
 * Được gọi khi dùng lệnh !prerace hoặc !race
 */
function generateRaceNames() {
  // Reset danh sách cũ
  currentRaceNames = {};
  
  // Copy mảng tên gốc để không bị trùng lặp khi lấy random
  let availableNames = [...HORSE_NAMES_POOL];
  
  for (let i = 1; i <= HORSE_COUNT; i++) {
    // Lấy ngẫu nhiên 1 index
    const randomIndex = Math.floor(Math.random() * availableNames.length);
    // Gán tên cho số thứ tự i
    currentRaceNames[i] = availableNames[randomIndex];
    // Xóa tên đã chọn khỏi danh sách tạm để không chọn lại
    availableNames.splice(randomIndex, 1);
  }
  return currentRaceNames;
}

/**
 * Lấy tên ngựa theo số thứ tự
 */
function getHorseName(number) {
  // Nếu chưa có tên (do chưa chạy prerace), thì tạo mới luôn
  if (Object.keys(currentRaceNames).length === 0) {
    generateRaceNames();
  }
  return currentRaceNames[number] || `Ngựa số ${number}`;
}

/**
 * Lấy toàn bộ danh sách ngựa hiện tại
 */
function getCurrentNames() {
  if (Object.keys(currentRaceNames).length === 0) {
    generateRaceNames();
  }
  return currentRaceNames;
}

/**
 * Tạo tin nhắn trạng thái đua
 */
function createRaceStatusMessage(positions, trackLength) {
  let message = '🏁 **Cuộc đua đang diễn ra!** 🏁\n\n';
  
  for (let i = 0; i < HORSE_COUNT; i++) {
    const position = positions[i];
    const horseNumber = i + 1;
    
    // Tạo đường đua
    let track = '';
    for (let j = 0; j < trackLength; j++) {
      if (j === position) {
        track += HORSE_EMOJI;
      } else {
        track += '▫️';
      }
    }
    
    // Hiển thị: Số ngựa - Tên (viết tắt) - Đường đua
    // Chỉ hiện số để đỡ rối mắt, tên sẽ hiện ở kết quả
    message += `**#${horseNumber}**: ${track} ${position >= trackLength - 1 ? FINISH_EMOJI : ''}\n`;
  }
  
  return message;
}

/**
 * Tạo tin nhắn trạng thái đua với ngựa dẫn đầu (Dùng Tên)
 */
function createLeadingHorseMessage(positions) {
  let maxPosition = -1;
  let leadingHorses = [];
  
  for (let i = 0; i < positions.length; i++) {
    if (positions[i] > maxPosition) {
      maxPosition = positions[i];
      leadingHorses = [i + 1];
    } else if (positions[i] === maxPosition) {
      leadingHorses.push(i + 1);
    }
  }
  
  // Lấy tên ngựa dẫn đầu
  const leadingNames = leadingHorses.map(num => `**${getHorseName(num)}** (#${num})`);
  
  if (leadingNames.length === 1) {
    return `${HORSE_EMOJI}💨 ${leadingNames[0]} đang dẫn đầu!`;
  } else {
    return `${HORSE_EMOJI}💨 ${leadingNames.join(' và ')} đang cùng dẫn đầu!`;
  }
}

function determineWinner() {
  return Math.floor(Math.random() * HORSE_COUNT) + 1;
}

function simulateRaceStep(positions, trackLength) {
  const newPositions = [...positions];
  for (let i = 0; i < HORSE_COUNT; i++) {
    if (newPositions[i] < trackLength - 1) {
      const moveChance = Math.random();
      if (moveChance < 0.6) newPositions[i] += 1;
      else if (moveChance < 0.9) newPositions[i] += 2;
      
      if (newPositions[i] >= trackLength - 1) {
        newPositions[i] = trackLength - 1;
      }
    }
  }
  return newPositions;
}

function isRaceFinished(positions, trackLength) {
  return positions.some(position => position >= trackLength - 1);
}

function getWinners(positions) {
  const maxPosition = Math.max(...positions);
  const winners = [];
  for (let i = 0; i < positions.length; i++) {
    if (positions[i] === maxPosition) {
      winners.push(i + 1);
    }
  }
  return winners;
}

module.exports = {
  HORSE_COUNT,
  isRaceInProgress,
  setRaceStatus,
  generateRaceNames,
  getHorseName,
  getCurrentNames,
  createRaceStatusMessage,
  createLeadingHorseMessage,
  determineWinner,
  simulateRaceStep,
  isRaceFinished,
  getWinners

};


