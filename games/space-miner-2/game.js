// Simple Space Miner game
// Targets <canvas id="game"></canvas>
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // no canvas found
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Game state
  const ship = { x: width / 2, y: height - 40, w: 30, h: 30, speed: 4 };
  let fuel = 100; // percent
  const asteroids = [];
  const resources = [];
  let gameOver = false;
  // starfield background
  const stars = Array.from({ length: 80 }, () => ({ x: Math.random() * width, y: Math.random() * height, r: Math.random() * 1.5 + 0.5 }));

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => keys[e.key] = true);
  window.addEventListener('keyup', e => keys[e.key] = false);
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }
  function playResourceSound(){ playTone(660); }
  function playExplosionSound(){ playTone(100); }

  function spawnAsteroid() {
    const size = 20 + Math.random() * 30;
    asteroids.push({ x: Math.random() * (width - size), y: -size, w: size, h: size, speed: 1 + Math.random() * 2, hazard: Math.random() < 0.7 });
  }
  function spawnResource() {
    const size = 15;
    resources.push({ x: Math.random() * (width - size), y: -size, w: size, h: size, speed: 1.5 });
  }

  let asteroidTimer = 0, resourceTimer = 0;

  function update(dt) {
    if (gameOver) return;
    // ship movement
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));

    // fuel consumption
    fuel -= dt * 0.02; // consume slowly
    if (fuel <= 0) { gameOver = true; }

    // spawn
    asteroidTimer += dt; resourceTimer += dt;
    if (asteroidTimer > 800) { spawnAsteroid(); asteroidTimer = 0; }
    if (resourceTimer > 1500) { spawnResource(); resourceTimer = 0; }

    // move asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      if (a.y > height) { asteroids.splice(i, 1); continue; }
      // collision with ship
      if (a.x < ship.x + ship.w && a.x + a.w > ship.x && a.y < ship.y + ship.h && a.y + a.h > ship.y) {
        if (a.hazard) { playExplosionSound(); gameOver = true; }
        asteroids.splice(i, 1);
      }
    }
    // move resources
    for (let i = resources.length - 1; i >= 0; i--) {
      const r = resources[i];
      r.y += r.speed;
      if (r.y > height) { resources.splice(i, 1); continue; }
      if (r.x < ship.x + ship.w && r.x + r.w > ship.x && r.y < ship.y + ship.h && r.y + r.h > ship.y) {
        fuel = Math.min(100, fuel + 20);
        playResourceSound();
        resources.splice(i, 1);
      }
    }
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#004');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // starfield
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;
    // ship with gradient
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x, ship.y + ship.h);
    shipGrad.addColorStop(0, '#0af');
    shipGrad.addColorStop(1, '#005');
    ctx.fillStyle = shipGrad;
    ctx.fillRect(ship.x, ship.y, ship.w, ship.h);
    // asteroids (hazard: red, safe: gray) with simple shading
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x + a.w/2, a.y + a.h/2, a.w*0.2, a.x + a.w/2, a.y + a.h/2, a.w/2);
      grad.addColorStop(0, a.hazard ? 'rgba(255,80,80,0.9)' : 'rgba(150,150,150,0.9)');
      grad.addColorStop(1, a.hazard ? 'rgba(150,0,0,0.5)' : 'rgba(80,80,80,0.5)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.w/2, a.y + a.h/2, a.w/2, 0, Math.PI*2);
      ctx.fill();
    });
    // resources (green glow)
    resources.forEach(r => {
      const glow = ctx.createRadialGradient(r.x + r.w/2, r.y + r.h/2, r.w*0.1, r.x + r.w/2, r.y + r.h/2, r.w/2);
      glow.addColorStop(0, 'rgba(0,255,0,0.8)');
      glow.addColorStop(1, 'rgba(0,150,0,0.4)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(r.x + r.w/2, r.y + r.h/2, r.w/2, 0, Math.PI*2);
      ctx.fill();
    });
    // fuel bar background
    ctx.fillStyle = '#555';
    ctx.fillRect(10, 10, 100, 10);
    // fuel level
    ctx.fillStyle = '#0f0';
    ctx.fillRect(10, 10, fuel, 10);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width/2, height/2);
    }
  }

  let last = performance.now();
  function loop(now) {
    const dt = now - last; last = now;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
