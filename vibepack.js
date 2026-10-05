// VIBE PACK: a rare flying power-up. This module only owns the pickup
// (spawn/draw/collect) — the actual flight physics live on the player,
// since flight changes gravity/movement which is the player's domain.

export const VIBE_PACK_DURATION = 7000; // ms, per spec — base duration before character boost multipliers

const PICKUP_SIZE = 30;
const SPAWN_CHECK_INTERVAL = 9; // seconds between spawn-chance rolls
const SPAWN_CHANCE = 0.045; // 4.5%, within the spec's 3-6% rare-spawn range
const RETRY_INTERVAL = 1.6; // short recheck if the roll fails, so pickups stay rare but not clumped

export class VibePackManager {
  constructor(groundY, gameWidth) {
    this.groundY = groundY;
    this.gameWidth = gameWidth;
    this.pickup = null;
    this.checkTimer = SPAWN_CHECK_INTERVAL;
  }

  reset() {
    this.pickup = null;
    this.checkTimer = SPAWN_CHECK_INTERVAL;
  }

  update(dt, speed) {
    this.checkTimer -= dt;
    if (this.checkTimer <= 0) {
      if (!this.pickup && Math.random() < SPAWN_CHANCE) {
        this.spawn();
        this.checkTimer = SPAWN_CHECK_INTERVAL;
      } else {
        this.checkTimer = RETRY_INTERVAL;
      }
    }

    if (this.pickup) {
      this.pickup.x -= speed * dt;
      if (this.pickup.x + this.pickup.width < -20) this.pickup = null;
    }
  }

  spawn() {
    // placed at a safe, reachable jump height — never inside an obstacle's
    // exact spawn lane timing, since it's on its own independent track
    this.pickup = {
      x: this.gameWidth + 40,
      y: this.groundY - 150,
      width: PICKUP_SIZE,
      height: PICKUP_SIZE,
    };
  }

  // Returns true if the player's bounds overlap the pickup; removes it.
  collect(playerBounds) {
    if (!this.pickup) return false;
    const p = this.pickup;
    const hit =
      playerBounds.x < p.x + p.width &&
      playerBounds.x + playerBounds.width > p.x &&
      playerBounds.y < p.y + p.height &&
      playerBounds.y + playerBounds.height > p.y;
    if (hit) {
      this.pickup = null;
      return true;
    }
    return false;
  }

  draw(ctx) {
    if (!this.pickup) return;
    const { x, y, width, height } = this.pickup;
    ctx.save();
    ctx.shadowColor = '#7c3aed';
    ctx.shadowBlur = 14;
    ctx.fillStyle = '#a78bfa';
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 8);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#39ffce';
    ctx.fillRect(x + width * 0.3, y + height * 0.15, width * 0.4, height * 0.25);
    ctx.restore();
  }
}
