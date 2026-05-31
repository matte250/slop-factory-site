// Simple side‑scrolling game based on IDEA.md
// Canvas must exist with id="game"

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 400;

  // ==== Audio ====
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration, type = 'sine') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.3, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  function playCollect() { playTone(800, 100, 'triangle'); }
  function playHit() { playTone(200, 150, 'sawtooth'); }
  function playBoost() { playTone(1200, 80, 'square'); }
  function playGameOver() { playTone(100, 500, 'sine'); }

  // ==== Game objects ====
  const ship = { x: 80, y: canvas.height / 2, w: 30, h: 20, vy: 0, speed: 2, boost: false, health: 3 };
  const stars = []; // background stars
  const STAR_SPEED = 0.3; // speed of starfield movement
  // create starfield
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 1,
    });
  }
  const parcels = [];
  const asteroids = [];
  let score = 0;
  let lastParcel = 0;
  let lastAsteroid = 0;
  let gameOver = false;
  const SPAWN_INTERVAL = 2000; // ms
  const ASTEROID_INTERVAL = 1500;

  // ==== Input handling ====
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    // Ensure audio context is resumed on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (e.key === ' ') {
      ship.boost = true;
      playBoost();
    }
  });
  window.addEventListener('keyup', e => {
    keys[e.key] = false;
    if (e.key === ' ') ship.boost = false;
  });

  // ==== Utility ====
  const rectIntersect = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  function spawnParcel() {
    parcels.push({ x: canvas.width, y: Math.random() * (canvas.height - 15), w: 15, h: 15, vx: -2 });
  }
  function spawnAsteroid() {
    const size = 20 + Math.random() * 20;
    asteroids.push({ x: canvas.width, y: Math.random() * (canvas.height - size), w: size, h: size, vx: -3 - Math.random() * 2 });
  }

  // ==== Main loop ====
  function update(dt) {
    // Ship movement
    ship.vy = 0;
    if (keys['ArrowUp']) ship.vy = -ship.speed;
    if (keys['ArrowDown']) ship.vy = ship.speed;
    if (ship.boost) ship.vy *= 1.5;
    ship.y = Math.max(0, Math.min(canvas.height - ship.h, ship.y + ship.vy));

    // Background starfield movement
    stars.forEach(s => {
      s.x -= STAR_SPEED;
      if (s.x < 0) {
        s.x = canvas.width;
        s.y = Math.random() * canvas.height;
      }
    });

    // Spawn parcels / asteroids
    const now = performance.now();
    if (now - lastParcel > SPAWN_INTERVAL) { spawnParcel(); lastParcel = now; }
    if (now - lastAsteroid > ASTEROID_INTERVAL) { spawnAsteroid(); lastAsteroid = now; }

    // Move parcels
    for (let i = parcels.length - 1; i >= 0; i--) {
      const p = parcels[i];
      p.x += p.vx;
      // collection
      if (rectIntersect(ship, p)) { score++; playCollect(); parcels.splice(i, 1); continue; }
      // off‑screen discard
      if (p.x + p.w < 0) parcels.splice(i, 1);
    }

    // Move asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx;
      // ship collision
      if (rectIntersect(ship, a)) { ship.health--; playHit(); asteroids.splice(i, 1); continue; }
      // parcel‑asteroid collision (lose condition)
      for (let j = parcels.length - 1; j >= 0; j--) {
        if (rectIntersect(asteroids[i], parcels[j])) { ship.health = 0; }
      }
      if (a.x + a.w < 0) asteroids.splice(i, 1);
    }
  }

  function draw() {
    // ---- Background ----
    // starfield (simple twinkling stars)
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#444';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // ---- Ship ----
    ctx.save();
    ctx.translate(ship.x + ship.w / 2, ship.y + ship.h / 2);
    ctx.rotate(Math.atan2(ship.vy, ship.speed)); // slight tilt based on vertical velocity
    ctx.fillStyle = ship.health > 1 ? '#0f0' : '#f00';
    ctx.beginPath();
    ctx.moveTo(-ship.w / 2, -ship.h / 2);
    ctx.lineTo(ship.w / 2, 0);
    ctx.lineTo(-ship.w / 2, ship.h / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // ---- Parcels ----
    ctx.fillStyle = '#ff0';
    parcels.forEach(p => {
      ctx.fillRect(p.x, p.y, p.w, p.h);
      // small border for depth
      ctx.strokeStyle = '#aaa';
      ctx.strokeRect(p.x, p.y, p.w, p.h);
    });

    // ---- Asteroids ----
    ctx.fillStyle = '#777';
    asteroids.forEach(a => {
      ctx.beginPath();
      ctx.arc(a.x + a.w / 2, a.y + a.h / 2, a.w / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#555';
      ctx.stroke();
    });

    // ---- HUD ----
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Health: ${ship.health}`, 10, 40);
  }

  let last = performance.now();
  function loop() {
    const now = performance.now();
    const dt = now - last;
    last = now;
    if (ship.health > 0) {
      update(dt);
      draw();
      requestAnimationFrame(loop);
    } else {
      if (!gameOver) {
        playGameOver();
        gameOver = true;
      }
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }
  requestAnimationFrame(loop);
})();
