// VIBE Coins: collectible pickups layered on top of the existing obstacle
// stream. Spawned on their own timer/formations so they don't depend on
// obstacle placement, but formations are varied so some coins sit at
// jump height (risk/reward) rather than always being free ground pickups.

const COIN_SIZE = 20;
const COMBO_WINDOW = 1.2; // seconds between collects to keep a combo alive

const FORMATIONS = ['line', 'arc', 'high'];

export class CoinManager {
  constructor(groundY, gameWidth) {
    this.groundY = groundY;
    this.gameWidth = gameWidth;
    this.coins = [];
    this.spawnTimer = 0;
    this.combo = 0;
    this.comboTimer = 0;
  }

  reset() {
    this.coins = [];
    this.spawnTimer = 2.0;
    this.combo = 0;
    this.comboTimer = 0;
  }

  spawn() {
    const formation = FORMATIONS[Math.floor(Math.random() * FORMATIONS.length)];
    const startX = this.gameWidth + 40;
    const count = 4 + Math.floor(Math.random() * 3); // 4-6 coins per group

    for (let i = 0; i < count; i++) {
      let x = startX + i * 46;
      let y;
      if (formation === 'line') {
        y = this.groundY - 70; // reachable while standing, no jump needed
      } else if (formation === 'arc') {
        // a jump-shaped arc peaking in the middle of the group
        const t = i / (count - 1);
        const arcHeight = 150;
        y = this.groundY - 70 - Math.sin(t * Math.PI) * arcHeight;
      } else {
        y = this.groundY - 190; // only reachable by jumping — risk/reward
      }
      this.coins.push({
        x,
        y,
        width: COIN_SIZE,
        height: COIN_SIZE,
        collected: false,
      });
    }
  }

  update(dt, speed, spawnInterval) {
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawn();
      this.spawnTimer = spawnInterval * (1.4 + Math.random() * 0.8);
    }

    for (const c of this.coins) {
      c.x -= speed * dt;
    }
    this.coins = this.coins.filter((c) => c.x + c.width > -20 && !c.collected);

    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 0;
    }
  }

  // Checks collisions against the player's bounds and collects any hit
  // coins. Returns { collectedCount, comboCount, scoreBonus } for the
  // caller to apply to HUD/score/audio.
  collect(playerBounds, coinMultiplier) {
    let collectedCount = 0;
    let scoreBonus = 0;
    for (const c of this.coins) {
      if (c.collected) continue;
      const hit =
        playerBounds.x < c.x + c.width &&
        playerBounds.x + playerBounds.width > c.x &&
        playerBounds.y < c.y + c.height &&
        playerBounds.y + playerBounds.height > c.y;
      if (hit) {
        c.collected = true;
        collectedCount++;
        this.combo++;
        this.comboTimer = COMBO_WINDOW;
        const comboBonus = Math.min(this.combo - 1, 3) * 2; // small, capped bonus
        scoreBonus += Math.round((10 + comboBonus) * coinMultiplier);
      }
    }
    return { collectedCount, comboCount: this.combo, scoreBonus };
  }

  draw(ctx) {
    for (const c of this.coins) {
      if (c.collected) continue;
      const cx = c.x + c.width / 2;
      const cy = c.y + c.height / 2;
      ctx.save();
      ctx.shadowColor = '#ffd23f';
      ctx.shadowBlur = 10;
      const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, c.width / 2);
      grad.addColorStop(0, '#fff7cf');
      grad.addColorStop(1, '#ffd23f');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, c.width / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#b8860b';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }
  }
}
