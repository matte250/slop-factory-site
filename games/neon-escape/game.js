// Minimal endless runner for canvas with id="game"
// Neon square player, lane switching, jump, obstacles, orbs, score with enhanced graphics
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Audio setup using Web Audio API
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  // Helper to play a simple tone
  function playTone(freq, duration) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }
  function playJumpSound() { playTone(500, 0.08); }
  function playCollectSound() { playTone(800, 0.05); }
  function playGameOverSound() { playTone(150, 0.5); }

  const WIDTH = canvas.width = canvas.clientWidth || 800;
  const HEIGHT = canvas.height = canvas.clientHeight || 400;

  const LANE_COUNT = 3;
  const LANE_WIDTH = WIDTH / LANE_COUNT;
  const GROUND_Y = HEIGHT - 60; // ground level for player

  // Player definition
  const player = {
    lane: 1, // 0:left,1:center,2:right
    x: 0,
    y: GROUND_Y,
    w: 30,
    h: 30,
    color: '#0ff', // neon cyan
    vy: 0,
    onGround: true,
    shield: false,
    updatePos() { this.x = this.lane * LANE_WIDTH + (LANE_WIDTH - this.w) / 2; },
    jump() { if (this.onGround) { this.vy = -12; this.onGround = false; } },
    switchLane(dir) { // dir = -1 left, +1 right
      const newLane = this.lane + dir;
      if (newLane >= 0 && newLane < LANE_COUNT) this.lane = newLane;
    }
  };
  player.updatePos();

  // Simple entity class for obstacles and orbs
  class Entity {
    constructor(lane, type) {
      this.lane = lane;
      this.x = WIDTH;
      this.y = GROUND_Y;
      this.w = 30;
      this.h = 30;
      this.type = type; // 'obstacle' or 'orb'
      this.baseColor = type === 'obstacle' ? '#f44' : '#ff0';
    }
    update(dt) {
      this.x -= dt * 200; // speed in px/s
    }
    draw() {
      const drawX = this.x + (LANE_WIDTH - this.w) / 2;
      if (this.type === 'obstacle') {
        ctx.save();
        ctx.shadowColor = this.baseColor;
        ctx.shadowBlur = 8;
        ctx.fillStyle = this.baseColor;
        // rounded rectangle for obstacle
        const radius = 6;
        ctx.beginPath();
        ctx.moveTo(drawX + radius, this.y);
        ctx.lineTo(drawX + this.w - radius, this.y);
        ctx.quadraticCurveTo(drawX + this.w, this.y, drawX + this.w, this.y + radius);
        ctx.lineTo(drawX + this.w, this.y + this.h - radius);
        ctx.quadraticCurveTo(drawX + this.w, this.y + this.h, drawX + this.w - radius, this.y + this.h);
        ctx.lineTo(drawX + radius, this.y + this.h);
        ctx.quadraticCurveTo(drawX, this.y + this.h, drawX, this.y + this.h - radius);
        ctx.lineTo(drawX, this.y + radius);
        ctx.quadraticCurveTo(drawX, this.y, drawX + radius, this.y);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else {
        // orb as glowing circle
        ctx.save();
        ctx.shadowColor = this.baseColor;
        ctx.shadowBlur = 12;
        ctx.fillStyle = this.baseColor;
        ctx.beginPath();
        ctx.arc(drawX + this.w / 2, this.y + this.h / 2, this.w / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
    isOffScreen() { return this.x + this.w < 0; }
  }

  let obstacles = [];
  let orbs = [];
  let lastSpawn = 0;
  let score = 0;
  let shieldTimer = 0;

  // Input handling
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') player.switchLane(-1);
    else if (e.key === 'ArrowRight') player.switchLane(1);
    else if (e.key === 'ArrowUp' || e.key === ' ') player.jump();
  });

  // Touch support (simple taps for left/right, swipe up for jump)
  let touchStartX = 0, touchStartY = 0;
  canvas.addEventListener('touchstart', e => {
    const t = e.touches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
  });
  canvas.addEventListener('touchend', e => {
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartX;
    const dy = t.clientY - touchStartY;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 30) player.switchLane(1);
      else if (dx < -30) player.switchLane(-1);
    } else {
      if (dy < -30) player.jump();
    }
  });

  function spawnEntity() {
    const lane = Math.floor(Math.random() * LANE_COUNT);
    const isOrb = Math.random() < 0.2; // 20% chance orb
    if (isOrb) orbs.push(new Entity(lane, 'orb'));
    else obstacles.push(new Entity(lane, 'obstacle'));
  }

  // Star field for background
  const stars = [];
  for (let i = 0; i < 80; i++) {
    stars.push({
      x: Math.random() * WIDTH,
      y: Math.random() * HEIGHT,
      size: Math.random() * 2 + 0.5,
      speed: Math.random() * 30 + 20,
    });
  }

  let lastTime = performance.now();
  function loop(now) {
    const dt = (now - lastTime) / 1000; // seconds
    lastTime = now;

    // Clear with neon gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    bgGrad.addColorStop(0, '#0a0a2a');
    bgGrad.addColorStop(1, '#020212');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Draw moving star field (parallax)
    ctx.fillStyle = '#555';
    stars.forEach(star => {
      star.x -= star.speed * dt;
      if (star.x < 0) star.x = WIDTH;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Update player physics
    player.vy += dt * 30; // gravity
    player.y += player.vy;
    if (player.y >= GROUND_Y) { player.y = GROUND_Y; player.vy = 0; player.onGround = true; }
    player.updatePos();

    // Draw player with neon glow
    ctx.save();
    ctx.shadowColor = player.shield ? '#0ff' : player.color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = player.shield ? '#0ff' : player.color;
    ctx.fillRect(player.x, player.y, player.w, player.h);
    ctx.restore();

    // Spawn entities
    lastSpawn += dt;
    if (lastSpawn > 0.8) { // every 0.8s
      spawnEntity();
      lastSpawn = 0;
    }

    // Update and draw obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.update(dt);
      o.draw();
      // Collision check
      if (o.lane === player.lane && !player.shield) {
        if (player.y + player.h > o.y && player.y < o.y + o.h) {
          // Game over - stop loop
          alert('Game Over! Score: ' + Math.floor(score));
          return;
        }
      }
      if (o.isOffScreen()) obstacles.splice(i, 1);
    }

    // Update and draw orbs
    for (let i = orbs.length - 1; i >= 0; i--) {
      const orb = orbs[i];
      orb.update(dt);
      orb.draw();
      // Collect
      if (orb.lane === player.lane) {
        if (player.y + player.h > orb.y && player.y < orb.y + orb.h) {
          score += 10;
          // 10% chance to grant shield for 3 seconds
          if (Math.random() < 0.1) {
            player.shield = true;
            shieldTimer = 3;
          }
          orbs.splice(i, 1);
        }
      }
      if (orb.isOffScreen()) orbs.splice(i, 1);
    }

    // Shield timer
    if (player.shield) {
      shieldTimer -= dt;
      if (shieldTimer <= 0) player.shield = false;
    }

    // Score display
    ctx.fillStyle = '#fff';
    ctx.font = '20px monospace';
    ctx.fillText('Score: ' + Math.floor(score), 10, 30);

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
