export class ObstacleManager {
  constructor(groundY, gameWidth) {
    this.groundY = groundY;
    this.gameWidth = gameWidth;
    this.obstacles = [];
    this.spawnTimer = 0;
  }

  reset() {
    this.obstacles = [];
    // small initial delay so a run never starts with an obstacle already close
    this.spawnTimer = 1.2;
  }

  update(dt, speed, spawnInterval) {
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawn();
      this.spawnTimer = spawnInterval;
    }
    for (const o of this.obstacles) {
      o.x -= speed * dt;
    }
    this.obstacles = this.obstacles.filter((o) => o.x + o.width > -20);
  }

  spawn() {
    const width = 34;
    const height = 46;
    this.obstacles.push({
      x: this.gameWidth + 20,
      y: this.groundY - height,
      width,
      height,
      label: 'RUG',
    });
  }

  draw(ctx) {
    for (const o of this.obstacles) {
      ctx.fillStyle = '#dc2626';
      ctx.strokeStyle = '#450a0a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(o.x, o.y, o.width, o.height, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(o.label, o.x + o.width / 2, o.y + o.height / 2 + 1);
    }
  }
}
