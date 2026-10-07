export class AudioManager {
  constructor(soundEnabled = true) {
    this.ctx = null;

    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;

    this.musicPlaying = false;
    this.musicTimer = null;

    this.masterVolume = soundEnabled ? 0.8 : 0;
    this.musicVolume = 0.22;
    this.sfxVolume = 0.75;

    this.step = 0;
  }

  init() {
    if (!this.ctx) {
      const AudioContext =
        window.AudioContext || window.webkitAudioContext;

      if (!AudioContext) {
        console.warn("Web Audio API is not supported.");
        return;
      }

      this.ctx = new AudioContext();

      this.masterGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();

      this.masterGain.gain.value = this.masterVolume;
      this.musicGain.gain.value = this.musicVolume;
      this.sfxGain.gain.value = this.sfxVolume;

      this.musicGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  // ---------------------------------------------------------
  // UNIVERSAL SOUND METHOD
  // ---------------------------------------------------------

  play(sound) {
    this.init();

    if (!this.ctx) return;

    switch (sound) {
      case "jump":
        this.playJump();
        break;

      case "coin":
        this.playCoin();
        break;

      case "shield":
        this.playShield();
        break;

      case "boost":
        this.playSpeedBoost();
        break;

      case "vibepack":
        this.playVibePack();
        break;

      case "hit":
        this.playHit();
        break;

      case "gameover":
        this.playGameOver();
        break;

      case "success":
        this.playSuccess();
        break;

      default:
        console.warn("Unknown sound:", sound);
    }
  }

  // ---------------------------------------------------------
  // BACKGROUND MUSIC
  // ---------------------------------------------------------

  startMusic() {
    this.init();

    if (!this.ctx || this.musicPlaying) {
      return;
    }

    this.musicPlaying = true;
    this.step = 0;

    this.playMusicBeat();
  }

  playMusicBeat() {
    if (!this.musicPlaying || !this.ctx) {
      return;
    }

    const progression = [
      [130.81, 155.56, 196.00, 233.08],
      [103.83, 130.81, 155.56, 196.00],
      [87.31, 103.83, 130.81, 155.56],
      [98.00, 123.47, 146.83, 174.61]
    ];

    const chordIndex =
      Math.floor(this.step / 4) % progression.length;

    const noteIndex = this.step % 4;

    const frequency =
      progression[chordIndex][noteIndex];

    this.playMusicNote(
      frequency,
      0.28,
      "sawtooth",
      0.09
    );

    if (this.step % 2 === 0) {
      const melodyNotes = [
        261.63,
        311.13,
        392.00,
        466.16,
        392.00,
        311.13
      ];

      const melodyIndex =
        Math.floor(this.step / 2) % melodyNotes.length;

      this.playMusicNote(
        melodyNotes[melodyIndex],
        0.18,
        "triangle",
        0.07
      );
    }

    this.step++;

    this.musicTimer = setTimeout(() => {
      this.playMusicBeat();
    }, 250);
  }

  playMusicNote(
    frequency,
    duration,
    type = "sawtooth",
    volume = 0.09
  ) {
    if (!this.ctx || !this.musicPlaying) {
      return;
    }

    const oscillator = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    oscillator.type = type;

    oscillator.frequency.setValueAtTime(
      frequency,
      this.ctx.currentTime
    );

    gain.gain.setValueAtTime(
      0.0001,
      this.ctx.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      volume,
      this.ctx.currentTime + 0.02
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      this.ctx.currentTime + duration
    );

    oscillator.connect(gain);
    gain.connect(this.musicGain);

    oscillator.start();

    oscillator.stop(
      this.ctx.currentTime + duration + 0.02
    );
  }

  stopMusic() {
    this.musicPlaying = false;

    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }

  // ---------------------------------------------------------
  // JUMP
  // ---------------------------------------------------------

  playJump() {
    this.init();

    if (!this.ctx) return;

    const oscillator = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    oscillator.type = "square";

    oscillator.frequency.setValueAtTime(
      280,
      this.ctx.currentTime
    );

    oscillator.frequency.exponentialRampToValueAtTime(
      650,
      this.ctx.currentTime + 0.16
    );

    gain.gain.setValueAtTime(
      0.0001,
      this.ctx.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.28,
      this.ctx.currentTime + 0.015
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      this.ctx.currentTime + 0.18
    );

    oscillator.connect(gain);
    gain.connect(this.sfxGain);

    oscillator.start();

    oscillator.stop(
      this.ctx.currentTime + 0.2
    );
  }

  // ---------------------------------------------------------
  // COIN
  // ---------------------------------------------------------

  playCoin() {
    this.init();

    if (!this.ctx) return;

    this.playTone(
      900,
      0.08,
      "square",
      0.22
    );

    setTimeout(() => {
      this.playTone(
        1350,
        0.1,
        "square",
        0.2
      );
    }, 60);

    setTimeout(() => {
      this.playTone(
        1800,
        0.12,
        "triangle",
        0.12
      );
    }, 110);
  }

  // ---------------------------------------------------------
  // SPEED BOOST
  // ---------------------------------------------------------

  playSpeedBoost() {
    this.init();

    if (!this.ctx) return;

    const oscillator = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    oscillator.type = "sawtooth";

    oscillator.frequency.setValueAtTime(
      180,
      this.ctx.currentTime
    );

    oscillator.frequency.exponentialRampToValueAtTime(
      1000,
      this.ctx.currentTime + 0.45
    );

    gain.gain.setValueAtTime(
      0.0001,
      this.ctx.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.3,
      this.ctx.currentTime + 0.05
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      this.ctx.currentTime + 0.5
    );

    oscillator.connect(gain);
    gain.connect(this.sfxGain);

    oscillator.start();

    oscillator.stop(
      this.ctx.currentTime + 0.55
    );
  }

  // ---------------------------------------------------------
  // SHIELD
  // ---------------------------------------------------------

  playShield() {
    this.init();

    if (!this.ctx) return;

    this.playTone(
      350,
           0.12,
      "sine",
      0.2
    );

    setTimeout(() => {
      this.playTone(
        550,
        0.12,
        "sine",
        0.2
      );
    }, 80);

    setTimeout(() => {
      this.playTone(
        900,
        0.2,
        "triangle",
        0.18
      );
    }, 160);
  }

  // ---------------------------------------------------------
  // VIBE PACK
  // ---------------------------------------------------------

  playVibePack() {
    this.init();

    if (!this.ctx) return;

    const notes = [
      392,
      494,
      587,
      784,
      988
    ];

    notes.forEach((frequency, index) => {
      setTimeout(() => {
        this.playTone(
          frequency,
          0.18,
          "triangle",
          0.18
        );
      }, index * 70);
    });
  }

  // ---------------------------------------------------------
  // OBSTACLE HIT
  // ---------------------------------------------------------

  playHit() {
    this.init();

    if (!this.ctx) return;

    const oscillator = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    oscillator.type = "sawtooth";

    oscillator.frequency.setValueAtTime(
      180,
      this.ctx.currentTime
    );

    oscillator.frequency.exponentialRampToValueAtTime(
      45,
      this.ctx.currentTime + 0.3
    );

    gain.gain.setValueAtTime(
      0.35,
      this.ctx.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      this.ctx.currentTime + 0.3
    );

    oscillator.connect(gain);
    gain.connect(this.sfxGain);

    oscillator.start();

    oscillator.stop(
      this.ctx.currentTime + 0.32
    );

    this.playNoise(
      0.12,
      0.25
    );
  }

  // ---------------------------------------------------------
  // GAME OVER
  // ---------------------------------------------------------

  playGameOver() {
    this.init();

    if (!this.ctx) return;

    this.stopMusic();

    const notes = [
      330,
      277,
      220,
      165
    ];

    notes.forEach((frequency, index) => {
      setTimeout(() => {
        this.playTone(
          frequency,
          0.35,
          "sawtooth",
          0.22
        );
      }, index * 220);
    });
  }

  // ---------------------------------------------------------
  // SUCCESS
  // ---------------------------------------------------------

  playSuccess() {
    this.init();

    if (!this.ctx) return;

    const notes = [
      523,
      659,
      784,
      1047
    ];

    notes.forEach((frequency, index) => {
      setTimeout(() => {
        this.playTone(
          frequency,
          0.16,
          "triangle",
          0.2
        );
      }, index * 100);
    });
  }

  // ---------------------------------------------------------
  // GENERIC TONE
  // ---------------------------------------------------------

  playTone(
    frequency,
    duration,
    type = "sine",
    volume = 0.2
  ) {
    this.init();

    if (!this.ctx) return;

    const oscillator = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    oscillator.type = type;

    oscillator.frequency.setValueAtTime(
      frequency,
      this.ctx.currentTime
    );

    gain.gain.setValueAtTime(
      0.0001,
      this.ctx.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      volume,
      this.ctx.currentTime + 0.01
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      this.ctx.currentTime + duration
    );

    oscillator.connect(gain);
    gain.connect(this.sfxGain);

    oscillator.start();

    oscillator.stop(
      this.ctx.currentTime + duration + 0.02
    );
  }

  // ---------------------------------------------------------
  // NOISE
  // ---------------------------------------------------------

  playNoise(
    duration = 0.15,
    volume = 0.2
  ) {
    this.init();

    if (!this.ctx) return;

    const bufferSize =
      Math.floor(this.ctx.sampleRate * duration);

    const buffer =
      this.ctx.createBuffer(
        1,
        bufferSize,
        this.ctx.sampleRate
      );

    const data =
      buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] =
        Math.random() * 2 - 1;
    }

    const source =
      this.ctx.createBufferSource();

    const gain =
      this.ctx.createGain();

    source.buffer = buffer;

    gain.gain.setValueAtTime(
      volume,
      this.ctx.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      this.ctx.currentTime + duration
    );

    source.connect(gain);
    gain.connect(this.sfxGain);

    source.start();
  }

  // ---------------------------------------------------------
  // ENABLE / DISABLE SOUND
  // ---------------------------------------------------------

  setEnabled(enabled) {
    this.masterVolume = enabled ? 0.8 : 0;

    this.init();

    if (this.masterGain) {
      this.masterGain.gain.value =
        this.masterVolume;
    }

    if (enabled) {
      if (!this.musicPlaying) {
        this.startMusic();
      }
    } else {
      this.stopMusic();
    }
  }

  // ---------------------------------------------------------
  // VOLUME
  // ---------------------------------------------------------

  setMasterVolume(volume) {
    this.masterVolume = volume;

    if (this.masterGain) {
      this.masterGain.gain.value = volume;
    }
  }

  setMusicVolume(volume) {
    this.musicVolume = volume;

    if (this.musicGain) {
      this.musicGain.gain.value = volume;
    }
  }

  setSFXVolume(volume) {
    this.sfxVolume = volume;

    if (this.sfxGain) {
      this.sfxGain.gain.value = volume;
    }
  }
}
