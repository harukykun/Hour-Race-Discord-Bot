// File: utils/raceManager.js

const HORSE_COUNT = 10;
let raceInProgress = false;
let preraceInProgress = false; // [Thêm] Trạng thái đang đếm ngược
let currentRaceNames = {};
const HORSE_EMOJI = '🏇';
const FINISH_EMOJI = '🏁';

const HORSE_NAMES_POOL = [
  "Special Week", "Silence Suzuka", "Tokai Teio", "Mejiro McQueen", "Gold Ship",
  "Vodka", "Daiwa Scarlet", "Oguri Cap", "Symboli Rudolf", "Rice Shower",
  "Grass Wonder", "El Condor Pasa", "Air Groove", "Mayano Top Gun", "Mihono Bourbon",
  "Mejiro Ryan", "Hishi Amazon", "Fuji Kiseki", "Maruzensky", "Seiun Sky",
  "Biwa Hayahide", "Narita Taishin", "Winning Ticket", "Tamamo Cross", "Super Creek",
  "Inari One", "Haru Urara", "Twin Turbo", "Nice Nature", "Kitasan Black",
  "Satono Diamond", "Curren Chan", "Agnes Tachyon", "Manhattan Cafe", "King Halo",
  "Matikanetannhauser", "Machikane Fukukitaru", "Narita Brian", "T.M. Opera O", "Admire Vega", "Still in Love", "Meisho Doto",
];

function isRaceInProgress() { return raceInProgress; }
function setRaceStatus(status) { raceInProgress = status; }

// --- [Thêm] Getter/Setter cho trạng thái Prerace ---
function isPreraceInProgress() { return preraceInProgress; }
function setPreraceStatus(status) { preraceInProgress = status; }
// --------------------------------------------------

function generateRaceNames() {
  currentRaceNames = {};
  let availableNames = [...HORSE_NAMES_POOL];
  for (let i = 1; i <= HORSE_COUNT; i++) {
    const randomIndex = Math.floor(Math.random() * availableNames.length);
    currentRaceNames[i] = availableNames[randomIndex];
    availableNames.splice(randomIndex, 1);
  }
  return currentRaceNames;
}

function getHorseName(number) {
  if (Object.keys(currentRaceNames).length === 0) {
    generateRaceNames();
  }
  return currentRaceNames[number] || `Ngựa số ${number}`;
}

function getCurrentNames() {
  if (Object.keys(currentRaceNames).length === 0) {
    generateRaceNames();
  }
  return currentRaceNames;
}

function createRaceStatusMessage(positions, trackLength) {
  let message = '🏁 **Cuộc đua đang diễn ra!** 🏁\n\n';
  for (let i = 0; i < HORSE_COUNT; i++) {
    const position = positions[i];
    const horseNumber = i + 1;
    let track = '';
    for (let j = 0; j < trackLength; j++) {
      if (j === position) {
        track += HORSE_EMOJI;
      } else {
        track += '▫️';
      }
    }
    message += `**#${horseNumber}**: ${track} ${position >= trackLength - 1 ? FINISH_EMOJI : ''}\n`;
  }
  return message;
}

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
  const leadingNames = leadingHorses.map(num => `**${getHorseName(num)}** (#${num})`);
  if (leadingNames.length === 1) {
    return `${HORSE_EMOJI}💨 ${leadingNames[0]} đang dẫn đầu!`;
  } else {
    return `${HORSE_EMOJI}💨 ${leadingNames.join(' và ')} đang cùng dẫn đầu!`;
  }
}

function determineWinner() { return Math.floor(Math.random() * HORSE_COUNT) + 1; }

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

// Replace the old getWinners function with this one
function getPodium(positions) {
  // Create a list of objects { horse_id, position }
  const horses = positions.map((pos, index) => ({ id: index + 1, pos }));
  
  // Sort descending by position (furthest distance first)
  horses.sort((a, b) => b.pos - a.pos);

  // Identify Rank 1 (The furthest position)
  const maxPos = horses[0].pos;
  const rank1 = horses.filter(h => h.pos === maxPos).map(h => h.id);

  // Identify Rank 2: Filter out Rank 1 horses, find the best remaining position
  let rank2 = [];
  const remaining = horses.filter(h => h.pos < maxPos);
  
  if (remaining.length > 0) {
    const secondMaxPos = remaining[0].pos;
    rank2 = remaining.filter(h => h.pos === secondMaxPos).map(h => h.id);
  }

  return { rank1, rank2 };
}

module.exports = {
  HORSE_COUNT,
  isRaceInProgress,
  setRaceStatus,
  isPreraceInProgress,
  setPreraceStatus,
  generateRaceNames,
  getHorseName,
  getCurrentNames,
  createRaceStatusMessage,
  createLeadingHorseMessage,
  determineWinner,
  simulateRaceStep,
  isRaceFinished,
  getPodium // Export the new function instead of getWinners
};
