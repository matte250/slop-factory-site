// Simple side‑scrolling Space Courier game
// Canvas element id="game"

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }
  function playThrust() { playSound(600, 0.1); }
  function playScore() { playSound(800, 0.07); }
  function playCrash() { playSound(200, 0.3); }
  const H = canvas.height = canvas.clientHeight || 400;
  // Generate static star field
  const stars = [];
  for (let i = 0; i < 150; i++) {
    stars.push({ x: Math.random() * W, y: Math.random() * H });
  }

  // Game state
  let score = 0;
  let gameOver = false;

  // Ship definition
  const ship = {
    x: 80,
    y: H / 2,
    w: 20,
    h: 20,
    vy: 0,
    thrust: -2.5,
    gravity: 0.3,
    draw() {
      // Ship as a cyan triangle with gradient shading
      ctx.save();
      const grad = ctx.createLinearGradient(this.x, this.y, this.x + this.w, this.y + this.h);
      grad.addColorStop(0, '#0ff');
      grad.addColorStop(1, '#006');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + this.h);
      ctx.lineTo(this.x, this.y);
      ctx.lineTo(this.x + this.w, this.y + this.h / 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    },
    update() {
      this.vy += this.gravity;
      this.y += this.vy;
    }
  };

  // Platform list – moving left
  const platforms = [];
  const PLATFORM_SPEED = 2;
  function spawnPlatform() {
    const w = 80;
    const h = 10;
    const x = W + Math.random() * 200;
    const y = Math.random() * (H - 100) + 50;
    platforms.push({ x, y, w, h });
  }

  // Asteroid list – moving left
  const asteroids = [];
  const ASTEROID_SPEED = 2.5;
  function spawnAsteroid() {
    const r = 15 + Math.random() * 10;
    const x = W + Math.random() * 200;
    const y = Math.random() * (H - r * 2) + r;
    asteroids.push({ x, y, r });
  }

  // Input handling – space to thrust
  window.addEventListener('keydown', e => {
    // Ensure audio context is running
    if (audioCtx.state !== 'running') audioCtx.resume();
    if (e.code === 'Space') {
      ship.vy = ship.thrust;
      playThrust();
    }
  });

  // Simple collision helpers
  function rectIntersect(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }
  function circleRectIntersect(circle, rect) {
    const distX = Math.abs(circle.x - rect.x - rect.w / 2);
    const distY = Math.abs(circle.y - rect.y - rect.h / 2);
    if (distX > rect.w / 2 + circle.r) return false;
    if (distY > rect.h / 2 + circle.r) return false;
    if (distX <= rect.w / 2) return true;
    if (distY <= rect.h / 2) return true;
    const dx = distX - rect.w / 2;
    const dy = distY - rect.h / 2;
    return dx * dx + dy * dy <= circle.r * circle.r;
  }

  // Main loop
  // Helper to draw rounded rectangles
function roundRect(x, y, w, h, r) {
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

function loop() {
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.fillText(`Game Over – Score: ${score}`, W / 2 - 120, H / 2);
      return;
    }

    // Draw background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    // Stars
    ctx.fillStyle = '#777';
    stars.forEach(s => {
      ctx.fillRect(s.x, s.y, 1, 1);
    });
    // Clear remaining area (none needed)

    // Update ship
    ship.update();
    ship.draw();

    // Spawn platforms / asteroids periodically
    if (Math.random() < 0.02) spawnPlatform();
    if (Math.random() < 0.015) spawnAsteroid();

    // Update and draw platforms
    ctx.fillStyle = '#8f8';
    platforms.forEach(p => {
      p.x -= PLATFORM_SPEED;
      // Platform as rounded rectangle with gradient shading
      const grad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h);
      grad.addColorStop(0, '#8f8');
      grad.addColorStop(1, '#484');
      ctx.fillStyle = grad;
      roundRect(p.x, p.y, p.w, p.h, 4);
      // Delivery detection – when ship lands on top of a platform
      if (ship.vy > 0 &&
          ship.x + ship.w > p.x && ship.x < p.x + p.w &&
          ship.y + ship.h >= p.y && ship.y + ship.h - ship.vy < p.y) {
        score++;
        playScore();
        ship.y = p.y - ship.h; // snap to platform
        ship.vy = 0;
      }
    });
    // Remove off‑screen platforms
    while (platforms.length && platforms[0].x + platforms[0].w < 0) platforms.shift();

    // Update and draw asteroids
    ctx.fillStyle = '#a44';
    asteroids.forEach(a => {
      a.x -= ASTEROID_SPEED;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
      // Collision with ship – end game
      if (circleRectIntersect({ x: ship.x + ship.w / 2, y: ship.y + ship.h / 2, r: Math.max(ship.w, ship.h) / 2 }, { x: a.x - a.r, y: a.y - a.r, w: a.r * 2, h: a.r * 2 })) {
        playCrash();
        gameOver = true;
      }
    });
    while (asteroids.length && asteroids[0].x + asteroids[0].r < 0) asteroids.shift();

    // Lose condition – ship out of bounds
    if (ship.y < -ship.h || ship.y > H) playCrash();
        gameOver = true;

    // Score display
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText(`Score: ${score}`, 10, 20);

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
