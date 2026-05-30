// Simple Asteroid Escape game
// Canvas element with id="game" must exist in the HTML.

window.addEventListener('load', () => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  }
  const W = canvas.width;
  const H = canvas.height;

  const ship = { x: 50, y: H / 2, w: 20, h: 30 };
  const keys = {};
  const asteroids = [];
  const stars = [];
  let score = 0;
  let gameOver = false;
  let lastAsteroid = 0;
  let lastStar = 0;

  // input handling
  window.addEventListener('keydown', e => {
    // resume audio context on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnAsteroid() {
    const radius = 15 + Math.random() * 15;
    asteroids.push({ x: W + radius, y: Math.random() * H, r: radius, speed: 2 + Math.random() * 2 });
  }

  function spawnStar() {
    const radius = 5 + Math.random() * 5;
    stars.push({ x: W + radius, y: Math.random() * H, r: radius, speed: 1.5 + Math.random() * 1 });
  }

  function update(dt) {
    // ship movement
    if (keys['ArrowUp']) ship.y -= 200 * dt;
    if (keys['ArrowDown']) ship.y += 200 * dt;
    if (keys['ArrowLeft']) ship.x -= 200 * dt;
    if (keys['ArrowRight']) ship.x += 200 * dt;

    // boundary check – leaving canvas ends game
    if (ship.x < 0 || ship.x > W || ship.y < 0 || ship.y > H) gameOver = true;

    // spawn objects
    if (performance.now() - lastAsteroid > 1500) { spawnAsteroid(); lastAsteroid = performance.now(); }
    if (performance.now() - lastStar > 1000) { spawnStar(); lastStar = performance.now(); }

    // move asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed;
      // collision with ship (simple circle‑rect test)
      const dx = Math.max(a.x - Math.max(ship.x, Math.min(a.x, ship.x + ship.w)), 0);
      const dy = Math.max(a.y - Math.max(ship.y, Math.min(a.y, ship.y + ship.h)), 0);
      if (dx * dx + dy * dy < a.r * a.r) { playTone(200, 0.3); gameOver = true; }
      if (a.x + a.r < 0) asteroids.splice(i, 1);
    }

    // move stars
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.x -= s.speed;
      // collision – point collection
      const dx = Math.max(s.x - Math.max(ship.x, Math.min(s.x, ship.x + ship.w)), 0);
      const dy = Math.max(s.y - Math.max(ship.y, Math.min(s.y, ship.y + ship.h)), 0);
      if (dx * dx + dy * dy < s.r * s.r) { playTone(600, 0.15); score++; stars.splice(i, 1); }
      else if (s.x + s.r < 0) stars.splice(i, 1);
    }
  }

  function draw() {
    // Background – dark space with subtle gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#001020');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // ship – gradient triangle with stroke
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x + ship.w, ship.y + ship.h);
    shipGrad.addColorStop(0, '#00ffff');
    shipGrad.addColorStop(1, '#0066ff');
    ctx.fillStyle = shipGrad;
    ctx.strokeStyle = '#003366';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // asteroids – shaded radial gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.3, a.x, a.y, a.r);
      grad.addColorStop(0, '#888');
      grad.addColorStop(1, '#222');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // stars – twinkling with slight opacity variation
    stars.forEach(s => {
      ctx.fillStyle = 'rgba(255,255,200,' + (0.6 + Math.random() * 0.4) + ')';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // score
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);

    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', W / 2 - 120, H / 2);
    }
  }

  let lastTime = performance.now();
  function loop() {
    const now = performance.now();
    const dt = (now - lastTime) / 1000; // seconds
    lastTime = now;
    if (!gameOver) {
      update(dt);
      draw();
      requestAnimationFrame(loop);
    } else {
      draw(); // final frame with Game Over text
    }
  }
  requestAnimationFrame(loop);
});
