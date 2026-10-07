import { CHARACTERS, isCharacterUnlocked } from './characters.js';
import { UNLOCK_RULES, isConfigured } from './web3.js';

export class UI {
  constructor() {
    this.hud = document.getElementById('hud');
    this.scoreEl = document.getElementById('hud-score');
    this.coinsEl = document.getElementById('hud-coins');
    this.comboEl = document.getElementById('hud-combo');
    this.packHud = document.getElementById('hud-vibepack');
    this.packBarFill = document.getElementById('pack-bar-fill');
    this.hudShield = document.getElementById('hud-shield');
    this.hudBoost = document.getElementById('hud-boost');

    this.startScreen = document.getElementById('start-screen');
    this.startBest = document.getElementById('start-best');
    this.gameOverScreen = document.getElementById('gameover-screen');
    this.finalScoreEl = document.getElementById('final-score');
    this.finalCoinsEl = document.getElementById('final-coins');

    this.playBtn = document.getElementById('play-btn');
    this.restartBtn = document.getElementById('restart-btn');
    this.homeBtn = document.getElementById('home-btn');
    this.dayNightBtn = document.getElementById('day-night-btn');

    this.muteBtn = document.getElementById('mute-btn');
    this.toast = document.getElementById('toast');
    this._toastTimer = null;

    this.characterScreen = document.getElementById('character-screen');
    this.characterList = document.getElementById('character-list');
    this.characterMenuBtn = document.getElementById('character-menu-btn');
    this.characterBackBtn = document.getElementById('character-back-btn');

    this.testnetScreen = document.getElementById('testnet-screen');
    this.testnetMenuBtn = document.getElementById('testnet-menu-btn');
    this.testnetBackBtn = document.getElementById('testnet-back-btn');
    this.testnetWallet = document.getElementById('testnet-wallet');
    this.testnetNetwork = document.getElementById('testnet-network');
    this.testnetUnconfigured = document.getElementById('testnet-unconfigured');
    this.testnetWrongNetwork = document.getElementById('testnet-wrong-network');
    this.testnetUnavailable = document.getElementById('testnet-unavailable');
    this.testnetUnlocks = document.getElementById('testnet-unlocks');
    this.connectBtn = document.getElementById('connect-wallet-btn');
    this.disconnectBtn = document.getElementById('disconnect-wallet-btn');
    this.switchNetworkBtn = document.getElementById('switch-network-btn');
  }

  onPlay(cb) {
    this.playBtn.addEventListener('click', cb);
  }

  onRestart(cb) {
    this.restartBtn.addEventListener('click', cb);
  }

  onHome(cb) {
    if (this.homeBtn) {
      this.homeBtn.addEventListener('click', cb);
    }
  }

  onDayNightToggle(cb) {
    if (this.dayNightBtn) {
      this.dayNightBtn.addEventListener('click', cb);
    }
  }

  onMuteToggle(cb) {
    this.muteBtn.addEventListener('click', cb);
  }

  onOpenCharacterMenu(cb) {
    this.characterMenuBtn.addEventListener('click', cb);
  }

  onCloseCharacterMenu(cb) {
    this.characterBackBtn.addEventListener('click', cb);
  }

  onOpenTestnetMenu(cb) {
    this.testnetMenuBtn.addEventListener('click', cb);
  }

  onCloseTestnetMenu(cb) {
    this.testnetBackBtn.addEventListener('click', cb);
  }

  onConnectWallet(cb) {
    this.connectBtn.addEventListener('click', cb);
  }

  onDisconnectWallet(cb) {
    this.disconnectBtn.addEventListener('click', cb);
  }

  onSwitchNetwork(cb) {
    this.switchNetworkBtn.addEventListener('click', cb);
  }

  showGameplay() {
    this.startScreen.classList.add('hidden');
    this.gameOverScreen.classList.add('hidden');
    this.characterScreen.classList.add('hidden');
    this.testnetScreen.classList.add('hidden');
    this.hud.classList.remove('hidden');
  }

  showGameOver(score, coins) {
    this.hud.classList.add('hidden');
    this.packHud.classList.add('hidden');

    this.finalScoreEl.textContent =
      String(score).padStart(6, '0');

    this.finalCoinsEl.textContent =
      String(coins).padStart(3, '0');

    this.gameOverScreen.classList.remove('hidden');
  }

  showStart(bestScore) {
    this.gameOverScreen.classList.add('hidden');
    this.characterScreen.classList.add('hidden');
    this.testnetScreen.classList.add('hidden');

    if (bestScore > 0) {
      this.startBest.textContent =
        'BEST: ' + String(bestScore).padStart(6, '0');

      this.startBest.classList.remove('hidden');
    } else {
      this.startBest.classList.add('hidden');
    }

    this.startScreen.classList.remove('hidden');
    this.hud.classList.add('hidden');
  }

  updateScore(score) {
    this.scoreEl.textContent =
      'SCORE: ' + String(score).padStart(6, '0');
  }

  updateCoins(coins) {
    this.coinsEl.textContent =
      'VIBE: ' + String(coins).padStart(3, '0');
  }

  showCombo(combo) {
    if (combo >= 2) {
      this.comboEl.textContent = 'VIBE x' + combo;
      this.comboEl.classList.remove('hidden');
    } else {
      this.comboEl.classList.add('hidden');
    }
  }

