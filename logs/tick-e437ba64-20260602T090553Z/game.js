// Neon Escape game with enhanced graphics
// Assumes an existing <canvas id="game"></canvas> in the HTML

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Sound effects
  const collisionSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YRAAAAAA');
  const shieldSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YRAAAAAA');
  const WIDTH = canvas.width = canvas.clientWidth || 400;
  const HEIGHT = canvas.height = canvas.clientHeight || 600;

  // Player (glowing square)
  const player = {
    size: 30,
    x: WIDTH / 2 - 15,
    y: HEIGHT - 60,
    speed: 4,
    invincible: false,
    invincibilityTimer: 0,
      draw() {
        // Neon glow effect
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.invincible ? 'rgba(255,255,0,0.8)' : 'rgba(0,255,255,0.8)';
        ctx.fillStyle = this.invincible ? 'rgba(255,255,0,0.9)' : '#0ff';
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.restore();
      },
    update() {
      if (keys['ArrowLeft']) this.x -= this.speed;
      if (keys['ArrowRight']) this.x += this.speed;
      if (keys['ArrowUp']) this.y -= this.speed;
      if (keys['ArrowDown']) this.y += this.speed;
      // Keep inside canvas
      this.x = Math.max(0, Math.min(WIDTH - this.size, this.x));
      this.y = Math.max(0, Math.min(HEIGHT - this.size, this.y));
      // Invincibility countdown
      if (this.invincibilityTimer > 0) {
        this.invincibilityTimer -= delta;
        if (this.invincibilityTimer <= 0) this.invincible = false;
      }
    }
  };

  // Obstacles (colored bars)
  const bars = [];
  const barHeight = 20;
  let speed = 2; // scrolling speed, increases over time
  let spawnTimer = 0;
  const spawnInterval = 1200; // ms

  // Power‑ups (shields)
  const shields = [];
  const shieldSize = 20;

  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  let lastTime = performance.now();
  let delta = 0;
  let gameOver = false;

  function spawnBar() {
    const bar = {
      x: 0,
      y: -barHeight,
      width: Math.random() * (WIDTH * 0.6) + WIDTH * 0.2,
      height: barHeight,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`
    };
    // random horizontal offset
    bar.x = Math.random() * (WIDTH - bar.width);
    bars.push(bar);
  }

  function spawnShield() {
    const shield = {
      x: Math.random() * (WIDTH - shieldSize),
      y: -shieldSize,
      size: shieldSize,
    };
    shields.push(shield);
  }

  function rectIntersect(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  function update(dt) {
    if (gameOver) return;
    delta = dt / 1000; // seconds
    player.update();

    // move bars
    for (let i = bars.length - 1; i >= 0; i--) {
      const b = bars[i];
      b.y += speed;
      if (b.y > HEIGHT) bars.splice(i, 1);
else if (!player.invincible && rectIntersect(player.x, player.y, player.size, player.size, b.x, b.y, b.width, b.height)) {
          collisionSound.currentTime = 0;
          collisionSound.play();
          gameOver = true;
        }
    }

    // move shields
    for (let i = shields.length - 1; i >= 0; i--) {
      const s = shields[i];
      s.y += speed;
      if (s.y > HEIGHT) shields.splice(i, 1);
else if (rectIntersect(player.x, player.y, player.size, player.size, s.x, s.y, s.size, s.size)) {
          shieldSound.currentTime = 0;
          shieldSound.play();
          player.invincible = true;
          player.invincibilityTimer = 3; // seconds
          shields.splice(i, 1);
        }
    }

    // spawn logic
    spawnTimer += dt;
    if (spawnTimer > spawnInterval) {
      spawnTimer = 0;
      spawnBar();
      // occasional shield (20% chance)
      if (Math.random() < 0.2) spawnShield();
    }

    // gradually increase speed
    speed += dt * 0.00002; // ~0.02 per second
  }

  function draw() {
    // dark neon background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // helper for rounded rectangle
    function roundedRect(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    }

    // draw bars with neon glow and rounded corners
    for (const b of bars) {
      ctx.save();
      ctx.shadowBlur = 15;
      ctx.shadowColor = b.color;
      ctx.fillStyle = b.color;
      roundedRect(b.x, b.y, b.width, b.height, 6);
      ctx.restore();
    }

    // draw shields with pulsating glow
    const time = performance.now() / 1000;
    for (const s of shields) {
      const pulse = 0.5 + 0.5 * Math.sin(time * 5 + s.x);
      ctx.save();
      ctx.shadowBlur = 20 * pulse;
      ctx.shadowColor = 'rgba(255,255,0,0.9)';
      ctx.fillStyle = `rgba(255,255,0,${0.6 + 0.4 * pulse})`;
      ctx.beginPath();
      ctx.arc(s.x + s.size / 2, s.y + s.size / 2, s.size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // draw player (already has glow)
    player.draw();

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#fff';
      ctx.font = '32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2);
    }
  }

  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
