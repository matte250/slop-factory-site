// Nebula Runner – minimal endless runner
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // --- Player ---
  const player = {
    x: 50,
    y: height / 2 - 10,
    w: 20,
    h: 20,
    speedY: 0,
    color: '#0ff',
    update() {
      this.y += this.speedY;
      // keep within vertical bounds (lose if out)
      if (this.y < 0 || this.y + this.h > height) this.dead = true;
    },
    draw() {
      // draw a simple triangular ship
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + this.h / 2);
      ctx.lineTo(this.x + this.w, this.y);
      ctx.lineTo(this.x + this.w, this.y + this.h);
      ctx.closePath();
      ctx.fill();
    },
    dead: false,
  };

  // --- Obstacles ---
  const obstacles = [];
  const obstacleSettings = {
    spawnInterval: 1500, // ms
    lastSpawn: 0,
    speedX: 3,
    minSize: 15,
    maxSize: 40,
  };

  function spawnObstacle() {
    const size = Math.random() * (obstacleSettings.maxSize - obstacleSettings.minSize) + obstacleSettings.minSize;
    obstacles.push({
      x: width,
      y: Math.random() * (height - size),
      w: size,
      h: size,
      color: '#f44',
    });
  }

  // --- Background stars ---
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 2 + 1,
      speed: Math.random() * 0.5 + 0.2,
    });
  }
  function updateStars() {
    for (const s of stars) {
      s.x -= s.speed;
      if (s.x < 0) {
        s.x = width;
        s.y = Math.random() * height;
      }
    }
  }
  function drawStars() {
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // --- Input handling ---
  const keys = {};
  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, length) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + length);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + length);
  }
  function playThrust() { playTone(600, 0.07); }
  function playCollision() { playTone(120, 0.3); }
  window.addEventListener('keydown', e => {
    if (['ArrowUp', 'KeyW'].includes(e.code)) { keys.up = true; playThrust(); }
    if (['ArrowDown', 'KeyS'].includes(e.code)) { keys.down = true; playThrust(); }
    if (e.code === 'Space' && gameOver) restart();
  });
  window.addEventListener('keyup', e => {
    if (e.code === 'ArrowUp' || e.code === 'KeyW') keys.up = false;
    if (e.code === 'ArrowDown' || e.code === 'KeyS') keys.down = false;
  });

  // --- Game loop ---
  let lastTime = 0;
  let gameOver = false;

  function loop(timestamp) {
    const delta = timestamp - lastTime;
    lastTime = timestamp;
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over – Press Space to Restart', width / 2, height / 2);
      return;
    }

    // background
    // draw nebula gradient
    const nebula = ctx.createLinearGradient(0, 0, 0, height);
    nebula.addColorStop(0, '#001');
    nebula.addColorStop(1, '#004');
    ctx.fillStyle = nebula;
    ctx.fillRect(0, 0, width, height);
    // stars twinkle slightly
    updateStars();
    drawStars();

    // player movement
    player.speedY = 0;
    if (keys.up) player.speedY = -4;
    if (keys.down) player.speedY = 4;
    player.update();
    player.draw();

    // obstacles
    if (timestamp - obstacleSettings.lastSpawn > obstacleSettings.spawnInterval) {
      spawnObstacle();
      obstacleSettings.lastSpawn = timestamp;
    }
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= obstacleSettings.speedX;
      // draw with radial gradient for depth
      const grad = ctx.createRadialGradient(
        o.x + o.w / 2,
        o.y + o.h / 2,
        o.w * 0.1,
        o.x + o.w / 2,
        o.y + o.h / 2,
        o.w / 2
      );
      grad.addColorStop(0, '#fff');
      grad.addColorStop(1, o.color);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(o.x + o.w / 2, o.y + o.h / 2, o.w / 2, 0, Math.PI * 2);
      ctx.fill();
      // collision
if (!player.dead &&
            player.x < o.x + o.w &&
            player.x + player.w > o.x &&
            player.y < o.y + o.h &&
            player.y + player.h > o.y) {
        playCollision();
        player.dead = true;
      }
      // remove off‑screen
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }

    if (player.dead) gameOver = true;
    requestAnimationFrame(loop);
  }

  function restart() {
    // reset state
    player.y = height / 2 - 10;
    player.dead = false;
    obstacles.length = 0;
    gameOver = false;
    lastTime = performance.now();
    requestAnimationFrame(loop);
  }

  // start
  requestAnimationFrame(loop);
})();
