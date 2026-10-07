// Local progression storage.
// Never stores wallet secrets — only UI/game preferences and stats.
//
// Every read/write is wrapped so a blocked or full localStorage
// (private browsing, quota limits, etc.) degrades to in-memory
// defaults instead of crashing the game.

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

  // Day/Night preference
  // true = DAY
  // false = NIGHT
  dayMode: true,

  achievements: [],
  usedVibePack: false,
};

let memoryState = { ...DEFAULTS };
let storageAvailable = true;

/* =========================================================
   CHECK LOCAL STORAGE
   ========================================================= */

try {
  const testKey = '__viberun_test__';

  localStorage.setItem(testKey, '1');
  localStorage.removeItem(testKey);
} catch (e) {
  storageAvailable = false;
}

/* =========================================================
   LOAD PROGRESS
   ========================================================= */

export function loadProgress() {
  // If localStorage is unavailable, use memory storage.
  if (!storageAvailable) {
    return {
      ...DEFAULTS,
      ...memoryState,
    };
  }

  try {
    const raw = localStorage.getItem(KEY);

    // No saved progress yet.
    if (!raw) {
      return { ...DEFAULTS };
    }

    const parsed = JSON.parse(raw);

    // Merge saved data on top of defaults.
    //
    // This is important because older players may have
    // progress saved before newer features such as dayMode
    // were added.
    return {
      ...DEFAULTS,
      ...parsed,
    };
  } catch (e) {
    // Corrupt or unreadable storage should never crash the game.
    return { ...DEFAULTS };
  }
}

/* =========================================================
   SAVE PROGRESS
   ========================================================= */

export function saveProgress(partial) {
  const current = loadProgress();

  // Merge new values into the existing progress.
  const next = {
    ...current,
    ...partial,
  };

  // Fallback to memory if localStorage is unavailable.
  if (!storageAvailable) {
    memoryState = next;
    return next;
  }

  try {
    localStorage.setItem(
      KEY,
      JSON.stringify(next)
    );
  } catch (e) {
    // localStorage may become unavailable because of:
    // - quota exceeded
    // - browser privacy restrictions
    // - storage being disabled
    //
    // Keep the game running using memory instead.
    storageAvailable = false;
    memoryState = next;
  }

  return next;
}
