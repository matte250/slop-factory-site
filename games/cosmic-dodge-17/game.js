// Simple "Cosmic Dodge" game targeting <canvas id="game">.
// Enhanced graphics: starfield background, ship as triangle, gradient asteroids, glowing power‑ups.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  // Audio context for simple sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // ----- Background stars -----
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.5 + 0.5,
    });
  }
  function drawStars() {
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.globalAlpha = s.opacity;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  // ----- Game entities -----
  const ship = {
    x: width / 2,
    y: height - 40,
    w: 30,
    h: 30,
    speed: 4,
    color: '#0af',
  };

  class Asteroid {
    constructor() {
      this.r = Math.random() * 12 + 8; // radius 8‑20
      this.x = Math.random() * width;
      this.y = -this.r;
      this.vx = (Math.random() - 0.5) * 2; // slight horizontal drift
      this.vy = Math.random() * 2 + 1; // fall speed
      this.color = '#777';
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
    }
    draw() {
      // gradient fill for visual depth
      const grad = ctx.createRadialGradient(this.x, this.y, this.r * 0.2, this.x, this.y, this.r);
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, this.color);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fill();
    }
    offScreen() {
      return this.y - this.r > height || this.x + this.r < 0 || this.x - this.r > width;
    }
  }

  class PowerUp {
    constructor() {
      this.r = 6;
      this.x = Math.random() * width;
      this.y = -this.r;
      this.vy = 1.5;
      this.color = '#ff0';
    }
    update() {
      this.y += this.vy;
    }
    draw() {
      // gradient fill for visual depth
      const grad = ctx.createRadialGradient(this.x, this.y, this.r * 0.2, this.x, this.y, this.r);
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, this.color);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fill();
    }
    offScreen() {
      return this.y - this.r > height;
    }
  }

  const asteroids = [];
  const powerUps = [];
  let score = 0;
  let gameOver = false;

  // ----- Input handling -----
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function moveShip() {
    if (keys['ArrowLeft']) ship.x -= ship.speed;
    if (keys['ArrowRight']) ship.x += ship.speed;
    if (keys['ArrowUp']) ship.y -= ship.speed;
    if (keys['ArrowDown']) ship.y += ship.speed;
    // keep inside bounds; leaving bounds triggers loss
    if (ship.x < 0 || ship.x + ship.w > width || ship.y < 0 || ship.y + ship.h > height) {
      gameOver = true;
    }
  }

  function drawShip() {
    // draw ship as a upward‑pointing triangle with glow
    ctx.save();
    ctx.shadowColor = ship.color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.w / 2, ship.y); // tip
    ctx.lineTo(ship.x, ship.y + ship.h); // bottom left
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h); // bottom right
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function detectCollisions() {
    // ship center for easier math
    const cx = ship.x + ship.w / 2;
    const cy = ship.y + ship.h / 2;
    const cr = Math.max(ship.w, ship.h) / 2;
    // asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      const dx = cx - a.x;
      const dy = cy - a.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < (cr + a.r) * (cr + a.r)) {
        gameOver = true;
        // play collision sound (low freq)
        playSound(200, 0.2);
        return;
      }
    }
    // power‑ups
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const p = powerUps[i];
      const dx = cx - p.x;
      const dy = cy - p.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < (cr + p.r) * (cr + p.r)) {
        score++;
        powerUps.splice(i, 1);
        // play collect sound (higher freq)
        playSound(600, 0.1);
      }
    }
  }

  // ----- Game Loop -----
  let lastAsteroid = 0;
  let lastPower = 0;
  function loop(timestamp) {
    // clear and draw background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    drawStars();
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over – Score: ' + score, width / 2, height / 2);
      return;
    }
    ctx.clearRect(0, 0, width, height);

    // spawn asteroids every 800‑ms
    if (timestamp - lastAsteroid > 800) {
      asteroids.push(new Asteroid());
      lastAsteroid = timestamp;
    }
    // spawn power‑ups every 3000‑ms
    if (timestamp - lastPower > 3000) {
      powerUps.push(new PowerUp());
      lastPower = timestamp;
    }

    moveShip();
    drawShip();

    // update/draw asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.update();
      a.draw();
      if (a.offScreen()) asteroids.splice(i, 1);
    }
    // update/draw power‑ups
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const p = powerUps[i];
      p.update();
      p.draw();
      if (p.offScreen()) powerUps.splice(i, 1);
    }

    detectCollisions();

    // score display
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 8, 20);

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
