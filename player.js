// Player: original VIBE RUNNER character.
//
// The player automatically receives the special starting loadout of the
// selected character.
//
// Base Runner:
//   - no starting power-up
//
// Testnet Runner:
//   - 3x normal shield duration
//
// Spark Agent:
//   - 3x normal VIBE PACK duration
//
// Vibe Builder:
//   - 4x shield duration
//   - 4x VIBE PACK duration
//
// Each testnet character also has a more detailed premium visual design.

export class Player {
  constructor(groundY, character) {
    this.width = 44;
    this.height = 60;

    this.x = 80;

    this.baseGravity = 2200;
    this.baseJumpVelocity = -840;

    this.setCharacter(character);

    this.reset(groundY);
  }


  setCharacter(character) {
    this.character = character;

    this.gravity =
      this.baseGravity;

    this.jumpVelocity =
      this.baseJumpVelocity *
      (character?.jumpMul || 1);
  }


  reset(groundY) {
    this.groundY = groundY;

    this.y =
      groundY -
      this.height;

    this.vy = 0;

    this.isJumping = false;

    this.runFrame = 0;
    this.runTimer = 0;

    this.isFlying = false;

    this.flightTimer = 0;
    this.flightDuration = 0;

    this.shieldTimer = 0;

    this.trail = [];

    this.hasShield = false;

    // Apply the selected character's special starting loadout.
    this.applyStartingLoadout();
  }


  applyStartingLoadout() {
    const character =
      this.character;

    if (!character) {
      return;
    }


    // -------------------------
    // STARTING SHIELD
    // -------------------------

    const shieldMultiplier =
      character.startShieldMul || 0;

    if (shieldMultiplier > 0) {
      this.hasShield = true;

      this.shieldTimer =
        shieldMultiplier;
    }


    // -------------------------
    // STARTING VIBE PACK
    // -------------------------

    const flightMultiplier =
      character.startFlightMul || 0;

    if (flightMultiplier > 0) {
      this.startFlightByMultiplier(
        flightMultiplier
      );
    }
  }


  startShield(durationSeconds) {
    this.hasShield = true;

    this.shieldTimer =
      Math.max(
        0,
        durationSeconds
      );
  }


  updateShield(dt) {
    if (!this.hasShield) {
      this.shieldTimer = 0;
      return;
    }

    this.shieldTimer -= dt;

    if (this.shieldTimer <= 0) {
      this.shieldTimer = 0;
      this.hasShield = false;
    }
  }


  jump() {
    if (this.isFlying) {
      // During flight, tapping gives the player upward thrust.
      this.vy =
        Math.max(
          this.vy - 420,
          -520
        );

      return;
    }


    if (!this.isJumping) {
      this.vy =
        this.jumpVelocity;

      this.isJumping = true;
    }
  }


  startFlight(durationMs) {
    this.isFlying = true;

    this.flightDuration =
      durationMs;

    this.flightTimer =
      durationMs;

    this.isJumping = false;

    this.vy =
      Math.min(
        this.vy,
        -200
      );
  }


  startFlightByMultiplier(
    multiplier
  ) {
    const baseDuration =
      5000;

    this.startFlight(
      baseDuration *
        multiplier
    );
  }


  update(dt) {
    // Shield countdown.
    this.updateShield(dt);


    // Flight countdown.
    if (this.isFlying) {
      this.flightTimer -=
        dt * 1000;

      if (
        this.flightTimer <= 0
      ) {
        this.isFlying = false;

        this.flightTimer = 0;
      }
    }


    const gravity =
      this.isFlying
        ? this.baseGravity * 0.3
        : this.baseGravity;


    this.vy +=
      gravity * dt;

    this.y +=
      this.vy * dt;


    const floorY =
      this.groundY -
      this.height;


    if (
      this.y >= floorY
    ) {
      this.y = floorY;

      this.vy = 0;

      this.isJumping = false;

      // Flight ends when landing.
      if (this.isFlying) {
        this.isFlying = false;
        this.flightTimer = 0;
      }
    }


    // Ceiling clamp during flight.
    if (
      this.isFlying &&
      this.y < 10
    ) {
      this.y = 10;

      this.vy =
        Math.max(
          this.vy,
          0
        );
    }


    if (
      !this.isJumping &&
      !this.isFlying
    ) {
      this.runTimer += dt;

      if (
        this.runTimer > 0.1
      ) {
        this.runTimer = 0;

        this.runFrame =
          (this.runFrame + 1) %
          2;
      }
    }


    // Flight trail.
    if (this.isFlying) {
      this.trail.push({
        x: this.x,
        y:
          this.y +
          this.height *
            0.6,
        life: 0.4,
      });
    }


    for (
      const p of this.trail
    ) {
      p.life -= dt;
    }


    this.trail =
      this.trail.filter(
        (p) =>
          p.life > 0
      );
  }


