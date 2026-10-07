export class ObstacleManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.obstacles = [];
    this.spawnTimer = 0;
    this.spawnInterval = 1200;
    this.speed = 6;
  }

  reset() {
    this.obstacles = [];
    this.spawnTimer = 0;
    this.spawnInterval = 1200;
    this.speed = 6;
  }

  spawn() {
    const width = 40 + Math.random() * 35;
    const height = 40 + Math.random() * 50;

    this.obstacles.push({
      x: this.canvas.width + width,
      y: this.canvas.height - height - 40,
      width,
      height,
      speed: this.speed
    });
  }

  update(deltaTime) {
    this.spawnTimer += deltaTime;

    if (this.spawnTimer >= this.spawnInterval) {
      this.spawn();
      this.spawnTimer = 0;

      if (this.spawnInterval > 650) {
        this.spawnInterval -= 10;
      }

      if (this.speed < 12) {
        this.speed += 0.05;
      }
    }

    for (const obstacle of this.obstacles) {
      obstacle.x -= obstacle.speed;
    }

    this.obstacles = this.obstacles.filter(
      obstacle => obstacle.x + obstacle.width > 0
    );
  }

  draw(ctx) {
    for (const obstacle of this.obstacles) {
      ctx.save();

      ctx.fillStyle = '#222';
      ctx.fillRect(
        obstacle.x,
        obstacle.y,
        obstacle.width,
        obstacle.height
      );

      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        obstacle.x,
        obstacle.y,
        obstacle.width,
        obstacle.height
      );

      ctx.restore();
    }
  }

  getObstacles() {
    return this.obstacles;
  }

  checkCollision(player) {
    const padding = 6;

    for (const obstacle of this.obstacles) {
      if (
        player.x + player.width - padding > obstacle.x &&
        player.x + padding < obstacle.x + obstacle.width &&
        player.y + player.height - padding > obstacle.y &&
        player.y + padding < obstacle.y + obstacle.height
      ) {
        return true;
      }
    }

    return false;
  }
}
