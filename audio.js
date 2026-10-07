export class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;

    this.musicPlaying = false;
    this.musicTimer = null;
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") {
        this.ctx.resume();
      }
      return;
    }

    const AudioContext = window.AudioContext || window.webkitAudioContext;

    if (!AudioContext) {
      console.warn("Web Audio API is not supported.");
      return;
    }

    this.ctx = new AudioContext();

    this.masterGain = this.ctx.createGain();
    this.musicGain = this.ctx.createGain();
    this.sfxGain = this.ctx.createGain();

    this.masterGain.gain.value = 0.8;
    this.musicGain.gain.value = 0.25;
    this.sfxGain.gain.value = 0.7;

    this.musicGain.connect(this.masterGain);
    this.sfxGain.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  startMusic() {
    this.init();

    if (!this.ctx || this.musicPlaying) {
      return;
    }

    this.musicPlaying = true;

    this.playMusicLoop();
  }

  playMusicLoop() {
    if (!this.musicPlaying || !this.ctx) {
      return;
    }

    const notes = [
      261.63,
      329.63,
      392.00,
      329.63,
      293.66,
      349.23,
      440.00,
      349.23
    ];

    let index = 0;

    const playNext = () => {
      if (!this.musicPlaying || !this.ctx) {
        return;
      }

      const oscillator = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      oscillator.type = "square";
      oscillator.frequency.value = notes[index];

      gain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.08,
        this.ctx.currentTime + 0.02
      );

      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        this.ctx.currentTime + 0.22
      );

      oscillator.connect(gain);
      gain.connect(this.musicGain);

      oscillator.start();
      oscillator.stop(this.ctx.currentTime + 0.25);

      index = (index + 1) % notes.length;

      this.musicTimer = setTimeout(playNext, 250);
    };

    playNext();
  }

  stopMusic() {
    this.musicPlaying = false;

    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }

  playJump() {
    this.init();

    if (!this.ctx) return;

    this.playTone(520, 0.12, "sine");
  }

  playCoin() {
    this.init();

    if (!this.ctx) return;

    this.playTone(880, 0.08, "square");

    setTimeout(() => {
      this.playTone(1200, 0.08, "square");
    }, 70);
  }

  playPowerUp() {
    this.init();

    if (!this.ctx) return;

    this.playTone(500, 0.1, "sine");

    setTimeout(() => {
      this.playTone(800, 0.1, "sine");
    }, 100);

    setTimeout(() => {
      this.playTone(1100, 0.15, "sine");
    }, 200);
  }

  playHit() {
    this.init();

    if (!this.ctx) return;

    this.playTone(120, 0.25, "sawtooth");
  }

  playGameOver() {
    this.init();

    if (!this.ctx) return;

    this.playTone(300, 0.2, "square");

    setTimeout(() => {
      this.playTone(220, 0.25, "square");
    }, 220);

    setTimeout(() => {
      this.playTone(150, 0.4, "square");
    }, 480);
  }

  playTone(frequency, duration, type = "sine") {
    if (!this.ctx) return;

    const oscillator = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;

    gain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

    gain.gain.exponentialRampToValueAtTime(
      0.3,
      this.ctx.currentTime + 0.01
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      this.ctx.currentTime + duration
    );

    oscillator.connect(gain);
    gain.connect(this.sfxGain);

    oscillator.start();
    oscillator.stop(this.ctx.currentTime + duration);
  }

  setMasterVolume(volume) {
    this.init();

    if (this.masterGain) {
      this.masterGain.gain.value = volume;
    }
  }

  setMusicVolume(volume) {
    this.init();

    if (this.musicGain) {
      this.musicGain.gain.value = volume;
    }
  }

  setSFXVolume(volume) {
    this.init();

    if (this.sfxGain) {
      this.sfxGain.gain.value = volume;
    }
  }
}
