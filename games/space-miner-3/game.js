// Simple Space Miner game
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;
  // Audio context for sounds
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  // Simple sound helpers
  function playLaserSound() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.07);
  }

  function playExplosionSound() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
  }

  // Ensure audio context is resumed on first interaction
  function resumeAudio() {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  // ----- Game state -----
  const ship = { x: width / 2, y: height / 2, angle: 0, vx: 0, vy: 0, fuel: 100 };
  const asteroids = [];
  const lasers = [];
  let ore = 0;
  const oreGoal = 20;
  let gameOver = false;
  let win = false;

  // ----- Helpers -----
  const rand = (min, max) => Math.random() * (max - min) + min;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  // Create initial asteroids
  for (let i = 0; i < 8; i++) {
    asteroids.push({
      x: rand(0, width),
      y: rand(0, height),
      r: rand(20, 40),
      vx: rand(-0.5, 0.5),
      vy: rand(-0.5, 0.5),
    });
  }
  // Create background stars
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: rand(0, width),
      y: rand(0, height),
      r: rand(0.5, 2),
    });
  }

  // ----- Input -----
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.code] = true; resumeAudio(); if (e.code === 'Space') fireLaser(); });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  function fireLaser() {
    if (ship.fuel <= 0) return;
    const speed = 5;
    lasers.push({
      x: ship.x,
      y: ship.y,
      vx: Math.cos(ship.angle) * speed,
      vy: Math.sin(ship.angle) * speed,
      life: 30,
    });
    playLaserSound();
  }

  // ----- Game Loop -----
  function update() {
    if (gameOver) return;
    // Ship controls
    if (keys['ArrowLeft']) ship.angle -= 0.05;
    if (keys['ArrowRight']) ship.angle += 0.05;
    if (keys['ArrowUp'] && ship.fuel > 0) {
      const thrust = 0.1;
      ship.vx += Math.cos(ship.angle) * thrust;
      ship.vy += Math.sin(ship.angle) * thrust;
      ship.fuel = Math.max(0, ship.fuel - 0.1);
    }

    // Move ship
    ship.x = (ship.x + ship.vx + width) % width;
    ship.y = (ship.y + ship.vy + height) % height;

    // Move asteroids
    asteroids.forEach(a => {
      a.x = (a.x + a.vx + width) % width;
      a.y = (a.y + a.vy + height) % height;
    });

    // Move lasers
    lasers.forEach(l => {
      l.x = (l.x + l.vx + width) % width;
      l.y = (l.y + l.vy + height) % height;
      l.life--;
    });
    // Remove expired lasers
    for (let i = lasers.length - 1; i >= 0; i--) {
      if (lasers[i].life <= 0) lasers.splice(i, 1);
    }

    // Laser‑asteroid collisions
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      for (let j = lasers.length - 1; j >= 0; j--) {
        const l = lasers[j];
if (dist(a, l) < a.r) {
            asteroids.splice(i, 1);
            lasers.splice(j, 1);
            ore++;
            playExplosionSound();
            // spawn a new asteroid
            asteroids.push({
              x: rand(0, width),
              y: rand(0, height),
              r: rand(20, 40),
              vx: rand(-0.5, 0.5),
              vy: rand(-0.5, 0.5),
            });
            break;
          }
      }
    }

    // Ship‑asteroid collision
    for (const a of asteroids) {
      if (dist(a, ship) < a.r + 10) { // ship radius ~10
        gameOver = true;
        break;
      }
    }

    // Win / lose checks
    if (ore >= oreGoal) win = true, gameOver = true;
    if (ship.fuel <= 0 && !win) { gameOver = true; }
  }

  function draw() {
    // Fill background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);

    // Draw background stars
    ctx.fillStyle = 'white';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Ship (filled white with grey stroke)
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(-10, -7);
    ctx.lineTo(-10, 7);
    ctx.closePath();
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.strokeStyle = 'grey';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // Asteroids (shaded with radial gradient)
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#222');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Lasers (red with glow)
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'red';
    ctx.shadowBlur = 8;
    lasers.forEach(l => {
      ctx.beginPath();
      ctx.moveTo(l.x, l.y);
      ctx.lineTo(l.x - l.vx * 2, l.y - l.vy * 2);
      ctx.stroke();
    });
    // Reset shadow for UI
    ctx.shadowBlur = 0;

    // Fuel bar (gradient)
    const fuelGrad = ctx.createLinearGradient(10, 10, 210, 10);
    fuelGrad.addColorStop(0, '#0f0');
    fuelGrad.addColorStop(1, '#090');
    ctx.fillStyle = fuelGrad;
    ctx.fillRect(10, 10, ship.fuel * 2, 10);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 10, 200, 10);

    // Ore count
    ctx.fillStyle = 'white';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Ore: ${ore}/${oreGoal}`, 10, 35);

    // End screen overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.font = '30px sans-serif';
      ctx.fillText(win ? 'You Win!' : 'Game Over', width / 2, height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Start the game
  requestAnimationFrame(loop);
})();
