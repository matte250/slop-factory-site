// Simple Asteroid Escape game
// Canvas element with id "game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;

  // ----- Game state -----
  const ship = { x: width / 2, y: height - 60, w: 30, h: 30, speed: 4, fuel: 100 };
  const keys = {};
  const asteroids = [];
  const fuels = [];
  const stars = [];
  let score = 0;
  let lastAsteroid = 0;
  let lastFuel = 0;
  let gameOver = false;
  // initialize stars for background
  const STAR_COUNT = 100;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 2 + 0.5,
      brightness: Math.random() * 0.5 + 0.5,
      speed: Math.random() * 0.5 + 0.2
    });
  }

  // ----- Input -----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  function playThrust() { playTone(300, 100); }
  function playExplosion() { playTone(100, 300); }
  function playFuel() { playTone(600, 150); }
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'a' || e.key === 'd' || e.key === 'w' || e.key === 's') {
      playThrust();
    }
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnAsteroid() {
    const size = Math.random() * 30 + 10;
    const speed = Math.random() * 2 + 1;
    const x = Math.random() * (width - size);
    asteroids.push({ x, y: -size, size, speed });
  }

  function spawnFuel() {
    const size = 15;
    const x = Math.random() * (width - size);
    fuels.push({ x, y: -size, size });
  }

  function update(dt) {
    if (gameOver) return;
    // ship movement
    if (keys.ArrowLeft || keys.a) ship.x -= ship.speed;
    if (keys.ArrowRight || keys.d) ship.x += ship.speed;
    if (keys.ArrowUp || keys.w) ship.y -= ship.speed;
    if (keys.ArrowDown || keys.s) ship.y += ship.speed;
    // bounds
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));
    ship.y = Math.max(0, Math.min(height - ship.h, ship.y));

    // fuel consumption
    ship.fuel -= dt * 0.01; // deplete slowly
    if (ship.fuel <= 0) { ship.fuel = 0; gameOver = true; }

    // spawn asteroids every 800ms
    if (Date.now() - lastAsteroid > 800) { spawnAsteroid(); lastAsteroid = Date.now(); }
    // spawn fuel canister every 5000ms
    if (Date.now() - lastFuel > 5000) { spawnFuel(); lastFuel = Date.now(); }

    // update stars (parallax background)
    stars.forEach(s => {
      s.y += s.speed;
      if (s.y > height) { s.y = 0; s.x = Math.random() * width; }
    });

    // update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      if (a.y > height) { asteroids.splice(i, 1); score++; continue; }
      // collision
      if (rectIntersect(ship, a)) { playExplosion(); gameOver = true; }
    }

    // update fuels
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
      f.y += 1.5;
      if (f.y > height) { fuels.splice(i, 1); continue; }
      if (rectIntersect(ship, f)) {
        ship.fuel = Math.min(100, ship.fuel + 30);
        fuels.splice(i, 1);
        score += 5;
      }
    }
  }

  function rectIntersect(a, b) {
    return a.x < b.x + b.size && a.x + a.w > b.x && a.y < b.y + b.size && a.y + a.h > b.y;
  }

function draw() {
    // background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    // stars
    stars.forEach(s => {
      ctx.fillStyle = `rgba(255,255,255,${s.brightness})`;
      ctx.fillRect(s.x, s.y, s.r, s.r);
    });
    // ship (triangle)
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // asteroids (radial gradient circles)
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x + a.size/2, a.y + a.size/2, a.size*0.2, a.x + a.size/2, a.y + a.size/2, a.size/2);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#444');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.size/2, a.y + a.size/2, a.size/2, 0, Math.PI*2);
      ctx.fill();
    });
    // fuel canisters (gradient rectangles)
    fuels.forEach(f => {
      const grad = ctx.createLinearGradient(f.x, f.y, f.x, f.y + f.size*1.2);
      grad.addColorStop(0, '#ff0');
      grad.addColorStop(1, '#aa0');
      ctx.fillStyle = grad;
      ctx.fillRect(f.x, f.y, f.size, f.size * 1.2);
    });
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Fuel: ${Math.round(ship.fuel)}`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }
  }

  let last = performance.now();
  function loop(now) {
    const dt = now - last;
    last = now;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
