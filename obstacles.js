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

  update(dt, speed, spawnInterval = 1.5) {
    this.spawnTimer += dt;

    // Spawn a new obstacle
    if (this.spawnTimer >= spawnInterval) {
      this.spawnTimer = 0;

      const height = 35 + Math.random() * 45;
      const width = 25 + Math.random() * 25;

      this.obstacles.push({
        x: this.gameWidth + 20,
        y: this.groundY - height,
        width,
        height
      });
    }

    // Move obstacles
    for (const obstacle of this.obstacles) {
      obstacle.x -= speed * dt;
    }

    // Remove obstacles that have left the screen
    this.obstacles = this.obstacles.filter(
      obstacle => obstacle.x + obstacle.width > -50
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

      // Simple highlight
      ctx.fillStyle = "#555";
      ctx.fillRect(
        obstacle.x + 4,
        obstacle.y + 4,
        Math.max(4, obstacle.width * 0.2),
        Math.max(4, obstacle.height - 8)
      );

      ctx.restore();
    }
  }
}
