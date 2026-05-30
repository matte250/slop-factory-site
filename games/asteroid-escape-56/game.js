// Minimal Asteroid Escape game
// Canvas must exist with id="game"

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 600;

  // Ship
  const ship = { x: W / 2, y: H - 30, w: 40, h: 20, speed: 4, vx: 0 };
  const keys = {};

  // Asteroids
  const asteroids = [];
  const asteroidSpawn = () => {
    const size = 20 + Math.random() * 30;
    asteroids.push({ x: Math.random() * (W - size), y: -size, r: size / 2, speed: 1 + Math.random() * 3 });
  };
  let spawnTimer = 0;

// Stars background
const stars = [];
for (let i = 0; i < 100; i++) {
  stars.push({
    x: Math.random() * W,
    y: Math.random() * H,
    r: Math.random() * 2 + 1
  });
}

  // Input handling
  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  function playTone(freq, duration) {
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration / 1000);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + duration / 1000);
  }

  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (e.key === 'ArrowUp') {
      // Thrust sound
      playTone(400, 100);
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      // Small movement beep
      //playTone(200, 50);
    }
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  const update = dt => {
    // Ship movement
    if (keys['ArrowLeft']) ship.vx = -ship.speed;
    else if (keys['ArrowRight']) ship.vx = ship.speed;
    else ship.vx = 0;
    ship.x = Math.max(0, Math.min(W - ship.w, ship.x + ship.vx));

    // Asteroid logic
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      asteroidSpawn();
      spawnTimer = 800; // ms between spawns
    }
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // Remove off‑screen
      if (a.y - a.r > H) asteroids.splice(i, 1);
    }

    // Collision detection (simple circle‑rect)
    for (const a of asteroids) {
      const distX = Math.abs(a.x + a.r - (ship.x + ship.w / 2));
      const distY = Math.abs(a.y + a.r - (ship.y + ship.h / 2));
      if (distX > ship.w / 2 + a.r || distY > ship.h / 2 + a.r) continue;
      if (distX <= ship.w / 2 || distY <= ship.h / 2) endGame();
      const dx = distX - ship.w / 2;
      const dy = distY - ship.h / 2;
      if (dx * dx + dy * dy <= a.r * a.r) endGame();
    }
  };

  let running = true;
  function endGame() {
    // Play crash sound
    playTone(100, 300);
    running = false;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'white';
    ctx.font = '30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', W / 2, H / 2);
  }

  const draw = () => {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#003');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    // Stars
    ctx.fillStyle = 'white';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Ship (triangle)
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // Asteroids with radial gradient
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x + a.r, a.y + a.r, a.r * 0.2, a.x + a.r, a.y + a.r, a.r);
      grad.addColorStop(0, '#555');
      grad.addColorStop(1, '#111');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.r, a.y + a.r, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  let last = performance.now();
  function loop(now) {
    const dt = now - last;
    last = now;
    if (running) {
      update(dt);
      draw();
      requestAnimationFrame(loop);
    }
  }
  requestAnimationFrame(loop);
})();
