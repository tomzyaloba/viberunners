export const SHIELD_TYPE = 'shield';
export const SPEED_BOOST_TYPE = 'speed';


// =========================================================
// NORMAL POWER-UP DURATIONS
// =========================================================

// Normal shield duration.
//
// Base Runner receives this amount when collecting a shield.
// Testnet characters can multiply it when they start with one.
export const SHIELD_DURATION = 5;


// Normal speed boost duration.
export const SPEED_BOOST_DURATION = 5;


// Speed boost multiplier.
export const SPEED_BOOST_MULTIPLIER = 1.5;


export class PowerUpManager {
  constructor(groundY, gameWidth) {
    this.groundY = groundY;
    this.gameWidth = gameWidth;

    this.powerUps = [];
    this.spawnTimer = 0;
  }


  reset() {
    this.powerUps = [];
    this.spawnTimer = 0;
  }


  update(dt, speed) {
    this.spawnTimer += dt;

    if (this.spawnTimer >= 8) {
      this.spawnTimer = 0;

      const type =
        Math.random() < 0.5
          ? SHIELD_TYPE
          : SPEED_BOOST_TYPE;

      this.powerUps.push({
        x: this.gameWidth + 30,

        y: this.groundY - 70,

        width: 32,
        height: 32,

        type,
      });
    }


    for (const powerUp of this.powerUps) {
      powerUp.x -= speed * dt;
    }


    this.powerUps =
      this.powerUps.filter(
        (powerUp) =>
          powerUp.x + powerUp.width > -50
      );
  }


  draw(ctx) {
    for (const powerUp of this.powerUps) {
      ctx.save();

      const centerX =
        powerUp.x +
        powerUp.width / 2;

      const centerY =
        powerUp.y +
        powerUp.height / 2;


      if (
        powerUp.type === SHIELD_TYPE
      ) {
        // Shield glow.
        ctx.shadowColor = '#22d3ee';
        ctx.shadowBlur = 18;

        ctx.fillStyle = '#00aaff';

        ctx.beginPath();

        ctx.arc(
          centerX,
          centerY,
          powerUp.width / 2,
          0,
          Math.PI * 2
        );

        ctx.fill();

        ctx.shadowBlur = 0;

        ctx.fillStyle = '#ffffff';

        ctx.font =
          'bold 18px Arial';

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.fillText(
          'S',
          centerX,
          centerY
        );

      } else {
        // Speed boost glow.
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 18;

        ctx.fillStyle = '#ffcc00';

        ctx.beginPath();

        ctx.arc(
          centerX,
          centerY,
          powerUp.width / 2,
          0,
          Math.PI * 2
        );

        ctx.fill();

        ctx.shadowBlur = 0;

        ctx.fillStyle = '#ffffff';

        ctx.font =
          'bold 18px Arial';

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.fillText(
          '⚡',
          centerX,
          centerY
        );
      }

      ctx.restore();
    }
  }


  collect(playerBounds) {
    for (
      let i = this.powerUps.length - 1;
      i >= 0;
      i--
    ) {
      const powerUp =
        this.powerUps[i];

      const collision =
        playerBounds.x <
          powerUp.x +
            powerUp.width &&
        playerBounds.x +
          playerBounds.width >
          powerUp.x &&
        playerBounds.y <
          powerUp.y +
            powerUp.height &&
        playerBounds.y +
          playerBounds.height >
          powerUp.y;


      if (collision) {
        const type =
          powerUp.type;

        this.powerUps.splice(
          i,
          1
        );

        return type;
      }
    }

    return null;
  }
}
