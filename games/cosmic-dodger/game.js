// game.js – Cosmic Dodger minimal implementation
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width = 800;
  const HEIGHT = canvas.height = 400;

  // Player ship
  const ship = { x: 80, y: HEIGHT / 2, w: 30, h: 20, dy: 0, fuel: 100 };

  // Asteroids and fuel cells
  const asteroids = [];
  const fuels = [];
  // Starfield
  const STAR_COUNT = 80;
  const stars = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * WIDTH,
      y: Math.random() * HEIGHT,
      alpha: Math.random() * 0.5 + 0.5,
      twinkleSpeed: (Math.random() * 0.02 - 0.01)
    });
  }
  const SPAWN_RATE = 90; // frames
  let frame = 0;
  let gameOver = false;

  // Audio context and simple beep function
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }

  // Input handling (up/down arrows)
  const keys = {};
  window.addEventListener('keydown', e => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.code] = true;
  });
  window.addEventListener('keyup', e => (keys[e.code] = false));

  function spawnAsteroid() {
    const size = 20 + Math.random() * 30;
    asteroids.push({ x: WIDTH + size, y: Math.random() * (HEIGHT - size), r: size, speed: 2 + Math.random() * 2 });
  }
  function spawnFuel() {
    const size = 15;
    fuels.push({ x: WIDTH + size, y: Math.random() * (HEIGHT - size), r: size, speed: 2 });
  }

  function update() {
    if (gameOver) return;
    // Player movement
    if (keys['ArrowUp']) ship.dy = -3;
    else if (keys['ArrowDown']) ship.dy = 3;
    else ship.dy = 0;
    ship.y += ship.dy;
    ship.y = Math.max(0, Math.min(HEIGHT - ship.h, ship.y));

    // Fuel consumption
    ship.fuel -= 0.05;
    if (ship.fuel <= 0) gameOver = true;

    // Update stars (twinkling)
    stars.forEach(s => {
      s.alpha += s.twinkleSpeed;
      if (s.alpha <= 0.3 || s.alpha >= 1) s.twinkleSpeed = -s.twinkleSpeed;
    });

    // Spawn obstacles / fuel
    if (frame % SPAWN_RATE === 0) {
      spawnAsteroid();
      if (Math.random() < 0.3) spawnFuel();
    }
    frame++;

    // Move asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed;
      if (a.x + a.r < 0) asteroids.splice(i, 1);
    }
    // Move fuel cells
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
      f.x -= f.speed;
      if (f.x + f.r < 0) fuels.splice(i, 1);
    }

    // Collision detection
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      const dx = (ship.x + ship.w / 2) - a.x;
      const dy = (ship.y + ship.h / 2) - a.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.r + Math.max(ship.w, ship.h) / 2) { beep(200, 0.2); gameOver = true; break; }
    }
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
      const dx = (ship.x + ship.w / 2) - f.x;
      const dy = (ship.y + ship.h / 2) - f.y;
      const dist = Math.hypot(dx, dy);
      if (dist < f.r + Math.max(ship.w, ship.h) / 2) { beep(600, 0.15); ship.fuel = Math.min(100, ship.fuel + 30); fuels.splice(i, 1); }
    }
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#003');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Starfield (simple twinkling)
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.globalAlpha = s.alpha;
      ctx.fillRect(s.x, s.y, 1, 1);
    });
    ctx.globalAlpha = 1;

    // Ship (triangle)
    ctx.fillStyle = '#0ff';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h / 2);
    ctx.lineTo(ship.x + ship.w, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();

    // Asteroids (stroke + fill)
    asteroids.forEach(a => {
      ctx.fillStyle = '#555';
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Fuel cells (glowing)
    fuels.forEach(f => {
      const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r);
      grad.addColorStop(0, '#ff0');
      grad.addColorStop(1, 'rgba(255,165,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Fuel: ' + Math.floor(ship.fuel), 10, 20);

    // Game Over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#f00';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  loop();
})();
