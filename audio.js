// Audio manager. Every file load/play is wrapped so a missing asset (the
// `assets/` folder is optional — see README) never throws or stalls the
// game. Music only starts after the player presses PLAY, per browser
// autoplay rules; mute state persists via storage.js.

const SOURCES = {
  music: 'assets/music.mp3',
  coin: 'assets/coin.wav',
  boost: 'assets/boost.wav',
  jump: 'assets/jump.wav',
  shield: 'assets/shield.wav',
  gameover: 'assets/gameover.wav',
};

export class AudioManager {
  constructor(soundEnabled) {
    this.enabled = soundEnabled;
    this.musicStarted = false;
    this.elements = {};

    for (const [key, src] of Object.entries(SOURCES)) {
      const el = new Audio();
      el.src = src;
      el.preload = 'auto';
      if (key === 'music') {
        el.loop = true;
        el.volume = 0.45;
      } else {
        el.volume = 0.7;
      }
      // A 404 or decode failure fires 'error', not a thrown exception —
      // mark it broken so we silently skip it forever instead of retrying.
      el.broken = false;
      el.addEventListener('error', () => { el.broken = true; });
      this.elements[key] = el;
    }
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    const music = this.elements.music;
    if (!music || music.broken) return;
    if (enabled && this.musicStarted) {
      music.play().catch(() => {});
    } else {
      music.pause();
    }
  }

  // Call once, right after the player presses PLAY for the first time.
  startMusic() {
    this.musicStarted = true;
    const music = this.elements.music;
    if (!this.enabled || !music || music.broken) return;
    music.currentTime = 0;
    music.play().catch(() => {
      // Autoplay blocked or file missing — the game keeps working silently.
    });
  }

  play(key) {
    if (!this.enabled) return;
    const el = this.elements[key];
    if (!el || el.broken) return;
    try {
      const clone = el.cloneNode();
      clone.volume = el.volume;
      clone.play().catch(() => {});
    } catch (e) {
      // ignore — a sound effect is never allowed to break gameplay
    }
  }
}
