// game.js – enhanced graphics Canvas Dodger
// The HTML contains <canvas id="game"></canvas>
// This script creates a continuous runner with jump/slide controls.

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // Utility: draw rounded rectangle
  function drawRoundedRect(x, y, w, h, r) {
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
    ctx.fill();
  }
  // Utility: draw a star (simple white circle)
  function drawStar(star) {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fill();
  }
  // Generate simple star field
  const stars = [];
  const STAR_SPEED = 0.3;
  for (let i = 0; i < 80; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height * 0.6,
      r: Math.random() * 1.5 + 0.5,
    });
  }
  // Sound assets (placeholder URLs – replace with actual files)
  const jumpSound = new Audio('jump.mp3');
  const slideSound = new Audio('slide.mp3');
  const crashSound = new Audio('crash.mp3');
  const powerSound = new Audio('power.mp3');
  const stars = [];
  const STAR_SPEED = 0.3;
  for (let i = 0; i < 80; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height * 0.6,
      r: Math.random() * 1.5 + 0.5,
    });
  }
  // Set canvas size (fallback if not styled)
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 400;

  const GRAVITY = 0.6;
  const PLAYER_SPEED = 5;
  const OBSTACLE_SPEED = 4;
  const SPAWN_INTERVAL = 1500; // ms
  const POWERUP_INTERVAL = 8000;

  // Player state
  const player = {
    x: 50,
    y: canvas.height - 60,
    w: 40,
    h: 60,
    vy: 0,
    jumping: false,
    sliding: false,
    color: '#4CAF50',
    draw() {
      // draw player as rounded rectangle with gradient
      const grad = ctx.createLinearGradient(this.x, this.y - this.h, this.x, this.y);
      grad.addColorStop(0, '#66bb6a');
      grad.addColorStop(1, '#2e7d32');
      ctx.fillStyle = grad;
      const drawHeight = this.sliding ? this.h / 2 : this.h;
      const offsetY = this.sliding ? this.h / 2 : 0;
      drawRoundedRect(this.x, this.y - drawHeight + offsetY, this.w, drawHeight, 6);
    },
    update() {
      // Apply gravity
      this.vy += GRAVITY;
      this.y += this.vy;
      // Ground collision
      const groundY = canvas.height - 10;
      if (this.y > groundY) {
        this.y = groundY;
        this.vy = 0;
        this.jumping = false;
        this.sliding = false;
      }
    },
    jump() {
      if (!this.jumping && !this.sliding) {
        this.vy = -12;
        this.jumping = true;
        jumpSound.play();
      }
    },
    slide() {
      if (!this.jumping && !this.sliding) {
        this.sliding = true;
        slideSound.play();
        // stay low for short duration
        setTimeout(() => (this.sliding = false), 500);
      }
    }
  };

  // Obstacles and power‑ups arrays
  const obstacles = [];
  const powerUps = [];

  class Obstacle {
    constructor() {
      this.w = 30 + Math.random() * 20;
      this.h = 30 + Math.random() * 50;
      this.x = canvas.width + this.w;
      this.y = canvas.height - this.h - 10;
      this.speed = OBSTACLE_SPEED + Math.random();
      this.color = '#D32F2F';
    }
    update() { this.x -= this.speed; }
    draw() {
        // obstacle as dark rounded rectangle with subtle gradient
        const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.h);
        grad.addColorStop(0, '#8e0000');
        grad.addColorStop(1, '#b71c1c');
        ctx.fillStyle = grad;
        drawRoundedRect(this.x, this.y, this.w, this.h, 4);
      }
    offscreen() { return this.x + this.w < 0; }
    collides(p) { return !(p.x > this.x + this.w || p.x + p.w < this.x || p.y - p.h > this.y + this.h || p.y < this.y); }
  }

  class PowerUp {
    constructor() {
      this.radius = 12;
      this.x = canvas.width + this.radius;
      this.y = canvas.height - 80 - Math.random() * 100;
      this.speed = OBSTACLE_SPEED * 0.9;
      this.color = '#FFC107';
    }
    update() { this.x -= this.speed; }
    draw() { ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill(); }
    offscreen() { return this.x + this.radius < 0; }
    collides(p) { const px = p.x + p.w / 2; const py = p.y - p.h / 2; const dx = this.x - px; const dy = this.y - py; return Math.hypot(dx, dy) < this.radius + Math.max(p.w, p.h) / 2; }
  }

  let lastSpawn = 0;
  let lastPower = 0;
  let speedBoost = 1;
  let gameOver = false;

  function loop(timestamp) {
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#FFF';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2 - 60, canvas.height / 2);
      return;
    }
    // Fill background with subtle vertical gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#1e3a5f');
  bgGrad.addColorStop(1, '#0a1f33');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Spawn obstacles
    if (timestamp - lastSpawn > SPAWN_INTERVAL / speedBoost) {
      obstacles.push(new Obstacle());
      lastSpawn = timestamp;
    }
    // Spawn power‑ups
    if (timestamp - lastPower > POWERUP_INTERVAL) {
      powerUps.push(new PowerUp());
      lastPower = timestamp;
    }

    // Update and draw obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.update();
      o.draw();
      if (o.offscreen()) obstacles.splice(i, 1);
      else if (o.collides(player)) { gameOver = true; }
    }

    // Update and draw power‑ups
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const p = powerUps[i];
      p.update();
      p.draw();
      if (p.offscreen()) powerUps.splice(i, 1);
      else if (p.collides(player)) {
        speedBoost = Math.min(speedBoost + 0.3, 2);
        setTimeout(() => (speedBoost = 1), 5000);
        powerUps.splice(i, 1);
      }
    }

    // Update player
    player.update();
    player.draw();

    // Ground line
    ctx.fillStyle = '#555';
    ctx.fillRect(0, canvas.height - 10, canvas.width, 10);

    requestAnimationFrame(loop);
  }

  // Input handling – tap/click for jump, long‑press for slide
  let pressTimer = null;
  canvas.addEventListener('mousedown', e => {
    pressTimer = setTimeout(() => player.slide(), 200);
  });
  canvas.addEventListener('mouseup', e => {
    clearTimeout(pressTimer);
    if (!player.sliding) player.jump();
  });
  // Touch equivalents
  canvas.addEventListener('touchstart', e => {
    pressTimer = setTimeout(() => player.slide(), 200);
  });
  canvas.addEventListener('touchend', e => {
    clearTimeout(pressTimer);
    if (!player.sliding) player.jump();
  });

  // Start loop
  requestAnimationFrame(loop);
})();
