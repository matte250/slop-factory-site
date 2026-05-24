// Simple canvas asteroid‑dodge game with improved graphics and sound
// Targets <canvas id="game"> assumed to exist.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Fit canvas to its displayed size
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  // --- Audio setup (Web Audio API) ---
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  // simple gain for overall volume control
  const masterGain = audioCtx.createGain();
  masterGain.gain.value = 0.2; // keep volume low
  masterGain.connect(audioCtx.destination);

  // Helper to play a short beep (frequency, duration, type)
  function playBeep(freq, dur = 0.1, type = 'sine') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = type;
    osc.connect(gain);
    gain.connect(masterGain);
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 0.01);
    gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + dur);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }

  // Thrust sound while steering
  function playThrust() {
    // Low‑pitched short beep for each steering action
    playBeep(300, 0.08, 'square');
  }

  // Explosion sound on collision
  function playExplosion() {
    // descending frequency sweep
    const startFreq = 400;
    const endFreq = 80;
    const dur = 0.4;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(startFreq, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, audioCtx.currentTime + dur);
    osc.connect(gain);
    gain.connect(masterGain);
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + dur);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }

  // Simple background hum (continuous low noise)
  const humOsc = audioCtx.createOscillator();
  humOsc.type = 'sine';
  humOsc.frequency.value = 30; // Very low frequency
  const humGain = audioCtx.createGain();
  humGain.gain.value = 0.05;
  humOsc.connect(humGain).connect(masterGain);
  humOsc.start();

  // --- Starfield background (static stars) ---
  const stars = [];
  const STAR_COUNT = 150;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.2,
      phase: Math.random() * Math.PI * 2,
    });
  }

  const ship = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    angle: -Math.PI / 2, // pointing up
    radius: 12,
    speed: 2.5,
  };

  const asteroids = [];
  const asteroidInterval = 1800; // ms, slightly faster spawn
  let lastAsteroid = 0;
  let gameOver = false;

  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    // Play thrust sound on steering keys
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      // ensure audio context is resumed (required by browsers on user interaction)
      if (audioCtx.state === 'suspended') audioCtx.resume();
      playThrust();
    }
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnAsteroid() {
    const edge = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    const size = 15 + Math.random() * 20;
    const speed = 1 + Math.random() * 2;
    switch (edge) {
      case 0: // top
        x = Math.random() * canvas.width;
        y = -size;
        break;
      case 1: // right
        x = canvas.width + size;
        y = Math.random() * canvas.height;
        break;
      case 2: // bottom
        x = Math.random() * canvas.width;
        y = canvas.height + size;
        break;
      case 3: // left
        x = -size;
        y = Math.random() * canvas.height;
        break;
    }
    const dx = ship.x - x;
    const dy = ship.y - y;
    const len = Math.hypot(dx, dy);
    vx = (dx / len) * speed;
    vy = (dy / len) * speed;
    const hue = Math.random() * 360; // random asteroid color hue
    asteroids.push({ x, y, vx, vy, radius: size, hue });
  }

  function update(dt) {
    // Ship steering
    if (keys.ArrowLeft) ship.angle -= 0.05;
    if (keys.ArrowRight) ship.angle += 0.05;
    // constant forward motion
    ship.x += Math.cos(ship.angle) * ship.speed;
    ship.y += Math.sin(ship.angle) * ship.speed;
    // wrap around edges
    if (ship.x < 0) ship.x += canvas.width;
    if (ship.x > canvas.width) ship.x -= canvas.width;
    if (ship.y < 0) ship.y += canvas.height;
    if (ship.y > canvas.height) ship.y -= canvas.height;

    // move asteroids
    for (const a of asteroids) {
      a.x += a.vx;
      a.y += a.vy;
    }
    // discard off‑screen asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      if (
        a.x < -a.radius || a.x > canvas.width + a.radius ||
        a.y < -a.radius || a.y > canvas.height + a.radius
      ) {
        asteroids.splice(i, 1);
      }
    }

    // collision detection
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      if (Math.hypot(dx, dy) < a.radius + ship.radius) {
        gameOver = true;
        // play explosion once
        playExplosion();
        break;
      }
    }

    // spawn asteroids periodically
    if (performance.now() - lastAsteroid > asteroidInterval) {
      spawnAsteroid();
      lastAsteroid = performance.now();
    }
  }

  function drawStars(timestamp) {
    ctx.save();
    ctx.fillStyle = 'white';
    for (const s of stars) {
      const alpha = 0.5 + 0.5 * Math.sin(timestamp / 500 + s.phase);
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function draw(timestamp) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawStars(timestamp);

    // draw ship with gradient shading
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    const shipGrad = ctx.createLinearGradient(0, -ship.radius, 0, ship.radius);
    shipGrad.addColorStop(0, '#00ffff');
    shipGrad.addColorStop(1, '#0066ff');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(0, -ship.radius);
    ctx.lineTo(ship.radius / 1.2, ship.radius);
    ctx.lineTo(-ship.radius / 1.2, ship.radius);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // draw asteroids with radial gradient based on hue
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(
        a.x, a.y, a.radius * 0.2,
        a.x, a.y, a.radius
      );
      grad.addColorStop(0, `hsl(${a.hue},70%,80%)`);
      grad.addColorStop(1, `hsl(${a.hue},70%,40%)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  let lastTime = 0;
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) update(dt);
    draw(timestamp);
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
