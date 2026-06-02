// Simple endless runner based on IDEA.md
// Assumes an HTML canvas with id="game"

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // --- Graphics helpers -------------------------------------------------
  // Starfield background
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 0.5 + 0.2,
    });
  }

  function drawStars() {
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
      s.x -= s.speed;
      if (s.x < 0) s.x = width;
    }
  }

  // Ship (gradient triangle)
  const shipGrad = ctx.createLinearGradient(0, 0, 0, 30);
  shipGrad.addColorStop(0, '#0f0');
  shipGrad.addColorStop(1, '#060');

  // Ship definition
  const ship = {x: 50, y: height / 2, w: 30, h: 20, speed: 4};

  // Asteroids (radial gradient)
  function createAsteroidGradient(size) {
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, size / 2);
    g.addColorStop(0, '#555');
    g.addColorStop(1, '#111');
    return g;
  }

  // Asteroids array
  const asteroids = [];
  const asteroidFreq = 90; // frames
  let frame = 0;

  let score = 0;
  let running = true;
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playBeep(freq, dur) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = 'square';
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + dur);
}

  // Input handling (up/down arrows or w/s)
  const keys = {};
  window.addEventListener('keydown', e => {keys[e.key] = true;});
  window.addEventListener('keyup', e => {keys[e.key] = false;});

  function spawnAsteroid() {
  // Play a subtle spawn sound
  playBeep(120, 0.05);
    const size = Math.random() * 30 + 20;
    asteroids.push({
      x: width,
      y: Math.random() * (height - size),
      w: size,
      h: size,
      speed: 2 + Math.random() * 3,
      grad: createAsteroidGradient(size),
    });
  }

  // Particle effect for explosion
  const particles = [];
  function explode(x, y) {
    for (let i = 0; i < 20; i++) {
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 30 + Math.random() * 20,
        size: Math.random() * 2 + 1,
      });
    }
  }

  function update() {
    if (!running) return;
    frame++;
    // Move ship
    if (keys['ArrowUp'] || keys['w']) ship.y -= ship.speed;
    if (keys['ArrowDown'] || keys['s']) ship.y += ship.speed;
    // Keep within bounds
    if (ship.y < 0) ship.y = 0;
    if (ship.y + ship.h > height) ship.y = height - ship.h;

    // Spawn asteroids
    if (frame % asteroidFreq === 0) spawnAsteroid();

    // Move asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed;
      if (a.x + a.w < 0) asteroids.splice(i, 1);
    }

    // Collision detection
    for (const a of asteroids) {
      if (ship.x < a.x + a.w && ship.x + ship.w > a.x && ship.y < a.y + a.h && ship.y + ship.h > a.y) {
        running = false;
        // Collision sound
        playBeep(200, 0.2);
        explode(ship.x + ship.w / 2, ship.y + ship.h / 2);
        break;
      }
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }

    // Scoring
    score = Math.floor(frame / 60);

    draw();
    if (running) requestAnimationFrame(update);
    else drawGameOver();
  }

  function draw() {
    // Background stars
    drawStars();

    // Ship (gradient triangle)
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h / 2);
    ctx.lineTo(ship.x + ship.w, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();

    // Asteroids (gradient circles)
    for (const a of asteroids) {
      ctx.fillStyle = a.grad;
      ctx.beginPath();
      ctx.arc(a.x + a.w / 2, a.y + a.h / 2, a.w / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Particles (explosion)
    ctx.fillStyle = '#ff0';
    for (const p of particles) {
      ctx.globalAlpha = Math.max(p.life / 40, 0);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
  }

  function drawGameOver() {
    // Dim background
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', width / 2, height / 2 - 20);
    ctx.fillText('Score: ' + score, width / 2, height / 2 + 20);
  }

  // Start loop
  requestAnimationFrame(update);
})();
