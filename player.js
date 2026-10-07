// Player: a small original "viber" character (hoodie, visor, sneakers, backpack).
// No copyrighted characters or imagery used anywhere here.
//
// Stat multipliers come from the selected character (characters.js) and are
// applied on top of the same base physics as Phase 1, so every character
// still feels like the same game, just tuned slightly differently.

export class Player {
  constructor(groundY, character) {
    this.width = 44;
    this.height = 60;
    this.x = 80;
    this.baseGravity = 2200; // px/s^2
    this.baseJumpVelocity = -840; // px/s
    this.setCharacter(character);
    this.reset(groundY);
  }

  setCharacter(character) {
    this.character = character;
    this.gravity = this.baseGravity; // flight overrides this per-frame, not here
    this.jumpVelocity = this.baseJumpVelocity * (character?.jumpMul || 1);
  }

  reset(groundY) {
    this.groundY = groundY;
    this.y = groundY - this.height;
    this.vy = 0;
    this.isJumping = false;
    this.runFrame = 0;
    this.runTimer = 0;
    this.isFlying = false;
    this.flightTimer = 0;
    this.flightDuration = 0;
    this.trail = [];
    this.hasShield = false;
  }

  jump() {
    if (this.isFlying) {
      // During flight, "jump" is a small upward thrust instead of a single
      // arc — lets the player steer vertically by tapping repeatedly.
      this.vy = Math.max(this.vy - 420, -520);
      return;
    }
    if (!this.isJumping) {
      this.vy = this.jumpVelocity;
      this.isJumping = true;
    }
  }

  // Called by vibepack.js's pickup logic (via game.js) when a VIBE PACK is
  // collected. durationMs already includes any character boost multiplier.
  startFlight(durationMs) {
    this.isFlying = true;
    this.flightDuration = durationMs;
    this.flightTimer = durationMs;
    this.isJumping = false;
    this.vy = Math.min(this.vy, -200); // small initial lift so it reads as "taking off"
  }

  update(dt) {
    if (this.isFlying) {
      this.flightTimer -= dt * 1000;
      if (this.flightTimer <= 0) {
        this.isFlying = false;
        this.flightTimer = 0;
      }
    }

    const gravity = this.isFlying ? this.baseGravity * 0.3 : this.baseGravity;
    this.vy += gravity * dt;
    this.y += this.vy * dt;

    const floorY = this.groundY - this.height;
    if (this.y >= floorY) {
      this.y = floorY;
      this.vy = 0;
      this.isJumping = false;
      // landing safely always ends flight early rather than letting the
      // player clip into the ground
      if (this.isFlying) {
        this.isFlying = false;
        this.flightTimer = 0;
      }
    }
    // ceiling clamp while flying so the player can't fly off the top of the screen
    if (this.isFlying && this.y < 10) {
      this.y = 10;
      this.vy = Math.max(this.vy, 0);
    }

    if (!this.isJumping && !this.isFlying) {
      this.runTimer += dt;
      if (this.runTimer > 0.1) {
        this.runTimer = 0;
        this.runFrame = (this.runFrame + 1) % 2;
      }
    }

    if (this.isFlying) {
      this.trail.push({ x: this.x, y: this.y + this.height * 0.6, life: 0.4 });
    }
    for (const p of this.trail) p.life -= dt;
    this.trail = this.trail.filter((p) => p.life > 0);
  }

  // Slightly inset hitbox — a hitbox exactly matching the visible sprite
  // feels unfair on near-misses (a classic runner-game gotcha), so collision
  // uses a smaller box than what's drawn.
  getBounds() {
    return {
      x: this.x + 8,
      y: this.y + 6,
      width: this.width - 16,
      height: this.height - 10,
    };
  }

  draw(ctx) {
    const { x, y, width, height } = this;

    if (this.isFlying) {
      for (const p of this.trail) {
        ctx.save();
        ctx.globalAlpha = Math.max(p.life / 0.4, 0) * 0.5;
        ctx.fillStyle = '#39ffce';
        ctx.shadowColor = '#39ffce';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(p.x + width / 2, p.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    if (this.hasShield) {
      ctx.save();
      ctx.strokeStyle = '#22d3ee';
      ctx.shadowColor = '#22d3ee';
      ctx.shadowBlur = 10;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(x + width / 2, y + height / 2, Math.max(width, height) * 0.62, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    const lean = this.isJumping || this.isFlying ? -0.12 : 0;
    ctx.translate(x + width / 2, y + height / 2);
    ctx.rotate(lean);
    ctx.translate(-width / 2, -height / 2);

    // backpack — glows while flying to read as the VIBE PACK being active
    ctx.fillStyle = this.isFlying ? '#39ffce' : '#0d9488';
    if (this.isFlying) {
      ctx.shadowColor = '#39ffce';
      ctx.shadowBlur = 10;
    }
    ctx.fillRect(-5, height * 0.3, 9, height * 0.38);
    ctx.shadowBlur = 0;

    // hoodie body
    ctx.fillStyle = '#7c3aed';
    ctx.beginPath();
    ctx.roundRect(4, height * 0.18, width - 8, height * 0.55, 10);
    ctx.fill();

    // head + visor
    ctx.fillStyle = '#1e1b4b';
    ctx.beginPath();
    ctx.roundRect(8, 0, width - 16, height * 0.3, 8);
    ctx.fill();
    ctx.fillStyle = '#22d3ee';
    ctx.shadowColor = '#22d3ee';
    ctx.shadowBlur = 8;
    ctx.fillRect(width * 0.26, height * 0.1, width * 0.48, height * 0.09);
    ctx.shadowBlur = 0;

    // legs — simple 2-frame run cycle, both planted (no lean) while airborne
    ctx.fillStyle = '#1e1b4b';
    const offset = this.isJumping || this.isFlying ? 4 : (this.runFrame === 0 ? 7 : -7);
    ctx.fillRect(width * 0.22 + offset * 0.4, height * 0.72, width * 0.18, height * 0.26);
    ctx.fillRect(width * 0.58 - offset * 0.4, height * 0.72, width * 0.18, height * 0.26);

    // sneakers
    ctx.fillStyle = '#f472b6';
    ctx.fillRect(width * 0.22 + offset * 0.4 - 2, height * 0.92, width * 0.22, 6);
    ctx.fillRect(width * 0.58 - offset * 0.4 - 2, height * 0.92, width * 0.22, 6);

    ctx.restore();
  }
}
