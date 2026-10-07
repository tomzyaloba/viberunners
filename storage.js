// Local progression storage. Never stores wallet secrets — only UI/game
// preferences and stats. Every read/write is wrapped so a blocked or full
// localStorage (private browsing, quota) degrades to in-memory defaults
// instead of crashing the game.

const KEY = 'viberun_progress_v1';

const DEFAULTS = {
  bestScore: 0,
  totalVibeCoins: 0,
  bestRunCoins: 0,
  gamesPlayed: 0,
  unlockedCharacters: ['base_runner'],
  unlockedPowerUps: ['vibe_pack'],
  selectedCharacter: 'base_runner',
  soundEnabled: true,
  achievements: [],
  usedVibePack: false,
};

let memoryState = { ...DEFAULTS };
let storageAvailable = true;

try {
  const testKey = '__viberun_test__';
  localStorage.setItem(testKey, '1');
  localStorage.removeItem(testKey);
} catch (e) {
  storageAvailable = false;
}

export function loadProgress() {
  if (!storageAvailable) return { ...memoryState };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULTS, ...parsed };
  } catch (e) {
    return { ...DEFAULTS };
  }
}

export function saveProgress(partial) {
  const current = loadProgress();
  const next = { ...current, ...partial };
  if (!storageAvailable) {
    memoryState = next;
    return next;
  }
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch (e) {
    // quota exceeded or blocked mid-session — fall back silently
    storageAvailable = false;
    memoryState = next;
  }
  return next;
}