  getBounds() {
    return {
      x:
        this.x + 8,

      y:
        this.y + 6,

      width:
        this.width - 16,

      height:
        this.height - 10,
    };
  }


  draw(ctx) {
    const {
      x,
      y,
      width,
      height,
    } = this;

    const visual =
      this.character?.visual || {
        primary: '#7c3aed',
        secondary: '#22d3ee',
        accent: '#f472b6',
        visor: '#22d3ee',
        trail: '#39ffce',
        aura: '#7c3aed',
        premium: false,
      };


    // =====================================================
    // FLIGHT TRAIL
    // =====================================================

    if (this.isFlying) {
      for (
        const p of this.trail
      ) {
        ctx.save();

        ctx.globalAlpha =
          Math.max(
            p.life / 0.4,
            0
          ) * 0.55;

        ctx.fillStyle =
          visual.trail;

        ctx.shadowColor =
          visual.trail;

        ctx.shadowBlur = 14;

        ctx.beginPath();

        ctx.arc(
          p.x +
            width / 2,
          p.y,
          visual.premium
            ? 8
            : 6,
          0,
          Math.PI * 2
        );

        ctx.fill();

        ctx.restore();
      }
    }


    // =====================================================
    // PREMIUM AURA
    // =====================================================

    if (visual.premium) {
      ctx.save();

      ctx.globalAlpha =
        this.isFlying
          ? 0.28
          : 0.16;

      ctx.fillStyle =
        visual.aura;

      ctx.shadowColor =
        visual.aura;

      ctx.shadowBlur =
        this.isFlying
          ? 28
          : 18;

      ctx.beginPath();

      ctx.ellipse(
        x + width / 2,
        y + height / 2,
        width * 0.68,
        height * 0.68,
        0,
        0,
        Math.PI * 2
      );

      ctx.fill();

      ctx.restore();
    }


    // =====================================================
    // SHIELD
    // =====================================================

    if (this.hasShield) {
      ctx.save();

      const shieldPulse =
        1 +
        Math.sin(
          performance.now() *
            0.006
        ) *
          0.04;

      ctx.strokeStyle =
        visual.secondary ||
        '#22d3ee';

      ctx.shadowColor =
        visual.secondary ||
        '#22d3ee';

      ctx.shadowBlur =
        visual.premium
          ? 20
          : 10;

      ctx.lineWidth =
        visual.premium
          ? 3.5
          : 2.5;

      ctx.beginPath();

      ctx.arc(
        x + width / 2,
        y + height / 2,
        Math.max(
          width,
          height
        ) *
          0.62 *
          shieldPulse,
        0,
        Math.PI * 2
      );

      ctx.stroke();


      if (
        visual.premium
      ) {
        ctx.globalAlpha =
          0.2;

        ctx.fillStyle =
          visual.secondary;

        ctx.fill();

        ctx.globalAlpha =
          1;
      }

      ctx.restore();
    }


    // =====================================================
    // CHARACTER BODY
    // =====================================================

    ctx.save();

    const lean =
      this.isJumping ||
      this.isFlying
        ? -0.12
        : 0;

    ctx.translate(
      x + width / 2,
      y + height / 2
    );

    ctx.rotate(lean);

    ctx.translate(
      -width / 2,
      -height / 2
    );


    // =====================================================
    // BACKPACK
    // =====================================================

    ctx.fillStyle =
      this.isFlying
        ? visual.trail
        : visual.secondary;

    if (
      this.isFlying
    ) {
      ctx.shadowColor =
        visual.trail;

      ctx.shadowBlur =
        visual.premium
          ? 18
          : 10;
    }

    ctx.fillRect(
      -5,
      height * 0.3,
      9,
      height * 0.38
    );

    ctx.shadowBlur = 0;


    // Premium backpack details.
    if (
      visual.premium
    ) {
      ctx.fillStyle =
        visual.accent;

      ctx.fillRect(
        -7,
        height * 0.34,
        3,
        height * 0.24
      );

      ctx.fillRect(
        4,
        height * 0.34,
        3,
        height * 0.24
      );
    }


    // =====================================================
    // HOODIE / ARMOR BODY
    // =====================================================

    ctx.fillStyle =
      visual.primary;

    ctx.beginPath();

    ctx.roundRect(
      4,
      height * 0.18,
      width - 8,
      height * 0.55,
      visual.premium
        ? 8
        : 10
    );

    ctx.fill();


    // Premium chest armor.
    if (
      visual.armor
    ) {
      ctx.fillStyle =
        visual.secondary;

      ctx.globalAlpha =
        0.75;

      ctx.beginPath();

      ctx.roundRect(
        width * 0.28,
        height * 0.32,
        width * 0.44,
        height * 0.22,
        4
      );

      ctx.fill();

      ctx.globalAlpha = 1;


      // Center energy strip.
      ctx.fillStyle =
        visual.accent;

      ctx.shadowColor =
        visual.accent;

      ctx.shadowBlur = 8;

      ctx.fillRect(
        width * 0.47,
        height * 0.34,
        width * 0.06,
        height * 0.18
      );

      ctx.shadowBlur = 0;
    }


    // =====================================================
    // HEAD
    // =====================================================

    ctx.fillStyle =
      visual.premium
        ? '#172554'
        : '#1e1b4b';

    ctx.beginPath();

    ctx.roundRect(
      8,
      0,
      width - 16,
      height * 0.3,
      8
    );

    ctx.fill();


    // Premium helmet top.
    if (
      visual.premium
    ) {
      ctx.fillStyle =
        visual.secondary;

      ctx.globalAlpha =
        0.65;

      ctx.beginPath();

      ctx.roundRect(
        12,
        -3,
        width - 24,
        8,
        4
      );

      ctx.fill();

      ctx.globalAlpha = 1;
    }


    // =====================================================
    // VISOR
    // =====================================================

    ctx.fillStyle =
      visual.visor;

    ctx.shadowColor =
      visual.visor;

    ctx.shadowBlur =
      visual.premium
        ? 14
        : 8;

    ctx.fillRect(
      width * 0.26,
      height * 0.1,
      width * 0.48,
      height * 0.09
    );

    ctx.shadowBlur = 0;


    // =====================================================
    // ENERGY CORE
    // =====================================================

    if (
      visual.energyCore
    ) {
      ctx.fillStyle =
        visual.accent;

      ctx.shadowColor =
        visual.accent;

      ctx.shadowBlur = 12;

      ctx.beginPath();

      ctx.arc(
        width / 2,
        height * 0.43,
        4,
        0,
        Math.PI * 2
      );

      ctx.fill();

      ctx.shadowBlur = 0;
    }


    // =====================================================
    // LEGS
    // =====================================================

    ctx.fillStyle =
      visual.premium
        ? '#172554'
        : '#1e1b4b';

    const offset =
      this.isJumping ||
      this.isFlying
        ? 4
        : this.runFrame === 0
          ? 7
          : -7;


    ctx.fillRect(
      width * 0.22 +
        offset * 0.4,
      height * 0.72,
      width * 0.18,
      height * 0.26
    );

    ctx.fillRect(
      width * 0.58 -
        offset * 0.4,
      height * 0.72,
      width * 0.18,
      height * 0.26
    );


    // =====================================================
    // SNEAKERS
    // =====================================================

    ctx.fillStyle =
      visual.accent;

    ctx.shadowColor =
      visual.premium
        ? visual.accent
        : 'transparent';

    ctx.shadowBlur =
      visual.premium
        ? 8
        : 0;


    ctx.fillRect(
      width * 0.22 +
        offset * 0.4 -
        2,
      height * 0.92,
      width * 0.22,
      6
    );

    ctx.fillRect(
      width * 0.58 -
        offset * 0.4 -
        2,
      height * 0.92,
      width * 0.22,
      6
    );


    ctx.shadowBlur = 0;


    // =====================================================
    // VIBE BUILDER CROWN / ELITE MARK
    // =====================================================

    if (
      visual.crown
    ) {
      ctx.fillStyle =
        visual.accent;

      ctx.shadowColor =
        visual.accent;

      ctx.shadowBlur = 12;

      ctx.beginPath();

      ctx.moveTo(
        width * 0.28,
        -4
      );

      ctx.lineTo(
        width * 0.38,
        -11
      );

      ctx.lineTo(
        width * 0.5,
        -4
      );

      ctx.lineTo(
        width * 0.62,
        -11
      );

      ctx.lineTo(
        width * 0.72,
        -4
      );

      ctx.closePath();

      ctx.fill();

      ctx.shadowBlur = 0;
    }


    ctx.restore();
  }
}
