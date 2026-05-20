// Simple Asteroid Escape game
// Canvas with id="game" must exist in the HTML
(() => {
  // Create a starfield background
  const starCount = 100;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 0.5 + 0.2
    });
  }
  function updateStars() {
    for (const s of stars) {
      s.y += s.speed;
      if (s.y > height) {
        s.y = 0;
        s.x = Math.random() * width;
      }
    }
  }
  function drawStars() {
    ctx.fillStyle = '#111'; // dark background
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const canvas = document.getElementById('game');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  function playThrust() { playBeep(400, 0.05); }
  function playCollision() { playBeep(100, 0.3); }

  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;

  // Ship definition (triangle)
  const ship = {
    x: width / 2,
    y: height * 0.85,
    size: 20,
    speed: 4,
    dx: 0,
    dy: 0,
    draw() {
      // Ship with gradient and stroke
      const grad = ctx.createLinearGradient(this.x, this.y - this.size, this.x, this.y + this.size);
      grad.addColorStop(0, '#0f0');
      grad.addColorStop(1, '#050');
      ctx.fillStyle = grad;
      ctx.strokeStyle = '#0a0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - this.size);
      ctx.lineTo(this.x - this.size, this.y + this.size);
      ctx.lineTo(this.x + this.size, this.y + this.size);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    },
    update() {
      this.x += this.dx;
      this.y += this.dy;
      // keep inside canvas
      this.x = Math.max(this.size, Math.min(width - this.size, this.x));
    }
  };

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });
  function handleInput() {
    ship.dx = 0;
    ship.dy = 0;
    let moving = false;
    if (keys.ArrowLeft) { ship.dx = -ship.speed; moving = true; }
    if (keys.ArrowRight) { ship.dx = ship.speed; moving = true; }
    if (keys.ArrowUp) { ship.dy = -ship.speed; moving = true; }
    if (keys.ArrowDown) { ship.dy = ship.speed; moving = true; }
    if (moving) playThrust();
  }

  // Asteroid class
  class Asteroid {
    constructor() {
      this.r = Math.random() * 15 + 10;
      this.x = Math.random() * (width - 2 * this.r) + this.r;
      this.y = -this.r;
      this.speed = Math.random() * 2 + 1;
    }
    update() { this.y += this.speed; }
draw() {
        // Asteroid with radial gradient
        const grad = ctx.createRadialGradient(this.x, this.y, this.r * 0.2, this.x, this.y, this.r);
        grad.addColorStop(0, '#ddd');
        grad.addColorStop(1, '#777');
        ctx.fillStyle = grad;
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    offScreen() { return this.y - this.r > height; }
  }

  const asteroids = [];
  let lastSpawn = 0;
  const spawnInterval = 1000; // ms

  // Scoring
  let startTime = performance.now();
  let score = 0;

  function spawnAsteroid(now) {
    if (now - lastSpawn > spawnInterval) {
      asteroids.push(new Asteroid());
      lastSpawn = now;
    }
  }

  function checkCollision(a) {
    const dx = a.x - ship.x;
    const dy = a.y - ship.y;
    const dist = Math.hypot(dx, dy);
    // Approximate ship as circle with radius ship.size
    return dist < a.r + ship.size;
  }

  function update(now) {
    // Update and render background stars
    updateStars();
    drawStars();
    handleInput();
    ship.update();
    ship.draw();

    spawnAsteroid(now);
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.update();
      a.draw();
      if (checkCollision(a)) {
        // Game over with sound
        playCollision();
        alert('Game Over! Score: ' + Math.floor(score));
        // Reset
        asteroids.length = 0;
        startTime = performance.now();
        score = 0;
        return; // stop this frame
      }
      if (a.offScreen()) asteroids.splice(i, 1);
    }
    // Update score based on time survived
    score = (now - startTime) / 1000;
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
    requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
})();
