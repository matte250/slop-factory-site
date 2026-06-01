// Simple Neon Wave game
// Canvas with id="game" assumed in HTML
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  // Ship definition
  const ship = {
    width: 30,
    height: 15,
    x: canvas.width / 2 - 15,
    y: canvas.height - 20,
    speed: 4,
    color: '#0ff',
    moveLeft: false,
    moveRight: false,
    update() {
      if (this.moveLeft) this.x -= this.speed;
      if (this.moveRight) this.x += this.speed;
      // Keep ship within canvas bounds
      this.x = Math.max(0, Math.min(this.x, canvas.width - this.width));
    },
    draw() {
      // Neon ship: triangle with glow
      ctx.save();
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + this.height);
      ctx.lineTo(this.x + this.width / 2, this.y);
      ctx.lineTo(this.x + this.width, this.y + this.height);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  };

  // Obstacle definition
  const obstacles = [];
  const obstacleConfig = {
    width: 40,
    height: 20,
    speed: 2,
    spawnInterval: 1200, // ms
    color: '#f0f'
  };

  function spawnObstacle() {
    // Play spawn sound
    playTone(300, 0.08);
    const x = Math.random() * (canvas.width - obstacleConfig.width);
    const y = canvas.height; // start at bottom
    obstacles.push({ x, y, width: obstacleConfig.width, height: obstacleConfig.height });
  }

  function updateObstacles() {
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y -= obstacleConfig.speed; // move up
      if (o.y + o.height < 0) obstacles.splice(i, 1);
    }
  }

  function drawObstacles() {
    // Neon obstacles with glow
    ctx.save();
    ctx.fillStyle = obstacleConfig.color;
    ctx.shadowColor = obstacleConfig.color;
    ctx.shadowBlur = 8;
    obstacles.forEach(o => ctx.fillRect(o.x, o.y, o.width, o.height));
    ctx.restore();
  }

  function checkCollision() {
    for (const o of obstacles) {
      if (
        ship.x < o.x + o.width &&
        ship.x + ship.width > o.x &&
        ship.y < o.y + o.height &&
        ship.y + ship.height > o.y
      ) {
        return true;
      }
    }
    // Lose if ship falls off bottom (shouldn't happen, but keep spec)
    if (ship.y + ship.height > canvas.height) return true;
    return false;
  }

  let gameOver = false;
  function gameLoop() {
    ctx.fillStyle = (() => {
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#001');
  grad.addColorStop(1, '#004');
  return grad;
})();
ctx.fillRect(0, 0, canvas.width, canvas.height);
    ship.update();
    ship.draw();
    updateObstacles();
    drawObstacles();
    if (checkCollision()) {
      gameOver = true;
      ctx.fillStyle = '#f00';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
      return;
    }
    requestAnimationFrame(gameLoop);
  }

  // Input handling
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') ship.moveLeft = true;
    if (e.key === 'ArrowRight') ship.moveRight = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') ship.moveLeft = false;
    if (e.key === 'ArrowRight') ship.moveRight = false;
  });

  // Start spawning obstacles
  const spawnTimer = setInterval(() => {
    if (!gameOver) spawnObstacle();
    else clearInterval(spawnTimer);
  }, obstacleConfig.spawnInterval);

  // Kick off the game
  requestAnimationFrame(gameLoop);
})();
