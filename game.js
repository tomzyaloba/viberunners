import { Player } from './player.js';
import { ObstacleManager } from './obstacles.js';
import { UI } from './ui.js';
import { CoinManager } from './coins.js';
import {
  VibePackManager,
  VIBE_PACK_DURATION
} from './vibepack.js';

import {
  PowerUpManager,
  SHIELD_TYPE,
  SPEED_BOOST_TYPE,
  SPEED_BOOST_DURATION,
  SPEED_BOOST_MULTIPLIER
} from './powerups.js';

import { AudioManager } from './audio.js';
import {
  loadProgress,
  saveProgress
} from './storage.js';

import { getCharacter } from './characters.js';

import {
  WalletManager,
  UNLOCK_RULES
} from './web3.js';

const GAME_WIDTH = 900;
const GAME_HEIGHT = 506;
const GROUND_Y = GAME_HEIGHT - 90;

const RUN_SPEED = 320;
const SPAWN_INTERVAL = 1.7;

const DIFFICULTY_RAMP_DISTANCE = 7000;
const MAX_SPEED_MULTIPLIER = 1.7;

function speedMultiplierForDistance(distance) {
  const t =
    Math.min(
      distance / DIFFICULTY_RAMP_DISTANCE,
      1
    );

  return (
    1 +
    t *
      (MAX_SPEED_MULTIPLIER - 1)
  );
}

const STATE = {
  MENU: 'menu',
  PLAYING: 'playing',
  GAME_OVER: 'game_over'
};

const ACHIEVEMENTS = [
  {
    id: 'first_run',
    message: 'ACHIEVEMENT: First Vibe Run',
    check: (p) => p.gamesPlayed >= 1
  },

  {
    id: 'coin_collector',
    message: 'ACHIEVEMENT: Vibe Collector (100 VIBE)',
    check: (p) => p.totalVibeCoins >= 100
  },

  {
    id: 'high_scorer',
    message: 'ACHIEVEMENT: Score 5000+',
    check: (p) => p.bestScore >= 5000
  },

  {
    id: 'flyer',
    message: 'ACHIEVEMENT: First Flight',
    check: (p) => p.usedVibePack
  },

  {
    id: 'testnet_builder',
    message:
      "ACHIEVEMENT: You didn't just play VIBE RUNNER. You helped build the ecosystem.",
    check: (p) =>
      p.unlockedCharacters.length > 1
  }
];

const canvas =
  document.getElementById('game-canvas');

const ctx =
  canvas.getContext('2d');

function fitCanvas() {
  const dpr =
    window.devicePixelRatio || 1;

  const cssWidth =
    canvas.parentElement.clientWidth;

  const cssHeight =
    cssWidth *
    (GAME_HEIGHT / GAME_WIDTH);

  canvas.style.width =
    cssWidth + 'px';

  canvas.style.height =
    cssHeight + 'px';

  canvas.width =
    Math.round(GAME_WIDTH * dpr);

  canvas.height =
    Math.round(GAME_HEIGHT * dpr);

  ctx.setTransform(
    dpr,
    0,
    0,
    dpr,
    0,
    0
  );
}

window.addEventListener(
  'resize',
  fitCanvas
);

fitCanvas();

let progress =
  loadProgress();

let isDayMode =
  progress.dayMode ?? true;

const ui = new UI();

const audio =
  new AudioManager(
    progress.soundEnabled
  );

const wallet =
  new WalletManager();

const obstacles =
  new ObstacleManager(
    GROUND_Y,
    GAME_WIDTH
  );

const coins =
  new CoinManager(
    GROUND_Y,
    GAME_WIDTH
  );

const vibepack =
  new VibePackManager(
    GROUND_Y,
    GAME_WIDTH
  );

const powerups =
  new PowerUpManager(
    GROUND_Y,
    GAME_WIDTH
  );

const player =
  new Player(
    GROUND_Y,
    getCharacter(
      progress.selectedCharacter
    )
  );

let state =
  STATE.MENU;

let score = 0;
let distance = 0;
let runCoins = 0;
let lastTime = 0;

let speedBoostTimer = 0;

ui.setMuteIcon(
  progress.soundEnabled
);

ui.setDayNightIcon(
  isDayMode
);

