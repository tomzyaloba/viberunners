export const SHIELD_TYPE = "shield";
export const SPEED_BOOST_TYPE = "speed";

export const SPEED_BOOST_DURATION = 5;
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

    // Spawn a power-up periodically
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
        type
      });
    }

    // Move power-ups
    for (const powerUp of this.powerUps) {
      powerUp.x -= speed * dt;
    }

    // Remove off-screen power-ups
    this.powerUps = this.powerUps.filter(
      powerUp => powerUp.x + powerUp.width > -50
    );
  }

  draw(ctx) {
    for (const powerUp of this.powerUps) {
      ctx.save();

      if (powerUp.type === SHIELD_TYPE) {
        // Shield
        ctx.fillStyle = "#00aaff";

        ctx.beginPath();
        ctx.arc(
          powerUp.x + powerUp.width / 2,
          powerUp.y + powerUp.height / 2,
          powerUp.width / 2,
          0,
          Math.PI * 2
        );
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 18px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          "S",
          powerUp.x + powerUp.width / 2,
          powerUp.y + powerUp.height / 2
        );
      } else {
        // Speed boost
        ctx.fillStyle = "#ffcc00";

        ctx.beginPath();
        ctx.arc(
          powerUp.x + powerUp.width / 2,
          powerUp.y + powerUp.height / 2,
          powerUp.width / 2,
          0,
          Math.PI * 2
        );
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 18px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          "⚡",
          powerUp.x + powerUp.width / 2,
          powerUp.y + powerUp.height / 2
        );
      }

      ctx.restore();
    }
  }

  collect(playerBounds) {
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const powerUp = this.powerUps[i];

      const collision =
        playerBounds.x < powerUp.x + powerUp.width &&
        playerBounds.x + playerBounds.width > powerUp.x &&
        playerBounds.y < powerUp.y + powerUp.height &&
        playerBounds.y + playerBounds.height > powerUp.y;

      if (collision) {
        const type = powerUp.type;

        this.powerUps.splice(i, 1);

        return type;
      }
    }

    return null;
  }
}
```
