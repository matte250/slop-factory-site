// Simple Neon Escape game with enhanced graphics
// Canvas element with id="game"
(() => {
  // Load sounds
  const sounds = {
    // Simple beep for power‑up (replace with your own file if desired)
    powerUp: new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YUQAAAAB'),
    // Collision sound
    collision: new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YUQAAAAB')
  };

  // handle high‑DPI screens
  const dpr = window.devicePixelRatio || 1;
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // set canvas size to match CSS size * dpr
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  const width = canvas.width / dpr;
  const height = canvas.height / dpr;


  // Ship
  const ship = {
    x: width / 2,
    y: height - 40,
    size: 20,
    vx: 0,
    vy: 0,
    speed: 3,
    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.fillStyle = '#0ff';
      ctx.beginPath();
      ctx.moveTo(0, -this.size);
      ctx.lineTo(this.size / 2, this.size);
      ctx.lineTo(-this.size / 2, this.size);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    },
    update() {
      this.x = Math.max(this.size, Math.min(width - this.size, this.x + this.vx));
      this.y = Math.max(this.size, Math.min(height - this.size, this.y + this.vy));
    }
  };

  // Obstacles
  const obstacles = [];
  const obstacleFreq = 1500; // ms
  const obstacleSize = 40;
  function spawnObstacle() {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.max(width, height);
    const x = width / 2 + Math.cos(angle) * radius;
    const y = height / 2 + Math.sin(angle) * radius;
    const dir = Math.atan2(height / 2 - y, width / 2 - x);
    obstacles.push({x, y, angle: 0, speed: 1.5, dir, size: obstacleSize});
  }

  // Power‑up to slow obstacles for 3 seconds
  let slowTimer = 0;
  const powerUps = [];
  const powerUpFreq = 10000;
  function spawnPowerUp() {
    const x = Math.random() * (width - 40) + 20;
    const y = Math.random() * (height - 40) + 20;
    powerUps.push({x, y, size: 12, active: true});
  }

  // Timer
  let timeLeft = 30; // seconds
  let lastTime = performance.now();

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {keys[e.key] = true;});
  window.addEventListener('keyup', e => {keys[e.key] = false;});

  function update(dt) {
    // ship controls
    ship.vx = (keys.ArrowLeft ? -1 : 0) + (keys.ArrowRight ? 1 : 0);
    ship.vy = (keys.ArrowUp ? -1 : 0) + (keys.ArrowDown ? 1 : 0);
    ship.vx *= ship.speed;
    ship.vy *= ship.speed;
    ship.update();

    // obstacles movement
    const obstacleSpeedFactor = slowTimer > 0 ? 0.3 : 1;
    obstacles.forEach(o => {
      o.x += Math.cos(o.dir) * o.speed * obstacleSpeedFactor;
      o.y += Math.sin(o.dir) * o.speed * obstacleSpeedFactor;
      o.angle += 0.03;
    });
    // remove off‑screen obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      if (o.x < -o.size || o.x > width + o.size || o.y < -o.size || o.y > height + o.size) {
        obstacles.splice(i, 1);
      }
    }

    // power‑up collection
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const p = powerUps[i];
      const dx = ship.x - p.x, dy = ship.y - p.y;
      if (Math.hypot(dx, dy) < ship.size + p.size) {
slowTimer = 3; // seconds
          // play power‑up sound
          sounds.powerUp.currentTime = 0;
          sounds.powerUp.play();
          powerUps.splice(i, 1);
        }
      }
    }

    // timer
    timeLeft -= dt / 1000;
    if (timeLeft <= 0) timeLeft = 0;

    // collision detection
    for (const o of obstacles) {
      const dx = ship.x - o.x, dy = ship.y - o.y;
      if (Math.hypot(dx, dy) < ship.size + o.size / 2) {
        // Game over – reload page for simplicity
sounds.collision.currentTime = 0;
          sounds.collision.play();
          alert('Game Over');
          document.location.reload();
      }
    }

    // update slow timer
    if (slowTimer > 0) slowTimer -= dt / 1000;
  }

  function draw() {
    // Clear with semi‑transparent overlay for motion blur effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, width, height);

    // Neon gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#002');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Draw obstacles with neon glow
    ctx.save();
    obstacles.forEach(o => {
      ctx.translate(o.x, o.y);
      ctx.rotate(o.angle);
      ctx.shadowColor = '#f0f';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#e0e';
      ctx.fillRect(-o.size / 2, -o.size / 2, o.size, o.size);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    });
    ctx.restore();

    // Power‑ups with pulsating glow
    powerUps.forEach(p => {
      const hue = (performance.now() / 100) % 360;
      ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
      ctx.shadowBlur = 8;
      ctx.fillStyle = `hsl(${hue}, 100%, 70%)`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Ship with neon outline
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 15;
    ship.draw();
    ctx.shadowBlur = 0; // reset for UI

    // UI timer with neon text
    ctx.fillStyle = '#0f0';
    ctx.font = '16px monospace';
    ctx.fillText('Time: ' + timeLeft.toFixed(1), 10, 20);
  }

  // Main loop
  function loop(now) {
    const dt = now - lastTime;
    lastTime = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  // Spawn intervals
  setInterval(spawnObstacle, obstacleFreq);
  setInterval(spawnPowerUp, powerUpFreq);

  requestAnimationFrame(loop);
})();
