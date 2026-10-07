export class ObstacleManager {
  constructor(groundY, gameWidth) {
    this.groundY = groundY;
    this.gameWidth = gameWidth;
    this.obstacles = [];
    this.spawnTimer = 0;
  }

  reset() {
    this.obstacles = [];
    this.spawnTimer = 0;
  }

  update(dt, speed, spawnInterval = 1.7) {
    this.spawnTimer += dt;

    // Spawn a new obstacle
    if (this.spawnTimer >= spawnInterval) {
      this.spawnTimer = 0;

      const width = 30 + Math.random() * 25;
      const height = 40 + Math.random() * 45;

      this.obstacles.push({
        x: this.gameWidth + 30,
        y: this.groundY - height,
        width: width,
        height: height
      });
    }

    // Move obstacles
    for (const obstacle of this.obstacles) {
      obstacle.x -= speed * dt;
    }

    // Remove obstacles that have left the screen
    this.obstacles = this.obstacles.filter(
      obstacle => obstacle.x + obstacle.width > 0
    );
  }

  draw(ctx) {
    for (const obstacle of this.obstacles) {
      ctx.save();

      // Main obstacle
      ctx.fillStyle = "#222";
      ctx.fillRect(
        obstacle.x,
        obstacle.y,
        obstacle.width,
        obstacle.height
      );

      // Highlight
      ctx.fillStyle = "#555";
      ctx.fillRect(
        obstacle.x + 4,
        obstacle.y + 4,
        Math.max(3, obstacle.width * 0.2),
        Math.max(3, obstacle.height - 8)
      );

      ctx.restore();
    }
  }
}
