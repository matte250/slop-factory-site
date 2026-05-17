// Simple "Laser Cutter" game implementation
// Canvas with id="game" is assumed to exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id="game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 400;
  const height = canvas.height = canvas.clientHeight || 600;

  // Game settings
  const playerRadius = 10;
  const playerSpeed = 1.5; // pixels per frame (downwards)
  const obstacleSize = 20;
  const obstacleGap = 120; // vertical distance between obstacles
  const obstacleSpawnRate = 1500; // ms
  const laserLength = 30;
  const laserCooldown = 500; // ms

  let lastLaserTime = 0;
  let lastObstacleSpawn = 0;
  let obstacles = [];
  let lasers = [];

  const player = { x: width / 2, y: playerRadius * 2 };

  // Input handling – fire laser on click or spacebar
  const fireLaser = (timestamp) => {
    if (timestamp - lastLaserTime < laserCooldown) return;
    lastLaserTime = timestamp;
    lasers.push({ x: player.x, y: player.y - playerRadius, created: timestamp });
  };
  canvas.addEventListener('click', (e) => fireLaser(performance.now()));
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') fireLaser(performance.now());
  });

  // Game loop
  const update = (timestamp) => {
    // Move player downwards
    player.y += playerSpeed;
    // Wrap to top when reaching bottom (optional) – keep within canvas
    if (player.y - playerRadius > height) player.y = -playerRadius;

    // Spawn obstacles
    if (timestamp - lastObstacleSpawn > obstacleSpawnRate) {
      lastObstacleSpawn = timestamp;
      const xPos = Math.random() * (width - obstacleSize) + obstacleSize / 2;
      obstacles.push({ x: xPos, y: -obstacleSize, alive: true });
    }

    // Move obstacles downwards
    obstacles.forEach(ob => {
      ob.y += playerSpeed;
    });
    // Remove off‑screen obstacles
    obstacles = obstacles.filter(ob => ob.y < height + obstacleSize);

    // Update lasers and check collisions
    lasers = lasers.filter(l => {
      const age = timestamp - l.created;
      if (age > laserCooldown) return false; // laser disappears after cooldown period
      // Check collision with obstacles
      obstacles.forEach(ob => {
        if (ob.alive && Math.abs(l.x - ob.x) < obstacleSize / 2 && l.y - laserLength <= ob.y + obstacleSize / 2) {
          ob.alive = false; // vaporize
        }
      });
      return true;
    });
    // Remove vaporized obstacles
    obstacles = obstacles.filter(ob => ob.alive);

    draw();
    requestAnimationFrame(update);
  };

  const draw = () => {
    ctx.clearRect(0, 0, width, height);
    // Draw player (dot)
    ctx.fillStyle = '#00f';
    ctx.beginPath();
    ctx.arc(player.x, player.y, playerRadius, 0, Math.PI * 2);
    ctx.fill();

    // Draw obstacles
    ctx.fillStyle = '#900';
    obstacles.forEach(ob => {
      ctx.fillRect(ob.x - obstacleSize / 2, ob.y - obstacleSize / 2, obstacleSize, obstacleSize);
    });

    // Draw lasers
    ctx.strokeStyle = '#0ff';
    ctx.lineWidth = 3;
    lasers.forEach(l => {
      ctx.beginPath();
      ctx.moveTo(l.x, l.y);
      ctx.lineTo(l.x, l.y - laserLength);
      ctx.stroke();
    });
  };

  requestAnimationFrame(update);
})();
