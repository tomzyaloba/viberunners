import { Player } from './player.js';
import { ObstacleManager } from './obstacles.js';
import { UI } from './ui.js';
import { CoinManager } from './coins.js';
import { VibePackManager, VIBE_PACK_DURATION } from './vibepack.js';
import { AudioManager } from './audio.js';
import { loadProgress, saveProgress } from './storage.js';
import { getCharacter } from './characters.js';
import { WalletManager, UNLOCK_RULES } from './web3.js';

// Fixed logical game resolution; the canvas element is scaled to fit the
// container via CSS while gameplay math always happens in these units.
// Tap-to-jump means we never need pointer coordinates, so this fixed
// resolution + CSS scaling approach stays simple across devices.
const GAME_WIDTH = 900;
const GAME_HEIGHT = 506;
const GROUND_Y = GAME_HEIGHT - 90;

// Base speed/spawn interval — unchanged from Phase 1. Character speedMul
// (currently 1 for everyone) can tune this further without touching tuning
// here.
const RUN_SPEED = 320; // px/s
const SPAWN_INTERVAL = 1.7; // seconds

const STATE = { MENU: 'menu', PLAYING: 'playing', GAME_OVER: 'game_over' };

const ACHIEVEMENTS = [
  { id: 'first_run', message: 'ACHIEVEMENT: First Vibe Run', check: (p) => p.gamesPlayed >= 1 },
  { id: 'coin_collector', message: 'ACHIEVEMENT: Vibe Collector (100 VIBE)', check: (p) => p.totalVibeCoins >= 100 },
  { id: 'high_scorer', message: 'ACHIEVEMENT: Score 5000+', check: (p) => p.bestScore >= 5000 },
  { id: 'flyer', message: 'ACHIEVEMENT: First Flight', check: (p) => p.usedVibePack },
  { id: 'testnet_builder', message: "ACHIEVEMENT: You didn't just play VIBE RUNNER. You helped build the ecosystem.", check: (p) => p.unlockedCharacters.length > 1 },
];

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

function fitCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const cssWidth = canvas.parentElement.clientWidth;
  const cssHeight = cssWidth * (GAME_HEIGHT / GAME_WIDTH);
  canvas.style.width = cssWidth + 'px';
  canvas.style.height = cssHeight + 'px';
  canvas.width = Math.round(GAME_WIDTH * dpr);
  canvas.height = Math.round(GAME_HEIGHT * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

let progress = loadProgress();

const ui = new UI();
const audio = new AudioManager(progress.soundEnabled);
const wallet = new WalletManager();
const obstacles = new ObstacleManager(GROUND_Y, GAME_WIDTH);
const coins = new CoinManager(GROUND_Y, GAME_WIDTH);
const vibepack = new VibePackManager(GROUND_Y, GAME_WIDTH);
const player = new Player(GROUND_Y, getCharacter(progress.selectedCharacter));

let state = STATE.MENU;
let score = 0;
let distance = 0;
let runCoins = 0;
let lastTime = 0;

ui.setMuteIcon(progress.soundEnabled);

function resetGame() {
  player.setCharacter(getCharacter(progress.selectedCharacter));
  player.reset(GROUND_Y);
  obstacles.reset();
  coins.reset();
  vibepack.reset();
  score = 0;
  distance = 0;
  runCoins = 0;
}

function startGame() {
  resetGame();
  state = STATE.PLAYING;
  ui.showGameplay();
  audio.startMusic();
}

function unlockAchievements() {
  let unlockedSomething = false;
  const achieved = new Set(progress.achievements);
  for (const a of ACHIEVEMENTS) {
    if (!achieved.has(a.id) && a.check(progress)) {
      achieved.add(a.id);
      ui.showToast(a.message);
      unlockedSomething = true;
    }
  }
  if (unlockedSomething) {
    progress = saveProgress({ achievements: Array.from(achieved) });
  }
}

function endGame() {
  state = STATE.GAME_OVER;
  const finalScore = Math.floor(score);
  progress = saveProgress({
    bestScore: Math.max(progress.bestScore, finalScore),
    totalVibeCoins: progress.totalVibeCoins + runCoins,
    bestRunCoins: Math.max(progress.bestRunCoins, runCoins),
    gamesPlayed: progress.gamesPlayed + 1,
  });
  audio.play('gameover');
  unlockAchievements();
  ui.showGameOver(finalScore, runCoins);
}

function handleJumpInput(e) {
  if (e) e.preventDefault(); // stop mobile scroll/zoom on tap
  if (state === STATE.PLAYING) {
    player.jump();
    if (!player.isFlying) audio.play('jump');
  }
}

canvas.addEventListener('pointerdown', handleJumpInput);
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.code === 'ArrowUp') handleJumpInput(e);
});

ui.onPlay(startGame);
ui.onRestart(startGame);

ui.onMuteToggle(() => {
  const next = !progress.soundEnabled;
  progress = saveProgress({ soundEnabled: next });
  audio.setEnabled(next);
  ui.setMuteIcon(next);
});

