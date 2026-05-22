// Starship Sinker – minimal canvas game
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  // ----- Game state -----
  const ship = { x: W / 2, y: H - 60, w: 30, h: 40, speed: 4 };
  let fuel = 100; // percent
  let score = 0;
  let gameOver = false;
  const asteroids = [];
  const fuels = [];
  const keys = {};

  // ----- Helpers -----
  const rand = (min, max) => Math.random() * (max - min) + min;
  const rectCollide = (a, b) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  // Audio helpers using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }
  function playBoost() { playTone(600); }
  function playCollect() { playTone(900); }
  function playCrash() { playTone(150); }


  // ----- Input -----
  let audioStarted = false;
  window.addEventListener('keydown', e => {
    if (!audioStarted) { audioCtx.resume(); audioStarted = true; }
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // ----- Spawning -----
  function spawnAsteroid() {
    const size = rand(20, 50);
    asteroids.push({ x: rand(0, W - size), y: -size, w: size, h: size, v: rand(2, 5) });
  }
  function spawnFuel() {
    const size = 20;
    fuels.push({ x: rand(0, W - size), y: -size, w: size, h: size, v: 2 });
  }

  // ----- Main loop -----
  function update() {
    if (gameOver) return;
    // Controls
    if (keys['ArrowLeft']) ship.x -= ship.speed;
    if (keys['ArrowRight']) ship.x += ship.speed;
    if (keys[' ']) {
      ship.y -= 2; // boost upward a bit
      playBoost();
    }
    // Keep inside canvas
    ship.x = Math.max(0, Math.min(W - ship.w, ship.x));
    ship.y = Math.max(0, Math.min(H - ship.h, ship.y));

    // Fuel consumption
    fuel -= 0.05;
    if (fuel <= 0) gameOver = true;

    // Spawn entities
    if (Math.random() < 0.02) spawnAsteroid();
    if (Math.random() < 0.005) spawnFuel();

    // Move asteroids
    asteroids.forEach(a => (a.y += a.v));
    // Move fuel crates
    fuels.forEach(f => (f.y += f.v));

    // Remove off‑screen
    while (asteroids.length && asteroids[0].y > H) asteroids.shift();
    while (fuels.length && fuels[0].y > H) fuels.shift();

    // Collisions
    for (let i = 0; i < asteroids.length; i++) {
      if (rectCollide(ship, asteroids[i])) { playCrash(); gameOver = true; break; }
    }
    for (let i = fuels.length - 1; i >= 0; i--) {
      if (rectCollide(ship, fuels[i])) {
        fuel = Math.min(100, fuel + 30);
        playCollect();
        fuels.splice(i, 1);
      }
    }
    
    score += 0.1;
    draw();
    requestAnimationFrame(update);
  }

  // ----- Rendering -----
  // Pre‑draw background stars for depth
  const backgroundStars = [];
  function initStars(count = 100) {
    for (let i = 0; i < count; i++) {
      backgroundStars.push({ x: rand(0, W), y: rand(0, H), r: rand(0.5, 2) });
    }
  }
  initStars();

  function draw() {
    // Clear with dark space background
    ctx.fillStyle = '#000011';
    ctx.fillRect(0, 0, W, H);
    // Draw moving starfield
    ctx.fillStyle = '#fff';
    backgroundStars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      s.y += 0.5; // slow drift downwards
      if (s.y > H) { s.y = 0; s.x = rand(0, W); }
    });

    // Ship (gradient triangle)
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x, ship.y + ship.h);
    shipGrad.addColorStop(0, '#00ffff');
    shipGrad.addColorStop(1, '#0033ff');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();

    // Asteroids (radial gradient circles)
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x + a.w / 2, a.y + a.h / 2, a.w * 0.2, a.x + a.w / 2, a.y + a.h / 2, a.w / 2);
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#222');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.w / 2, a.y + a.h / 2, a.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Fuel crates (yellow with inner glow)
    fuels.forEach(f => {
      ctx.fillStyle = '#ffcc00';
      ctx.fillRect(f.x, f.y, f.w, f.h);
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(f.x + 4, f.y + 4, f.w - 8, f.h - 8);
    });

    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText(`Score: ${Math.floor(score)}`, 10, 20);
    ctx.fillText(`Fuel: ${Math.floor(fuel)}%`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = '30px monospace';
      ctx.fillText('GAME OVER', W / 2, H / 2);
    }
  }

  // Start the loop
  requestAnimationFrame(update);
})();