function resetGame() {
  player.setCharacter(
    getCharacter(
      progress.selectedCharacter
    )
  );

  player.reset(
    GROUND_Y
  );

  obstacles.reset();
  coins.reset();
  vibepack.reset();
  powerups.reset();

  score = 0;
  distance = 0;
  runCoins = 0;
  speedBoostTimer = 0;
}

function startGame() {
  resetGame();

  state =
    STATE.PLAYING;

  ui.showGameplay();

  audio.init();
  audio.startMusic();
}

function unlockAchievements() {
  let unlockedSomething =
    false;

  const achieved =
    new Set(
      progress.achievements
    );

  for (const a of ACHIEVEMENTS) {
    if (
      !achieved.has(a.id) &&
      a.check(progress)
    ) {
      achieved.add(a.id);

      ui.showToast(
        a.message
      );

      unlockedSomething = true;
    }
  }

  if (unlockedSomething) {
    progress =
      saveProgress({
        achievements:
          Array.from(achieved)
      });
  }
}

function endGame() {
  state =
    STATE.GAME_OVER;

  const finalScore =
    Math.floor(score);

  progress =
    saveProgress({
      bestScore:
        Math.max(
          progress.bestScore,
          finalScore
        ),

      totalVibeCoins:
        progress.totalVibeCoins +
        runCoins,

      bestRunCoins:
        Math.max(
          progress.bestRunCoins,
          runCoins
        ),

      gamesPlayed:
        progress.gamesPlayed + 1
    });

  audio.play(
    'gameover'
  );

  unlockAchievements();

  ui.setShieldIcon(false);
  ui.setBoostIcon(false);

  ui.showGameOver(
    finalScore,
    runCoins
  );
}

function handleJumpInput(e) {
  if (e) {
    e.preventDefault();
  }

  if (
    state === STATE.PLAYING
  ) {
    player.jump();

    if (
      !player.isFlying
    ) {
      audio.play('jump');
    }
  }
}

canvas.addEventListener(
  'pointerdown',
  handleJumpInput
);

window.addEventListener(
  'keydown',
  (e) => {
    if (
      e.code === 'Space' ||
      e.code === 'ArrowUp'
    ) {
      handleJumpInput(e);
    }
  }
);

ui.onPlay(
  startGame
);

ui.onRestart(
  startGame
);

// HOME BUTTON
ui.onHome(() => {
  state =
    STATE.MENU;

  resetGame();

  audio.stopMusic();

  ui.showStart(
    progress.bestScore
  );
});

// DAY / NIGHT BUTTON
ui.onDayNightToggle(() => {
  isDayMode =
    !isDayMode;

  progress =
    saveProgress({
      dayMode:
        isDayMode
    });

  ui.setDayNightIcon(
    isDayMode
  );

  ui.showToast(
    isDayMode
      ? '☀️ DAY MODE'
      : '🌙 NIGHT MODE'
  );
});

ui.onMuteToggle(() => {
  const next =
    !progress.soundEnabled;

  progress =
    saveProgress({
      soundEnabled:
        next
    });

  audio.setEnabled(
    next
  );

  ui.setMuteIcon(
    next
  );
});

// --- Character menu --------------------------------------------------

function openCharacterMenu() {
  ui.openCharacterMenu(
    progress,
    (id) => {
      progress =
        saveProgress({
          selectedCharacter:
            id
        });

      player.setCharacter(
        getCharacter(id)
      );

      openCharacterMenu();
    }
  );
}

ui.onOpenCharacterMenu(
  openCharacterMenu
);

ui.onCloseCharacterMenu(
  () => ui.closeCharacterMenu()
);

// --- Testnet menu ----------------------------------------------------

async function refreshUnlocksFromChain() {
  if (!wallet.connected) {
    return;
  }

  const newlyUnlockedCharacters =
    [
      ...progress.unlockedCharacters
    ];

  const newlyUnlockedPowerUps =
    [
      ...progress.unlockedPowerUps
    ];

  let changed = false;

  for (
    const rule of UNLOCK_RULES
  ) {
    const result =
      await wallet.checkEligibility(
        rule
      );

    if (
      result.eligible
    ) {
      if (
        !newlyUnlockedCharacters.includes(
          rule.reward
        ) &&
        getCharacter(
          rule.reward
        ).id ===
          rule.reward
      ) {
        newlyUnlockedCharacters.push(
          rule.reward
        );

        changed = true;
      }
    }
  }

  if (changed) {
    progress =
      saveProgress({
        unlockedCharacters:
          newlyUnlockedCharacters,

        unlockedPowerUps:
          newlyUnlockedPowerUps
      });

    ui.showToast(
      'TESTNET BUILDER UNLOCKED'
    );
  }
}