// --- Character menu --------------------------------------------------

function openCharacterMenu() {
  ui.openCharacterMenu(progress, (id) => {
    progress = saveProgress({ selectedCharacter: id });
    player.setCharacter(getCharacter(id));
    openCharacterMenu(); // re-render so the new selection is highlighted
  });
}
ui.onOpenCharacterMenu(openCharacterMenu);
ui.onCloseCharacterMenu(() => ui.closeCharacterMenu());

// --- Testnet menu ------------------------------------------------------

async function refreshUnlocksFromChain() {
  if (!wallet.connected) return;
  const newlyUnlockedCharacters = [...progress.unlockedCharacters];
  const newlyUnlockedPowerUps = [...progress.unlockedPowerUps];
  let changed = false;

  for (const rule of UNLOCK_RULES) {
    const result = await wallet.checkEligibility(rule);
    if (result.eligible) {
      if (!newlyUnlockedCharacters.includes(rule.reward) && getCharacter(rule.reward).id === rule.reward) {
        newlyUnlockedCharacters.push(rule.reward);
        changed = true;
      }
    }
  }

  if (changed) {
    progress = saveProgress({
      unlockedCharacters: newlyUnlockedCharacters,
      unlockedPowerUps: newlyUnlockedPowerUps,
    });
    ui.showToast('TESTNET BUILDER UNLOCKED');
  }
}

ui.onOpenTestnetMenu(async () => {
  ui.openTestnetMenu();
  await wallet.checkNetwork();
  ui.renderTestnetState(wallet, progress);
});
ui.onCloseTestnetMenu(() => ui.closeTestnetMenu());

ui.onConnectWallet(async () => {
  const result = await wallet.connect();
  if (result.ok) {
    await refreshUnlocksFromChain();
  }
  ui.renderTestnetState(wallet, progress);
});

ui.onDisconnectWallet(() => {
  // Disconnecting only clears local session state, never best score,
  // stats, or already-earned local achievements.
  wallet.disconnect();
  ui.renderTestnetState(wallet, progress);
});

ui.onSwitchNetwork(async () => {
  await wallet.switchNetwork();
  ui.renderTestnetState(wallet, progress);
});

// --- Rendering -----------------------------------------------------------

function drawBackground() {
  const grad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
  grad.addColorStop(0, '#0b1026');
  grad.addColorStop(1, '#1a1040');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  ctx.fillStyle = '#120a2e';
  ctx.fillRect(0, GROUND_Y, GAME_WIDTH, GAME_HEIGHT - GROUND_Y);
  ctx.strokeStyle = '#39ffce';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  ctx.lineTo(GAME_WIDTH, GROUND_Y);
  ctx.stroke();
}

function checkCollision(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function loop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  let dt = (timestamp - lastTime) / 1000;
  dt = Math.min(dt, 0.05); // clamp so a tab-switch stutter can't cause a huge physics jump
  lastTime = timestamp;

  if (state === STATE.PLAYING) {
    const character = player.character;
    const speed = RUN_SPEED * (character.speedMul || 1);

    player.update(dt);
    obstacles.update(dt, speed, SPAWN_INTERVAL);
    coins.update(dt, speed, SPAWN_INTERVAL);
    vibepack.update(dt, speed);

    distance += speed * dt;
    score = distance * 0.1;

    const playerBounds = player.getBounds();

    // VIBE PACK pickup
    if (vibepack.collect(playerBounds)) {
      const duration = VIBE_PACK_DURATION * (character.boostMul || 1);
      player.startFlight(duration);
      audio.play('boost');
      ui.showToast('VIBE PACK ACTIVATED');
      progress = saveProgress({ usedVibePack: true });
    }

    // Coins
    const { collectedCount, comboCount, scoreBonus } = coins.collect(playerBounds, character.coinMul || 1);
    if (collectedCount > 0) {
      runCoins += collectedCount;
      score += scoreBonus;
      audio.play('coin');
    }
    ui.updateCoins(runCoins);
    ui.showCombo(comboCount);

    // VIBE PACK bar / depletion message
    if (player.isFlying) {
      ui.showVibePackBar(player.flightTimer / player.flightDuration);
    } else {
      if (ui._wasFlying) ui.showToast('VIBE PACK DEPLETED');
      ui.hideVibePackBar();
    }
    ui._wasFlying = player.isFlying;

    ui.updateScore(Math.floor(score));

    // Obstacle collision — flying lets the player pass over ground obstacles
    if (!player.isFlying) {
      for (const o of obstacles.obstacles) {
        if (checkCollision(playerBounds, o)) {
          endGame();
          break;
        }
      }
    }
  }

  drawBackground();
  obstacles.draw(ctx);
  coins.draw(ctx);
  vibepack.draw(ctx);
  player.draw(ctx);

  requestAnimationFrame(loop);
}

ui.showStart(progress.bestScore);
requestAnimationFrame(loop);
