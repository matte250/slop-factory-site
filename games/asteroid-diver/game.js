// Simple Asteroid Diver game
// Canvas with id "game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }
  function playThrust() { playTone(250, 0.05); }
  function playCollect() { playTone(800, 0.1); }
  function playCrash() { playTone(120, 0.4); }

  // Game state
  const ship = { x: 80, y: height / 2, w: 20, h: 12, vx: 0, vy: 0, speed: 0.2 };
  const asteroids = [];
  const fuels = [];
  const stars = [];
  const STAR_COUNT = 100;
  function initStars() {
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.5 + 0.5,
        speed: 0.2 + Math.random() * 0.3,
      });
    }
  }
  initStars();
  let fuel = 100; // seconds of fuel
  let lastTime = 0;
  let gameOver = false;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { if (audioCtx.state === 'suspended') audioCtx.resume(); keys[e.key] = true; });
  window.addEventListener('keyup', e => keys[e.key] = false);

  function spawnAsteroid() {
    const size = Math.random() * 30 + 20;
    asteroids.push({ x: width + size, y: Math.random() * (height - size), w: size, h: size, vx: - (2 + Math.random() * 3) });
  }
  function spawnFuel() {
    const size = 15;
    fuels.push({ x: width + size, y: Math.random() * (height - size), w: size, h: size, vx: -2 });
  }

  function update(dt) {
    // move stars for parallax background
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.x -= s.speed;
      if (s.x < 0) {
        s.x = width;
        s.y = Math.random() * height;
      }
    }
    if (gameOver) return;
    // ship movement
    if (keys['ArrowUp'] || keys['w']) ship.vy -= ship.speed * dt;
    if (keys['ArrowDown'] || keys['s']) ship.vy += ship.speed * dt;
    if (keys['ArrowLeft'] || keys['a']) ship.vx -= ship.speed * dt;
    if (keys['ArrowRight'] || keys['d']) ship.vx += ship.speed * dt;
    // apply velocity and friction
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x + ship.vx));
    ship.y = Math.max(0, Math.min(height - ship.h, ship.y + ship.vy));
    ship.vx *= 0.9; ship.vy *= 0.9;

    // spawn obstacles and fuel
    if (Math.random() < 0.02) spawnAsteroid();
    if (Math.random() < 0.005) spawnFuel();

    // move asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx;
      if (a.x + a.w < 0) asteroids.splice(i, 1);
    }
    // move fuels
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
      f.x += f.vx;
      if (f.x + f.w < 0) fuels.splice(i, 1);
    }

    // collision detection
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      if (rectIntersect(ship, a)) { playCrash(); gameOver = true; }
    }
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
      if (rectIntersect(ship, f)) { fuel = Math.min(100, fuel + 20); fuels.splice(i, 1); }
    }

    // fuel consumption
    fuel -= dt * 0.01; // deplete over time
    if (fuel <= 0) gameOver = true;
  }

  function rectIntersect(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#003');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // ship (draw as triangle)
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h/2);
    ctx.lineTo(ship.x + ship.w, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // thrust flame when moving
    if (Math.abs(ship.vx) > 0.1 || Math.abs(ship.vy) > 0.1) {
      ctx.fillStyle = '#f90';
      ctx.beginPath();
      ctx.moveTo(ship.x, ship.y + ship.h/2);
      ctx.lineTo(ship.x - 8, ship.y + ship.h/2 - 4);
      ctx.lineTo(ship.x - 8, ship.y + ship.h/2 + 4);
      ctx.closePath();
      ctx.fill();
      // thrust sound
      playThrust();
    }
    // asteroids (draw as circles)
    ctx.fillStyle = '#555';
    asteroids.forEach(a => {
      ctx.beginPath();
      ctx.arc(a.x + a.w/2, a.y + a.h/2, a.w/2, 0, Math.PI*2);
      ctx.fill();
    });
    // fuels (draw as glowing circles)
    ctx.fillStyle = '#ff0';
    fuels.forEach(f => {
      ctx.beginPath();
      ctx.arc(f.x + f.w/2, f.y + f.h/2, f.w/2, 0, Math.PI*2);
      ctx.fill();
    });
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.fillText('Fuel: ' + Math.max(0, Math.floor(fuel)), 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', width / 2 - 80, height / 2);
    }
  }

  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
