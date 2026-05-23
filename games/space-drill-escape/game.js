// game.js – simple side‑scroll space drill game
(() => {
  const canvas = document.getElementById('game');
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.stop(audioCtx.currentTime + dur);
  }
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 600;

  // ship state
  const stars = [];
  const STAR_COUNT = 100;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.5 + 0.5});
  }
  const ship = {x: 80, y: H/2, r: 15, vy: 0, fuel: 100};
  const GRAVITY = 0.4, DRILL_POWER = -8, FUEL_DRAIN = 0.04, FUEL_GAIN = 20;
  // objects
  let asteroids = [], fuels = [];
  let frames = 0, gameOver = false;

  // helper: random int
  const rand = (min, max) => Math.random() * (max - min) + min;

  // input – click or tap fires drill
  canvas.addEventListener('pointerdown', () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (gameOver) return reset();
    ship.vy = DRILL_POWER;
    ship.fuel = Math.max(0, ship.fuel - 5); // cost per drill
    playSound(400, 0.07); // drill sound
  });

  function spawnAsteroid() {
    const r = rand(12, 30);
    asteroids.push({x: W + r, y: rand(r, H - r), r, vx: -3 - rand(0,2)});
  }
  function spawnFuel() {
    const r = 10;
    fuels.push({x: W + r, y: rand(r, H - r), r, vx: -3});
  }

  function update() {
    // move background stars for parallax effect
    for (const s of stars) {
      s.x -= 0.5; // star speed
      if (s.x < 0) s.x = W;
    }
    if (gameOver) return;
    // ship physics
    ship.vy += GRAVITY;
    ship.y += ship.vy;
    ship.fuel -= FUEL_DRAIN;
    // bounds
    if (ship.y > H - ship.r) { ship.y = H - ship.r; ship.vy = 0; }
    if (ship.y < ship.r) { ship.y = ship.r; ship.vy = 0; }
    // objects motion
    asteroids.forEach(o => o.x += o.vx);
    fuels.forEach(o => o.x += o.vx);
    // spawn logic
    if (frames % 90 === 0) spawnAsteroid();
    if (frames % 300 === 0) spawnFuel();
    // remove off‑screen
    asteroids = asteroids.filter(o => o.x + o.r > 0);
    fuels = fuels.filter(o => o.x + o.r > 0);
    // collisions
    for (const a of asteroids) {
      const dx = a.x - ship.x, dy = a.y - ship.y;
      if (dx*dx + dy*dy < (a.r + ship.r)**2) { gameOver = true; playSound(200, 0.3); break; }
    }
    for (let i = fuels.length-1; i >= 0; i--) {
      const f = fuels[i];
      const dx = f.x - ship.x, dy = f.y - ship.y;
      if (dx*dx + dy*dy < (f.r + ship.r)**2) {
        ship.fuel = Math.min(100, ship.fuel + FUEL_GAIN);
        fuels.splice(i,1);
      }
    }
    if (ship.fuel <= 0) gameOver = true;
    frames++;
  }

  function draw() {
    // background gradient
    const grad = ctx.createLinearGradient(0,0,0,H);
    grad.addColorStop(0,'#001d3d');
    grad.addColorStop(1,'#000814');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,W,H);
    // stars
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fill();
    }

// ship with gradient
    const shipGrad = ctx.createRadialGradient(ship.x, ship.y, ship.r*0.2, ship.x, ship.y, ship.r);
    shipGrad.addColorStop(0, '#5ff');
    shipGrad.addColorStop(1, '#009');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, ship.r, 0, Math.PI*2);
    ctx.fill();
    // thrust flame when drilling
    if (ship.vy < 0) {
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.moveTo(ship.x - ship.r/2, ship.y);
      ctx.lineTo(ship.x + ship.r/2, ship.y);
      ctx.lineTo(ship.x, ship.y + ship.r*2);
      ctx.closePath();
      ctx.fill();
    }
    // asteroids with gradient
    for (const a of asteroids) {
      const gradA = ctx.createRadialGradient(a.x, a.y, a.r*0.2, a.x, a.y, a.r);
      gradA.addColorStop(0, '#a66');
      gradA.addColorStop(1, '#322');
      ctx.fillStyle = gradA;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI*2);
      ctx.fill();
    }
    // fuel cells with glow
    for (const f of fuels) {
      const gradF = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r);
      gradF.addColorStop(0, '#0f0');
      gradF.addColorStop(1, '#060');
      ctx.fillStyle = gradF;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI*2);
      ctx.fill();
    }
    // UI – fuel bar & game over
    ctx.fillStyle = '#fff';
    ctx.fillText('Fuel: ' + Math.floor(ship.fuel), 10, 20);
    if (gameOver) {
      ctx.textAlign = 'center';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over – click to restart', W/2, H/2);
    }
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  function reset() {
    ship.y = H/2; ship.vy = 0; ship.fuel = 100;
    asteroids = []; fuels = []; frames = 0; gameOver = false;
  }

  loop();
})();
