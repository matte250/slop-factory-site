// Asteroid Dodger game
// Canvas with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // safety
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.clientWidth || 800;
  const h = canvas.height = canvas.clientHeight || 600;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
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
  function playSpawnSound() { playTone(200, 0.08); }
  function playCollisionSound() { playTone(80, 0.3); }
  // Simple ambient background hum
  (function startHum() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 30;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
    osc.start();
    // loop forever
  })();

  // Ship
  const ship = {x: w/2, y: h-40, w: 30, h: 30, speed: 5};

  // Asteroids
  const asteroids = [];
  // Starfield
  const stars = [];
  const starCount = 80;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.5 + 0.5,
    });
  }
  const asteroidSpawnInterval = 1000; // ms
  let lastSpawn = 0;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => keys[e.key] = true);
  window.addEventListener('keyup', e => keys[e.key] = false);

  // Score
  let score = 0;
  let gameOver = false;

  function spawnAsteroid() {
    const size = Math.random() * 20 + 10;
    const x = Math.random() * (w - size * 2) + size;
    const speed = Math.random() * 2 + 1;
    asteroids.push({x, y: -size, r: size, speed});
    playSpawnSound();
  }

  function update(dt) {
    if (gameOver) return;
    // Move ship
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    // clamp
    ship.x = Math.max(0, Math.min(w - ship.w, ship.x));
    ship.y = Math.max(0, Math.min(h - ship.h, ship.y));

    // Spawn asteroids
    if (performance.now() - lastSpawn > asteroidSpawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // remove off‑screen
      if (a.y - a.r > h) { asteroids.splice(i, 1); score++; }
      else if (circleRectCollision(a, ship)) { playCollisionSound(); gameOver = true; }
    }
  }

  function draw() {
    // Background – dark space with stars
    ctx.fillStyle = '#000011';
    ctx.fillRect(0, 0, w, h);
    // draw stars
    ctx.fillStyle = 'white';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Ship – draw as a triangle for a sleek look
    ctx.fillStyle = 'cyan';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h / 2);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // Asteroids – use radial gradient shading
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#777777');
      grad.addColorStop(1, '#222222');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Score / Game Over UI
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', w/2 - 120, h/2);
    }
  }

  function loop(timestamp) {
    const dt = timestamp - (loop.last ?? timestamp);
    loop.last = timestamp;
    if (!gameOver) update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  // Simple circle‑rect collision
  function circleRectCollision(c, r) {
    const distX = Math.abs(c.x - (r.x + r.w/2));
    const distY = Math.abs(c.y - (r.y + r.h/2));
    if (distX > (r.w/2 + c.r)) return false;
    if (distY > (r.h/2 + c.r)) return false;
    if (distX <= (r.w/2)) return true;
    if (distY <= (r.h/2)) return true;
    const dx = distX - r.w/2;
    const dy = distY - r.h/2;
    return (dx*dx + dy*dy <= (c.r*c.r));
  }

  requestAnimationFrame(loop);
})();
