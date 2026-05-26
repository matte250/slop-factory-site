// Simple Asteroid Dodge game targeting <canvas id="game"></canvas>
// Core: ship (triangle), moving asteroids (circles), starfield background.
// Controls: ArrowLeft / ArrowRight to move horizontally, ArrowUp for a boost upward.
// Score = distance traveled (frames). No external assets.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // canvas must exist
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth;
  const height = canvas.height = canvas.offsetHeight;

  // ----- Game state -----
  const ship = { x: width / 2, y: height - 60, w: 20, h: 30, vx: 0, vy: 0 };
  const asteroids = [];
  let stars = [];
  let frame = 0;
  let score = 0;
  let running = true;

  // ----- Input & Sound -----
  const keys = {};
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playBoost() { playTone(600, 0.1); }
  function playCollision() { playTone(150, 0.4); }
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (e.key === 'ArrowUp') playBoost();
  });
  window.addEventListener('keyup', e => keys[e.key] = false);

  // ----- Helpers -----
  function rand(min, max) { return Math.random() * (max - min) + min; }
  function addStar() { stars.push({ x: rand(0, width), y: rand(0, height), r: rand(0.5, 1.5) }); }
  function addAsteroid() {
    const radius = rand(10, 30);
    asteroids.push({ x: width + radius, y: rand(radius, height - radius), r: radius, vx: -rand(1, 3) });
  }
  function trianglePath(x, y, w, h) {
    ctx.beginPath();
    ctx.moveTo(x, y - h / 2);
    ctx.lineTo(x - w / 2, y + h / 2);
    ctx.lineTo(x + w / 2, y + h / 2);
    ctx.closePath();
  }
  function checkCollision(ast) {
    // simple circle vs triangle bounding circle
    const dx = ast.x - ship.x;
    const dy = ast.y - ship.y;
    const dist = Math.hypot(dx, dy);
    return dist < ast.r + Math.max(ship.w, ship.h) / 2;
  }

  // Populate initial stars
  for (let i = 0; i < 100; i++) addStar();

  // ----- Main loop -----
  function update() {
    if (!running) return;
    frame++;
    score = Math.floor(frame / 60);

    // Move ship based on input
    const accel = 0.2;
    if (keys.ArrowLeft) ship.vx = -2;
    else if (keys.ArrowRight) ship.vx = 2;
    else ship.vx *= 0.95; // friction
    if (keys.ArrowUp) ship.vy = -4; // boost upward
    else ship.vy *= 0.98; // gravity like pull down

    ship.x += ship.vx;
    ship.y += ship.vy;
    // Keep ship inside canvas
    ship.x = Math.max(ship.w / 2, Math.min(width - ship.w / 2, ship.x));
    ship.y = Math.max(ship.h / 2, Math.min(height - ship.h / 2, ship.y));

    // Add asteroids periodically
    if (frame % 90 === 0) addAsteroid();

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx;
      if (a.x + a.r < 0) asteroids.splice(i, 1);
      else if (checkCollision(a)) { playCollision(); running = false; }
    }

    // Update stars for scrolling effect
    for (let s of stars) {
      s.x -= 0.5;
      if (s.x < 0) s.x = width;
    }
  }

  function draw() {
    // Background gradient (dark space to deep blue)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001030');
    bgGrad.addColorStop(1, '#000000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // Stars – draw as small circles with slight flicker
    for (let s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,' + (0.5 + Math.random() * 0.5) + ')';
      ctx.fill();
    }
    // Ship – gradient green triangle
    const shipGrad = ctx.createLinearGradient(ship.x - ship.w / 2, ship.y - ship.h / 2, ship.x + ship.w / 2, ship.y + ship.h / 2);
    shipGrad.addColorStop(0, '#00ff00');
    shipGrad.addColorStop(1, '#006600');
    ctx.fillStyle = shipGrad;
    trianglePath(ship.x, ship.y, ship.w, ship.h);
    ctx.fill();
    // Asteroids – radial gradient for depth
    for (let a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#b5651d');
      grad.addColorStop(1, '#3a1f00');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
      ctx.fillText('Final Score: ' + score, width / 2, height / 2 + 30);
    }
  }

  function loop() {
    update();
    draw();
    if (running) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
