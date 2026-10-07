// Free, always-available jump-collectible power-ups — no wallet needed.
// Separate from vibepack.js (the rarer flying power-up) so each stays
// simple; both are driven the same way from game.js.

const PICKUP_SIZE = 28;
const SPAWN_CHECK_INTERVAL = 6; // seconds between spawn-chance rolls
const SPAWN_CHANCE = 0.08; // per check, per type — more common than VIBE PACK
const RETRY_INTERVAL = 1.2;

export const SHIELD_TYPE = 'shield';
export const SPEED_BOOST_TYPE = 'speed_boost';
export const SPEED_BOOST_DURATION = 4000; // ms
export const SPEED_BOOST_MULTIPLIER = 1.35;

export class PowerUpManager {
  constructor(groundY, gameWidth) {
    this.groundY = groundY;
    this.gameWidth = gameWidth;
    this.pickups = [];
    this.checkTimer = SPAWN_CHECK_INTERVAL;
  }

  reset() {
    this.pickups = [];
    this.checkTimer = SPAWN_CHECK_INTERVAL;
  }

  update(dt, speed) {
    this.checkTimer -= dt;
    if (this.checkTimer <= 0) {
      this.checkTimer = RETRY_INTERVAL;
      if (Math.random() < SPAWN_CHANCE) {
        this.spawn(Math.random() < 0.5 ? SHIELD_TYPE : SPEED_BOOST_TYPE);
        this.checkTimer = SPAWN_CHECK_INTERVAL;
      }
    }

    for (const p of this.pickups) p.x -= speed * dt;
    this.pickups = this.pickups.filter((p) => p.x + p.width > -20);
  }

  spawn(type) {
    // jump-reachable height, same reasoning as coins' "high" formation
    this.pickups.push({
      type,
      x: this.gameWidth + 40,
      y: this.groundY - (120 + Math.random() * 60),
      width: PICKUP_SIZE,
      height: PICKUP_SIZE,
    });
  }

  // Returns the type of pickup collected (or null), and removes it.
  collect(playerBounds) {
    for (let i = 0; i < this.pickups.length; i++) {
      const p = this.pickups[i];
      const hit =
        playerBounds.x < p.x + p.width &&
        playerBounds.x + playerBounds.width > p.x &&
        playerBounds.y < p.y + p.height &&
        playerBounds.y + playerBounds.height > p.y;
      if (hit) {
        this.pickups.splice(i, 1);
        return p.type;
      }
    }
    return null;
  }

  draw(ctx) {
    for (const p of this.pickups) {
      ctx.save();
      const cx = p.x + p.width / 2;
      const cy = p.y + p.height / 2;
      if (p.type === SHIELD_TYPE) {
        ctx.shadowColor = '#22d3ee';
        ctx.shadowBlur = 12;
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, p.width / 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(34, 211, 238, 0.25)';
        ctx.fill();
      } else {
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.moveTo(cx - 6, cy - 12);
        ctx.lineTo(cx + 8, cy - 2);
        ctx.lineTo(cx, cy - 2);
        ctx.lineTo(cx + 6, cy + 12);
        ctx.lineTo(cx - 8, cy + 1);
        ctx.lineTo(cx, cy + 1);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
  }
}
