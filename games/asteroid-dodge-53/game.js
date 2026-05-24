// Simple Asteroid Dodge game – targets canvas with id "game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // ----- Visual enhancements -----
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height, size: Math.random() * 2 + 1, speed: Math.random() * 0.5 + 0.2 });
  }

  // ----- Audio setup -----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // ----- Game entities -----
  const ship = { x: 100, y: height / 2, w: 30, h: 20, speed: 4 };
  let shield = 0; // remaining shield hits

  const asteroids = [];
  const powerUps = [];

  // ----- Input handling -----
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; audioCtx.resume(); });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // ----- Helper functions -----
  function spawnAsteroid() {
    const size = Math.random() * 30 + 15;
    asteroids.push({
      x: width + size,
      y: Math.random() * (height - size),
      r: size,
      vx: -(Math.random() * 2 + 1),
      vy: (Math.random() - 0.5) * 1.5,
    });
  }

  function spawnPowerUp() {
    const size = 20;
    powerUps.push({
      x: width + size,
      y: Math.random() * (height - size),
      w: size,
      h: size,
      vx: -2,
      ttl: 600, // frames before disappearing
    });
  }

  function rectCircleCollide(rect, circle) {
    const distX = Math.abs(circle.x - rect.x - rect.w / 2);
    const distY = Math.abs(circle.y - rect.y - rect.h / 2);
    if (distX > rect.w / 2 + circle.r) return false;
    if (distY > rect.h / 2 + circle.r) return false;
    if (distX <= rect.w / 2) return true;
    if (distY <= rect.h / 2) return true;
    const dx = distX - rect.w / 2;
    const dy = distY - rect.h / 2;
    return dx * dx + dy * dy <= circle.r * circle.r;
  }

  function rectRectCollide(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  // ----- Game loop -----
  let frame = 0;
  let gameOver = false;

  function update() {
    if (gameOver) return;
    // move ship
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    ship.y = Math.max(0, Math.min(height - ship.h, ship.y));
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));

    // spawn asteroids
    if (frame % 60 === 0) spawnAsteroid(); // roughly 1 per second
    // occasional power‑up
    if (frame % 600 === 0) spawnPowerUp(); // every 10 seconds

    // update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx;
      a.y += a.vy;
      if (a.x + a.r < 0) asteroids.splice(i, 1);
      else if (rectCircleCollide(ship, a)) {
        if (shield > 0) {
          shield--;
          beep(200, 0.2); // hit sound with shield
        } else {
          gameOver = true;
          beep(100, 0.5); // game over sound
        }
        asteroids.splice(i, 1);
      }
    }

    // update power‑ups
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const p = powerUps[i];
      p.x += p.vx;
      p.ttl--;
      if (p.x + p.w < 0 || p.ttl <= 0) powerUps.splice(i, 1);
      else if (rectRectCollide(ship, p)) {
        shield = 3; // grant 3 shield hits
        beep(400, 0.2); // power‑up sound
        powerUps.splice(i, 1);
      }
    }

    frame++;
    draw();
    requestAnimationFrame(update);
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // background stars
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
    // ship (triangle)
    ctx.fillStyle = shield ? '#00f' : '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h / 2);
    ctx.lineTo(ship.x + ship.w, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // asteroids with radial gradient
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // power‑ups (pulsing circles)
    ctx.fillStyle = '#ff0';
    for (const p of powerUps) {
      const pulse = Math.abs(Math.sin(p.ttl / 10));
      ctx.beginPath();
      ctx.arc(p.x + p.w / 2, p.y + p.h / 2, (p.w / 2) * (0.8 + 0.2 * pulse), 0, Math.PI * 2);
      ctx.fill();
    }
    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Shield: ' + shield, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  // start
  requestAnimationFrame(update);
})();
