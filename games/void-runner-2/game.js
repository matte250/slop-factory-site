// Simple void‑runner implemented on <canvas id="game">.
// Ship moves with ArrowUp/ArrowDown (vertical) and ArrowRight (boost).
// Asteroids spawn randomly and move left. Collision ends the game.

(() => {
  const canvas = document.getElementById('game');
  // Ensure audio context resumes on first user gesture
  window.addEventListener('click', () => { if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume(); });
  // starfield for background
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.clientWidth,
      y: Math.random() * canvas.clientHeight,
      r: Math.random() * 1.5 + 0.5,
      speed: 30 + Math.random() * 20,
    });
  }

  // ----- Audio -----
  let audioCtx;
  const getAudioCtx = () => {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
  };
  const playTone = (freq, duration) => {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  };
  const playBoost = () => playTone(300, 0.05);
  const playCollision = () => playTone(100, 0.3);
  const playScore = () => playTone(500, 0.1);
  let wasBoosting = false;
  let prevScore = 0;
  if (!canvas) return; // canvas not found
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;

  // ----- Game state -----
  const ship = { x: 80, y: height / 2, w: 20, h: 12, vy: 0, boost: 0 };
  const asteroids = [];
  let score = 0;
  let lastAsteroid = 0;
  let running = true;

  // ----- Input -----
  const keys = {};
  window.addEventListener('keydown', e => keys[e.code] = true);
  window.addEventListener('keyup', e => keys[e.code] = false);

  function update(dt) { // update starfield and handle audio cues // update starfield
    for (let s of stars) {
      s.x -= s.speed * dt;
      if (s.x < 0) {
        s.x = canvas.width;
        s.y = Math.random() * canvas.height;
      }
    }
    // ship vertical movement
    ship.vy = 0;
    if (keys['ArrowUp']) ship.vy = -200; // pixels per second
    if (keys['ArrowDown']) ship.vy = 200;
    ship.y += ship.vy * dt;
    // boost (horizontal speed increase)
    if (keys['ArrowRight']) {
      ship.boost = Math.min(300, ship.boost + 600 * dt);
      if (!wasBoosting) {
        playBoost();
        wasBoosting = true;
      }
    } else {
      ship.boost = Math.max(0, ship.boost - 600 * dt);
      wasBoosting = false;
    }
    ship.x += ship.boost * dt;
    // keep inside vertical bounds
    if (ship.y < 0) ship.y = 0;
    if (ship.y > height) ship.y = height;
    // spawn asteroids roughly every 0.8‑1.2 s
    if (performance.now() - lastAsteroid > 800 + Math.random() * 400) {
      const size = 20 + Math.random() * 30;
      asteroids.push({ x: width + size, y: Math.random() * (height - size), r: size / 2, speed: 120 + Math.random() * 80 });
      lastAsteroid = performance.now();
    }
    // move asteroids left
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= (a.speed + ship.boost) * dt;
      if (a.x + a.r < 0) { asteroids.splice(i, 1); score++; playScore(); }
    }
    // collision detection (simple circle‑rect)
    for (const a of asteroids) {
      const distX = Math.abs(a.x - ship.x - ship.w / 2);
      const distY = Math.abs(a.y - ship.y - ship.h / 2);
      if (distX > (ship.w / 2 + a.r) || distY > (ship.h / 2 + a.r)) continue;
      if (distX <= (ship.w / 2) || distY <= (ship.h / 2) ||
          Math.hypot(distX - ship.w / 2, distY - ship.h / 2) <= a.r) {
        playCollision();
        running = false; // game over
      }
    }
    // lose if ship leaves canvas horizontally
    if (ship.x < -ship.w || ship.x > width + ship.w) running = false;
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
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // background already cleared by gradient fill
    // ship (triangle with stroke)
    ctx.fillStyle = '#0ff';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y);
    ctx.lineTo(ship.x - ship.w, ship.y - ship.h / 2);
    ctx.lineTo(ship.x - ship.w, ship.y + ship.h / 2);
    ctx.closePath();
    ctx.fill();
    // ship outline
    ctx.strokeStyle = '#0aa';
    ctx.lineWidth = 2;
    ctx.stroke();
    // asteroids
    ctx.fillStyle = '#a44';
    for (const a of asteroids) {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#ff0';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  let last = performance.now();
  function loop() {
    const now = performance.now();
    const dt = (now - last) / 1000;
    last = now;
    if (running) update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