ui.onOpenTestnetMenu(
  async () => {
    ui.openTestnetMenu();

    await wallet.checkNetwork();

    ui.renderTestnetState(
      wallet,
      progress
    );
  }
);

ui.onCloseTestnetMenu(
  () =>
    ui.closeTestnetMenu()
);

ui.onConnectWallet(
  async () => {
    const result =
      await wallet.connect();

    if (result.ok) {
      await refreshUnlocksFromChain();
    }

    ui.renderTestnetState(
      wallet,
      progress
    );
  }
);

ui.onDisconnectWallet(
  () => {
    wallet.disconnect();

    ui.renderTestnetState(
      wallet,
      progress
    );
  }
);

ui.onSwitchNetwork(
  async () => {
    await wallet.switchNetwork();

    ui.renderTestnetState(
      wallet,
      progress
    );
  }
);

// --- Rendering -------------------------------------------------------

function drawBackground() {
  const grad =
    ctx.createLinearGradient(
      0,
      0,
      0,
      GAME_HEIGHT
    );

  if (isDayMode) {
    // ☀️ DAY

    grad.addColorStop(
      0,
      '#87CEEB'
    );

    grad.addColorStop(
      0.55,
      '#BFE9FF'
    );

    grad.addColorStop(
      1,
      '#EAF9FF'
    );

    ctx.fillStyle =
      grad;

    ctx.fillRect(
      0,
      0,
      GAME_WIDTH,
      GAME_HEIGHT
    );

    // Sun
    ctx.save();

    ctx.fillStyle =
      '#FFD93D';

    ctx.shadowColor =
      '#FFD93D';

    ctx.shadowBlur =
      30;

    ctx.beginPath();

    ctx.arc(
      760,
      85,
      38,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.restore();

    // Day ground
    ctx.fillStyle =
      '#4C8C45';

    ctx.fillRect(
      0,
      GROUND_Y,
      GAME_WIDTH,
      GAME_HEIGHT -
        GROUND_Y
    );

    ctx.strokeStyle =
      '#2F5E2A';

  } else {
    // 🌙 NIGHT

    grad.addColorStop(
      0,
      '#050816'
    );

    grad.addColorStop(
      0.55,
      '#0B1230'
    );

    grad.addColorStop(
      1,
      '#19113D'
    );

    ctx.fillStyle =
      grad;

    ctx.fillRect(
      0,
      0,
      GAME_WIDTH,
      GAME_HEIGHT
    );

    // Moon
    ctx.save();

    ctx.fillStyle =
      '#F5F3CE';

    ctx.shadowColor =
      '#FFFFFF';

    ctx.shadowBlur =
      25;

    ctx.beginPath();

    ctx.arc(
      760,
      85,
      34,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle =
      '#0B1230';

    ctx.beginPath();

    ctx.arc(
      775,
      75,
      34,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.restore();

    // Stars
    ctx.fillStyle =
      '#FFFFFF';

    const stars = [
      [90, 70],
      [170, 125],
      [260, 55],
      [350, 105],
      [450, 65],
      [540, 130],
      [630, 45],
      [700, 150],
      [820, 125],
      [860, 60]
    ];

    for (
      const [x, y] of stars
    ) {
      ctx.beginPath();

      ctx.arc(
        x,
        y,
        2,
        0,
        Math.PI * 2
      );

      ctx.fill();
    }

    // Night ground
    ctx.fillStyle =
      '#120A2E';

    ctx.fillRect(
      0,
      GROUND_Y,
      GAME_WIDTH,
      GAME_HEIGHT -
        GROUND_Y
    );

    ctx.strokeStyle =
      '#39FFCE';
  }

  // Ground line
  ctx.lineWidth = 3;

  ctx.beginPath();

  ctx.moveTo(
    0,
    GROUND_Y
  );

  ctx.lineTo(
    GAME_WIDTH,
    GROUND_Y
  );

  ctx.stroke();
}

function checkCollision(a, b) {
  return (
    a.x <
      b.x + b.width &&
    a.x + a.width >
      b.x &&
    a.y <
      b.y + b.height &&
    a.y + a.height >
      b.y
  );
}

function loop(timestamp) {
  if (!lastTime) {
    lastTime =
      timestamp;
  }

  let dt =
    (timestamp - lastTime) /
    1000;

  dt =
    Math.min(
      dt,
      0.05
    );

  lastTime =
    timestamp;

  if (
    state === STATE.PLAYING
  ) {
    const character =
      player.character;

    if (
      speedBoostTimer > 0
    ) {
      speedBoostTimer =
        Math.max(
          0,
          speedBoostTimer -
            dt * 1000
        );
    }

    const boostMul =
      speedBoostTimer > 0
        ? SPEED_BOOST_MULTIPLIER
        : 1;

    const speed =
      RUN_SPEED *
      (character.speedMul || 1) *
      speedMultiplierForDistance(
        distance
      ) *
      boostMul;

    player.update(dt);

    obstacles.update(
      dt,
      speed,
      SPAWN_INTERVAL
    );

    coins.update(
      dt,
      speed,
      SPAWN_INTERVAL
    );

    vibepack.update(
      dt,
      speed
    );

    powerups.update(
      dt,
      speed
    );

    distance +=
      speed * dt;

    score =
      distance * 0.1;

    const playerBounds =
      player.getBounds();

    // Powerups
    const pickedUpType =
      powerups.collect(
        playerBounds
      );

    if (
      pickedUpType ===
      SHIELD_TYPE
    ) {
      player.hasShield =
        true;

      audio.play(
        'shield'
      );

      ui.showToast(
        'SHIELD READY'
      );

    } else if (
      pickedUpType ===
      SPEED_BOOST_TYPE
    ) {
      speedBoostTimer =
        SPEED_BOOST_DURATION *
        1000;

      audio.play(
        'boost'
      );

      ui.showToast(
        'SPEED BOOST'
      );
    }

    ui.setShieldIcon(
      player.hasShield
    );

    ui.setBoostIcon(
      speedBoostTimer > 0
    );

    // VIBE PACK
    if (
      vibepack.collect(
        playerBounds
      )
    ) {
      const duration =
        VIBE_PACK_DURATION *
        (character.boostMul || 1);

      player.startFlight(
        duration
      );

      audio.play(
        'vibepack'
      );

      ui.showToast(
        'VIBE PACK ACTIVATED'
      );

      progress =
        saveProgress({
          usedVibePack:
            true
        });
    }

    // Coins
    const {
      collectedCount,
      comboCount,
      scoreBonus
    } =
      coins.collect(
        playerBounds,
        character.coinMul || 1
      );

    if (
      collectedCount > 0
    ) {
      runCoins +=
        collectedCount;

      score +=
        scoreBonus;

      audio.play(
        'coin'
      );
    }

    ui.updateCoins(
      runCoins
    );

    ui.showCombo(
      comboCount
    );

    // VIBE PACK BAR
    if (
      player.isFlying
    ) {
      ui.showVibePackBar(
        player.flightTimer /
          player.flightDuration
      );
    } else {
      if (
        ui._wasFlying
      ) {
        ui.showToast(
          'VIBE PACK DEPLETED'
        );
      }

      ui.hideVibePackBar();
    }

    ui._wasFlying =
      player.isFlying;

    ui.updateScore(
      Math.floor(score)
    );

    // Obstacle collision
    if (
      !player.isFlying
    ) {
      for (
        let i = 0;
        i <
        obstacles.obstacles.length;
        i++
      ) {
        const o =
          obstacles.obstacles[i];

        if (
          checkCollision(
            playerBounds,
            o
          )
        ) {
          if (
            player.hasShield
          ) {
            player.hasShield =
              false;

            ui.setShieldIcon(
              false
            );

            obstacles.obstacles.splice(
              i,
              1
            );

            audio.play(
              'shield'
            );

            ui.showToast(
              'SHIELD ABSORBED HIT'
            );

          } else {
            endGame();
          }

          break;
        }
      }
    }
  }

  drawBackground();

  obstacles.draw(ctx);
  coins.draw(ctx);
  vibepack.draw(ctx);
  powerups.draw(ctx);
  player.draw(ctx);

  requestAnimationFrame(
    loop
  );
}

ui.setDayNightIcon(
  isDayMode
);

ui.showStart(
  progress.bestScore
);

requestAnimationFrame(
  loop
);
