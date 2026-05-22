// Simple Space Drift game
// Canvas with id="game" must exist in the page.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth;
  const H = canvas.height = canvas.offsetHeight;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  };
  const playShield = () => playTone(600, 200);
  const playExplosion = () => playTone(150, 500);
  // simple background drone
  const droneOsc = audioCtx.createOscillator();
  const droneGain = audioCtx.createGain();
  droneOsc.frequency.value = 80;
  droneOsc.type = 'sawtooth';
  droneOsc.connect(droneGain);
  droneGain.connect(audioCtx.destination);
  droneGain.gain.value = 0.02;
  droneOsc.start();

  // Game state
  const ship = { x: W / 2, y: H - 60, w: 30, h: 40 };
  let shield = 0; // frames left
  let score = 0;
  const stars = [];
  const asteroids = [];
  const powerUps = [];

  const keys = { left: false, right: false };

  // Helpers
  const rand = (a, b) => Math.random() * (b - a) + a;

  // Init stars
  for (let i = 0; i < 100; i++) {
    stars.push({ x: rand(0, W), y: rand(0, H), r: rand(0.5, 2), s: rand(0.2, 0.7) });
  }

  // Input
  window.addEventListener('keydown', e => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (e.code === 'ArrowLeft') keys.left = true;
    else if (e.code === 'ArrowRight') keys.right = true;
  });
  window.addEventListener('keyup', e => {
    if (e.code === 'ArrowLeft') keys.left = false;
    else if (e.code === 'ArrowRight') keys.right = false;
  });

  function spawnAsteroid() {
    const size = rand(20, 50);
    asteroids.push({ x: rand(0, W - size), y: -size, r: size, s: rand(2, 5) });
  }

  function spawnPowerUp() {
    const size = 15;
    powerUps.push({ x: rand(0, W - size), y: -size, r: size, s: 2 });
  }

  let asteroidTimer = 0;
  let powerTimer = 0;

  function update() {
    // Move ship
    if (keys.left) ship.x -= 5;
    if (keys.right) ship.x += 5;
    ship.x = Math.max(0, Math.min(W - ship.w, ship.x));

    // Stars
    for (const s of stars) {
      s.y += s.s;
      if (s.y > H) { s.y = 0; s.x = rand(0, W); }
    }

    // Asteroids
    asteroidTimer--;
    if (asteroidTimer <= 0) { spawnAsteroid(); asteroidTimer = 60; }
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.s;
      if (a.y - a.r > H) asteroids.splice(i, 1);
    }

    // Power‑ups
    powerTimer--;
    if (powerTimer <= 0) { spawnPowerUp(); powerTimer = 300; }
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const p = powerUps[i];
      p.y += p.s;
      if (p.y - p.r > H) powerUps.splice(i, 1);
    }

    // Collisions
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      const dx = (ship.x + ship.w / 2) - (a.x + a.r / 2);
      const dy = (ship.y + ship.h / 2) - (a.y + a.r / 2);
      const dist = Math.hypot(dx, dy);
      if (dist < a.r / 2 + Math.max(ship.w, ship.h) / 2) {
        if (shield > 0) { asteroids.splice(i, 1); shield = Math.max(0, shield - 30); }
        else { playExplosion(); gameOver(); }
      }
    }
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const p = powerUps[i];
      const dx = (ship.x + ship.w / 2) - (p.x + p.r / 2);
      const dy = (ship.y + ship.h / 2) - (p.y + p.r / 2);
      const dist = Math.hypot(dx, dy);
if (dist < p.r / 2 + Math.max(ship.w, ship.h) / 2) {
          shield = 300; // frames (~5s)
          playShield();
          powerUps.splice(i, 1);
        }
    }

    if (shield > 0) shield--;
    score++;
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#000020');
    bgGrad.addColorStop(1, '#000040');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    // stars (soft circles with twinkling)
    for (const s of stars) {
      const alpha = 0.5 + Math.random() * 0.5;
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // ship (gradient with outline)
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x + ship.w, ship.y + ship.h);
    shipGrad.addColorStop(0, shield > 0 ? '#00ffff' : '#00ff00');
    shipGrad.addColorStop(1, shield > 0 ? '#0066ff' : '#006600');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // ship outline
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();
    // asteroids (gradient circles)
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(
        a.x + a.r / 2, a.y + a.r / 2, a.r * 0.2,
        a.x + a.r / 2, a.y + a.r / 2, a.r / 2
      );
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.r / 2, a.y + a.r / 2, a.r / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    // power‑ups (glowing gradient)
    for (const p of powerUps) {
      ctx.save();
      const puGrad = ctx.createRadialGradient(
        p.x + p.r/2, p.y + p.r/2, p.r * 0.1,
        p.x + p.r/2, p.y + p.r/2, p.r / 2
      );
      puGrad.addColorStop(0, '#ffff00');
      puGrad.addColorStop(1, '#ff8800');
      ctx.fillStyle = puGrad;
      ctx.shadowColor = '#ff0';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x + p.r/2, p.y + p.r/2, p.r / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score/60), 10, 20);
    if (shield > 0) ctx.fillText('Shield: ' + Math.ceil(shield/60) + 's', 10, 40);
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  function gameOver() {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#f00';
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', W/2, H/2);
    ctx.font = '24px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score/60), W/2, H/2 + 40);
  }

  // Start
  requestAnimationFrame(loop);
})();
