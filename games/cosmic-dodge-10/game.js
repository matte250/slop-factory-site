// Cosmic Dodge – minimal implementation
// Canvas with id="game" must exist in the HTML.

(() => {
  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playSound = (freq, duration = 0.1) => {
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
  };
  const playThrust = () => playSound(200);
  const playExplosion = () => playSound(60, 0.5);
  const playFuel = () => playSound(800);
  const playGameOver = () => playSound(30, 0.7);

  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth;
  const H = canvas.height = canvas.clientHeight;
  const CX = W / 2, CY = H / 2;

  // Game constants
  const PLANET_R = 30;
  const SHIP_R = 6;
  const AST_R = 8;
  const FUEL_R = 5;
  const ORBIT_R = 80;               // default orbit radius
  const GRAVITY = 0.04;              // pulls ship back to orbit
  const THRUST = 0.6;                // outward velocity per click
  const FUEL_DEPLETION = 0.001;      // per frame
  const SPAWN_AST = 120;             // frames between asteroids
  const SPAWN_FUEL = 300;            // frames between fuel cells

  let angle = 0;                     // ship orbit angle
  let radius = ORBIT_R;              // current distance from planet
  let radialVel = 0;                 // radial velocity
  let fuel = 1;                      // 0‑1 range
  let frame = 0;
  let asteroids = [];
  let fuels = [];
  let stars = [];
  let shipTrail = [];
  let gameOver = false;

  // generate background stars once
  for (let i = 0; i < 120; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.5,
    });
  }

  // input – click/tap gives thrust outward and consumes fuel
  canvas.addEventListener('pointerdown', async () => {
    // Ensure audio context is running
    if (audioCtx.state !== 'running') await audioCtx.resume();
    if (gameOver) return restart();
    if (fuel <= 0) return;
    radialVel -= THRUST;
    fuel = Math.max(0, fuel - 0.1);
    playThrust();
  });

  function spawnAsteroid() {
    const a = Math.random() * Math.PI * 2;
    const r = Math.max(W, H) / 2 + AST_R;
    const x = CX + Math.cos(a) * r;
    const y = CY + Math.sin(a) * r;
    const speed = 1 + Math.random() * 1.5;
    const vx = (CX - x) / r * speed;
    const vy = (CY - y) / r * speed;
    asteroids.push({x, y, vx, vy});
  }

  function spawnFuel() {
    const a = Math.random() * Math.PI * 2;
    const r = Math.max(W, H) / 2 + FUEL_R;
    const x = CX + Math.cos(a) * r;
    const y = CY + Math.sin(a) * r;
    const speed = 0.8 + Math.random() * 0.4;
    const vx = (CX - x) / r * speed;
    const vy = (CY - y) / r * speed;
    fuels.push({x, y, vx, vy});
  }

  function restart() {
    angle = 0; radius = ORBIT_R; radialVel = 0; fuel = 1; frame = 0;
    asteroids = []; fuels = []; gameOver = false;
    requestAnimationFrame(loop);
  }

  function loop() {
    if (gameOver) { draw(); return; }
    frame++;
    // update ship
    angle += 0.02;
    radialVel += GRAVITY * (ORBIT_R - radius);
    radius += radialVel;
    radialVel *= 0.98; // damping
    // fuel decay
    fuel = Math.max(0, fuel - FUEL_DEPLETION);
    if (fuel <= 0) { gameOver = true; playGameOver(); }
    // spawn entities
    if (frame % SPAWN_AST === 0) spawnAsteroid();
    if (frame % SPAWN_FUEL === 0) spawnFuel();
    // update asteroids
    asteroids.forEach(a => { a.x += a.vx; a.y += a.vy; });
    // update fuels
    fuels.forEach(f => { f.x += f.vx; f.y += f.vy; });
    // collision checks
    const shipX = CX + Math.cos(angle) * radius;
    const shipY = CY + Math.sin(angle) * radius;
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      const dx = a.x - shipX, dy = a.y - shipY;
      if (dx * dx + dy * dy < (AST_R + SHIP_R) ** 2) { gameOver = true; playExplosion(); break; }
      // remove if passed planet
      if (Math.hypot(a.x - CX, a.y - CY) < PLANET_R) asteroids.splice(i, 1);
    }
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
      const dx = f.x - shipX, dy = f.y - shipY;
      if (dx * dx + dy * dy < (FUEL_R + SHIP_R) ** 2) { fuel = Math.min(1, fuel + 0.4); fuels.splice(i, 1); playFuel(); }
      else if (Math.hypot(f.x - CX, f.y - CY) < PLANET_R) fuels.splice(i, 1);
    }
    draw();
    requestAnimationFrame(loop);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    // background stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => { ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill(); });
    // planet with radial gradient for depth
    const planetGrad = ctx.createRadialGradient(CX, CY, PLANET_R * 0.2, CX, CY, PLANET_R);
    planetGrad.addColorStop(0, '#777');
    planetGrad.addColorStop(1, '#222');
    ctx.fillStyle = planetGrad;
    ctx.beginPath(); ctx.arc(CX, CY, PLANET_R, 0, Math.PI * 2); ctx.fill();
    // ship trail (fading)
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#0f0';
    for (let i = shipTrail.length - 1; i >= 0; i--) {
      const p = shipTrail[i];
      const alpha = (i + 1) / shipTrail.length * 0.5;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, SHIP_R, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    // ship
    const sx = CX + Math.cos(angle) * radius;
    const sy = CY + Math.sin(angle) * radius;
    // record trail point
    shipTrail.push({x: sx, y: sy});
    if (shipTrail.length > 20) shipTrail.shift();
    const shipGrad = ctx.createLinearGradient(-SHIP_R, -SHIP_R, SHIP_R, SHIP_R);
    shipGrad.addColorStop(0, '#0f0');
    shipGrad.addColorStop(1, '#060');
    ctx.fillStyle = shipGrad;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(angle + Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(0, -SHIP_R);
    ctx.lineTo(SHIP_R * 0.6, SHIP_R);
    ctx.lineTo(-SHIP_R * 0.6, SHIP_R);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // asteroids with subtle gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, AST_R * 0.3, a.x, a.y, AST_R);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#444');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(a.x, a.y, AST_R, 0, Math.PI * 2); ctx.fill();
    });
    // fuel cells with glow
    ctx.fillStyle = '#ff0';
    fuels.forEach(f => { ctx.beginPath(); ctx.arc(f.x, f.y, FUEL_R, 0, Math.PI * 2); ctx.fill(); });
    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.fillText('Fuel: ' + Math.round(fuel * 100) + '%', 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0,0,W,H);
      ctx.fillStyle = '#f44';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over – click to restart', CX, CY);
    }
  }

  requestAnimationFrame(loop);
})();
