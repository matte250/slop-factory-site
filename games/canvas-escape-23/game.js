// Simple Canvas Escape game
// Canvas element with id="game" must exist in the page.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;

  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio context is resumed on first user interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  window.addEventListener('click', resumeAudio, {once: true});
  window.addEventListener('keydown', resumeAudio, {once: true});

  function playLaser() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 600;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
  }

  function playExplosion() {
    const bufferSize = audioCtx.sampleRate * 0.3;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1000;
    noise.connect(filter).connect(audioCtx.destination);
    noise.start();
    noise.stop(audioCtx.currentTime + 0.3);
  }

  function playGameOver() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = 150;
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.0);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 1.0);
  }

  // ----- Game state -----
  const ship = { x: 80, y: height / 2, w: 30, h: 20, speed: 4 };
  const lasers = [];
  const asteroids = [];
  // Starfield background
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 1,
      speed: Math.random() * 0.5 + 0.2,
    });
  }
  let ammo = 20; // limited laser ammo
  let score = 0;
  let running = true;
  let gameOverPlayed = false;
  let lastAsteroid = 0;

  // ----- Input handling -----
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });
  window.addEventListener('click', () => fireLaser());
  function fireLaser() {
    if (ammo <= 0) return;
    lasers.push({ x: ship.x + ship.w, y: ship.y + ship.h / 2, vx: 8 });
    ammo--;
    playLaser();
  }

  // ----- Helpers -----
  function rectCircleCollide(rx, ry, rw, rh, cx, cy, cr) {
    // Find closest point to circle within rectangle
    const closestX = Math.max(rx, Math.min(cx, rx + rw));
    const closestY = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - closestX;
    const dy = cy - closestY;
    return dx * dx + dy * dy < cr * cr;
  }

  // ----- Game loop -----
  function update(dt) {
    // Update stars (simple scrolling background)
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.x -= s.speed;
      if (s.x < 0) {
        s.x = width;
        s.y = Math.random() * height;
      }
    }
    // Move ship
    if (keys['ArrowUp']) ship.y -= ship.speed;
    if (keys['ArrowDown']) ship.y += ship.speed;
    if (keys['ArrowLeft']) ship.x -= ship.speed;
    if (keys['ArrowRight']) ship.x += ship.speed;
    // Clamp to canvas
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));
    ship.y = Math.max(0, Math.min(height - ship.h, ship.y));

    // Update lasers
    for (let i = lasers.length - 1; i >= 0; i--) {
      const l = lasers[i];
      l.x += l.vx;
      if (l.x > width) lasers.splice(i, 1);
    }

    // Spawn asteroids
    const now = performance.now();
    if (now - lastAsteroid > 1000) { // every second
      const radius = 15 + Math.random() * 15;
      const speed = 2 + Math.random() * 2;
      asteroids.push({ x: width + radius, y: Math.random() * (height - radius * 2) + radius, r: radius, vx: -speed });
      lastAsteroid = now;
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx;
      if (a.x + a.r < 0) { asteroids.splice(i, 1); score++; }
    }

    // Collision detection
    // Ship vs asteroid
    for (const a of asteroids) {
      if (rectCircleCollide(ship.x, ship.y, ship.w, ship.h, a.x, a.y, a.r)) {
        playExplosion();
        running = false; break;
      }
    }
    // Lasers vs asteroid
    for (let i = lasers.length - 1; i >= 0; i--) {
      const l = lasers[i];
      for (let j = asteroids.length - 1; j >= 0; j--) {
        const a = asteroids[j];
        const dx = l.x - a.x;
        const dy = (ship.y + ship.h / 2) - a.y; // laser y stays ship's center
        if (dx * dx + dy * dy < a.r * a.r) {
          // destroy both
          lasers.splice(i, 1);
          asteroids.splice(j, 1);
          score += 5;
          playExplosion();
          break;
        }
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // Background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    // Starfield
    stars.forEach(s => {
      ctx.fillStyle = 'rgba(255,255,255,' + (0.5 + Math.random() * 0.5) + ')';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, 2 * Math.PI);
      ctx.fill();
    });
    // Ship with gradient
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x + ship.w, ship.y + ship.h);
    shipGrad.addColorStop(0, '#0f0');
    shipGrad.addColorStop(1, '#070');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h / 2);
    ctx.closePath();
    ctx.fill();
    // Lasers with glow
    ctx.shadowColor = '#ff0';
    ctx.shadowBlur = 4;
    ctx.fillStyle = '#ff0';
    lasers.forEach(l => ctx.fillRect(l.x, ship.y + ship.h / 2 - 2, 6, 4));
    ctx.shadowBlur = 0;
    // Asteroids with radial gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#ccc');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Ammo: ${ammo}`, 10, 40);
    if (!running) {
      // Play game over sound once
      if (!gameOverPlayed) {
        playGameOver();
        gameOverPlayed = true;
      }
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', width / 2 - 80, height / 2);
    }
  }

  let lastTime = 0;
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (running) update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
