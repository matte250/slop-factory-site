// Simple endless‑runner game based on IDEA.md
document.addEventListener('DOMContentLoaded', () => {
  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playExplosion() {
    // quick low‑freq burst
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.4);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  // ----- Config -----
  const shipSize = 30;
  const shipSpeed = 4;
  const asteroidMinR = 15, asteroidMaxR = 30;
  const spawnInterval = 1200; // ms
  const speedIncrease = 0.0005; // per frame

  // ----- State -----
  const ship = { x: 80, y: canvas.height / 2 - shipSize / 2, w: shipSize, h: shipSize };
  const keys = {};
  const asteroids = [];
  const stars = [];
  let lastSpawn = 0;
  let speed = 2;
  let score = 0;
  let gameOver = false;

  // init starfield
  for (let i = 0; i < 150; i++) {
    // size gives star visual size, brightness for color intensity
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      z: Math.random() * 0.5 + 0.5,
      size: Math.random() * 2 + 1,
      brightness: Math.random()
    });
  }

  // input handling
  window.addEventListener('keydown', e => keys[e.key] = true);
  window.addEventListener('keyup', e => keys[e.key] = false);

  function spawnAsteroid() {
    const r = Math.random() * (asteroidMaxR - asteroidMinR) + asteroidMinR;
    const y = Math.random() * (canvas.height - r * 2) + r;
    asteroids.push({ x: canvas.width + r, y, r, speed: speed + 1 });
  }

  function update(dt) {
    // move ship
    if (keys.ArrowUp || keys.w) ship.y -= shipSpeed;
    if (keys.ArrowDown || keys.s) ship.y += shipSpeed;
    if (keys.ArrowLeft || keys.a) ship.x -= shipSpeed;
    if (keys.ArrowRight || keys.d) ship.x += shipSpeed;
    // keep inside canvas
    ship.x = Math.max(0, Math.min(canvas.width - ship.w, ship.x));
    ship.y = Math.max(0, Math.min(canvas.height - ship.h, ship.y));

    // stars
    for (const s of stars) {
      s.x -= speed * s.z;
      if (s.x < 0) { s.x = canvas.width; s.y = Math.random() * canvas.height; }
    }

    // asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed;
      if (a.x + a.r < 0) { asteroids.splice(i, 1); score++; playTone(800, 0.05); }
      // simple box‑circle collision
      const dx = Math.max(ship.x, Math.min(a.x, ship.x + ship.w)) - a.x;
      const dy = Math.max(ship.y, Math.min(a.y, ship.y + ship.h)) - a.y;
      if (dx * dx + dy * dy < a.r * a.r) {
        playExplosion();
        gameOver = true;
      }
    }

    // spawn
    if (performance.now() - lastSpawn > spawnInterval) { spawnAsteroid(); lastSpawn = performance.now(); }
    // increase difficulty
    speed += speedIncrease;
  }

function draw() {
    // dark space background
    ctx.fillStyle = '#001020';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // stars with twinkling effect
    for (const s of stars) {
      // subtle twinkle by varying brightness over time
      const twinkle = Math.sin((performance.now() / 500) + s.x + s.y) * 0.3 + 0.7;
      const brightness = Math.floor(150 + (s.brightness * twinkle) * 105);
      ctx.fillStyle = `rgb(${brightness},${brightness},${brightness})`;
      const size = s.size;
      ctx.fillRect(s.x, s.y, size, size);
    }
    // ship with gradient outline
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x + ship.w, ship.y + ship.h);
    shipGrad.addColorStop(0, '#0f0');
    shipGrad.addColorStop(1, '#060');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h / 2);
    ctx.lineTo(ship.x + ship.w, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // asteroids with radial gradient shading
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#b55');
      grad.addColorStop(1, '#300');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '18px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    // game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ff6';
      ctx.font = '36px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2 - 80, canvas.height / 2);
    }
  }
    // ship (triangle)
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h / 2);
    ctx.lineTo(ship.x + ship.w, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // asteroids
    ctx.fillStyle = '#a33';
    for (const a of asteroids) { ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill(); }
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '18px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    // game over
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '36px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2 - 80, canvas.height / 2);
    }
  }

  let last = 0;
  function loop(ts) {
    if (!last) last = ts;
    const dt = ts - last;
    last = ts;
    if (!gameOver) update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
});