  showVibePackBar(fraction) {
    this.packHud.classList.remove('hidden');

    this.packBarFill.style.width =
      Math.max(0, Math.min(1, fraction)) * 100 + '%';
  }

  hideVibePackBar() {
    this.packHud.classList.add('hidden');
  }

  setShieldIcon(active) {
    this.hudShield.classList.toggle('hidden', !active);
  }

  setBoostIcon(active) {
    this.hudBoost.classList.toggle('hidden', !active);
  }

  setMuteIcon(enabled) {
    this.muteBtn.textContent =
      enabled ? '🔊' : '🔇';
  }

  setDayNightIcon(isDay) {
    if (!this.dayNightBtn) return;

    this.dayNightBtn.textContent =
      isDay ? '🌙 NIGHT' : '☀️ DAY';

    this.dayNightBtn.setAttribute(
      'aria-label',
      isDay
        ? 'Switch to night mode'
        : 'Switch to day mode'
    );
  }

  showToast(message) {
    if (this._toastTimer) {
      clearTimeout(this._toastTimer);
    }

    this.toast.textContent = message;
    this.toast.classList.remove('hidden');

    this._toastTimer = setTimeout(() => {
      this.toast.classList.add('hidden');
    }, 2600);
  }

  // --- Character select -----------------------------------------------

  openCharacterMenu(progress, onSelect) {
    this.startScreen.classList.add('hidden');
    this.characterScreen.classList.remove('hidden');
    this.characterList.innerHTML = '';

    for (const character of CHARACTERS) {
      const unlocked =
        isCharacterUnlocked(character, progress);

      const card = document.createElement('button');

      card.className =
        'character-card' +
        (unlocked ? '' : ' locked');

      card.disabled = !unlocked;

      const title = document.createElement('div');

      title.className = 'character-name';
      title.textContent = character.name;

      card.appendChild(title);

      const tagline = document.createElement('div');

      tagline.className = 'character-tagline';

      tagline.textContent =
        unlocked
          ? character.tagline
          : lockReason(character);

      card.appendChild(tagline);

      if (character.id === progress.selectedCharacter) {
        card.classList.add('selected');
      }

      if (unlocked) {
        card.addEventListener('click', () => {
          onSelect(character.id);
        });
      }

      this.characterList.appendChild(card);
    }
  }

  closeCharacterMenu() {
    this.characterScreen.classList.add('hidden');
    this.startScreen.classList.remove('hidden');
  }

  // --- Testnet menu --------------------------------------------------

  openTestnetMenu() {
    this.startScreen.classList.add('hidden');
    this.testnetScreen.classList.remove('hidden');
  }

  closeTestnetMenu() {
    this.testnetScreen.classList.add('hidden');
    this.startScreen.classList.remove('hidden');
  }

  renderTestnetState(wallet, progress) {
    const hasWallet =
      wallet.hasInjectedWallet();

    this.testnetUnavailable.classList.toggle(
      'hidden',
      hasWallet
    );

    this.testnetWallet.textContent =
      wallet.connected
        ? wallet.shortAddress()
        : 'Not Connected';

    this.testnetNetwork.textContent =
      wallet.connected
        ? (
            wallet.correctNetwork
              ? '✓ Connected'
              : 'Wrong Network'
          )
        : 'Not Connected';

    this.testnetUnconfigured.classList.toggle(
      'hidden',
      !wallet.connected || isConfigured()
    );

    this.testnetWrongNetwork.classList.toggle(
      'hidden',
      !(
        wallet.connected &&
        isConfigured() &&
        !wallet.correctNetwork
      )
    );

    this.connectBtn.classList.toggle(
      'hidden',
      wallet.connected
    );

    this.disconnectBtn.classList.toggle(
      'hidden',
      !wallet.connected
    );

    if (wallet.connected) {
      this.testnetUnlocks.classList.remove('hidden');
      this.testnetUnlocks.innerHTML = '';

      for (const rule of UNLOCK_RULES) {
        const row = document.createElement('div');

        row.className = 'unlock-row';

        const unlocked =
          progress.unlockedCharacters.includes(rule.reward) ||
          progress.unlockedPowerUps.includes(rule.reward);

        const requirement =
          rule.type === 'TOKEN_BALANCE'
            ? `${rule.minTokens} $VIBE`
            : rule.type;

        row.textContent =
          (unlocked ? '✓ ' : '🔒 ') +
          rule.id
            .replace(/_/g, ' ')
            .toUpperCase() +
          ' — ' +
          requirement;

        this.testnetUnlocks.appendChild(row);
      }
    } else {
      this.testnetUnlocks.classList.add('hidden');
    }
  }
}

function lockReason(character) {
  if (character.unlock.type === 'UNLOCK_RULE') {
    const rule = UNLOCK_RULES.find(
      (r) => r.id === character.unlock.ruleId
    );

    if (
      rule &&
      rule.type === 'TOKEN_BALANCE'
    ) {
      return `🔒 Hold ${rule.minTokens} $VIBE on testnet`;
    }

    return '🔒 Unlock via TESTNET menu';
  }

  return '🔒 Locked';
}
