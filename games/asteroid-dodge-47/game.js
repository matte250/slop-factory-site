// Simple Asteroid Dodge game – targets <canvas id="game">.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // no canvas present
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;

  // ==== Game state ==== //
  const ship = { x: width / 2, y: height - 30, w: 20, h: 30, speed: 4 };
  const asteroids = [];
  const powerUps = [];
  let left = false, right = false, up = false, down = false;
  let gameOver = false;

  // ==== Audio ==== //
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.stop(audioCtx.currentTime + duration / 1000);
  }

  // ==== Input ==== //
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') left = true;
    if (e.key === 'ArrowRight') right = true;
    if (e.key === 'ArrowUp') up = true;
    if (e.key === 'ArrowDown') down = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') left = false;
    if (e.key === 'ArrowRight') right = false;
    if (e.key === 'ArrowUp') up = false;
    if (e.key === 'ArrowDown') down = false;
  });

  // mouse move also controls ship
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    ship.x = e.clientX - rect.left;
    ship.y = e.clientY - rect.top;
  });

  // ==== Helpers ==== //
  const rand = (min, max) => Math.random() * (max - min) + min;

  // --- Starfield --- //
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({ x: rand(0, width), y: rand(0, height), size: rand(0.5, 2), speed: rand(0.2, 0.6) });
  }
  function updateStars(dt) {
    for (let s of stars) {
      s.y += s.speed * dt * 0.05;
      if (s.y > height) { s.y = 0; s.x = rand(0, width); }
    }
  }

  function spawnAsteroid() {
    const size = rand(15, 40);
    const verts = Math.floor(rand(5, 9));
    const hue = Math.floor(rand(0, 360));
    const color = `hsl(${hue}, 30%, 30%)`;
    asteroids.push({ x: rand(0, width - size), y: -size, size, speed: rand(1, 3), verts, color });
  }

  function spawnPowerUp() {
    const size = 20;
    powerUps.push({ x: rand(0, width - size), y: -size, size, speed: 2, angle: 0, duration: 5000 });
  }

  function rectCollide(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  // ==== Main loop ==== //
  let asteroidTimer = 0, powerTimer = 0, shield = false, shieldTime = 0;

  function update(dt) {
    if (gameOver) return;
    // starfield movement
    updateStars(dt);
    // ship movement
    if (left) ship.x -= ship.speed;
    if (right) ship.x += ship.speed;
    if (up) ship.y -= ship.speed;
    if (down) ship.y += ship.speed;
    // keep within bounds
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));
    ship.y = Math.max(0, Math.min(height - ship.h, ship.y));

    // spawn asteroids
    asteroidTimer += dt;
    if (asteroidTimer > 800) { spawnAsteroid(); asteroidTimer = 0; }
    // spawn power‑ups occasionally
    powerTimer += dt;
    if (powerTimer > 5000) { spawnPowerUp(); powerTimer = 0; }

    // update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      if (a.y - a.size > height) asteroids.splice(i, 1);
    }
    // update power‑ups
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const p = powerUps[i];
      p.y += p.speed;
      p.angle += dt * 0.003; // rotate faster
      if (p.y - p.size > height) { powerUps.splice(i, 1); continue; }
      if (rectCollide({ x: ship.x, y: ship.y, w: ship.w, h: ship.h }, { x: p.x, y: p.y, w: p.size, h: p.size })) {
        shield = true; shieldTime = 4000; powerUps.splice(i, 1);
        playTone(800, 150);
      }
    }
    // collision with asteroids (after movement)
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      if (!shield && rectCollide({ x: ship.x, y: ship.y, w: ship.w, h: ship.h }, { x: a.x, y: a.y, w: a.size, h: a.size })) {
        gameOver = true;
        playTone(200, 500);
      }
    }
    if (shield) {
      shieldTime -= dt;
      if (shieldTime <= 0) shield = false;
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);
    // starfield background
    ctx.fillStyle = 'white';
    stars.forEach(s => {
      ctx.fillRect(s.x, s.y, s.size, s.size);
    });
    // ship with optional glow
    ctx.fillStyle = shield ? 'gold' : 'white';
    if (shield) {
      ctx.shadowBlur = 15;
      ctx.shadowColor = 'rgba(255,215,0,0.7)';
    } else {
      ctx.shadowBlur = 0;
    }
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y);
    ctx.lineTo(ship.x - ship.w / 2, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // asteroids (irregular polygon)
    ctx.fillStyle = 'gray';
    asteroids.forEach(a => {
      const { x, y, size, verts, color } = a;
      ctx.fillStyle = color || 'gray';
      ctx.beginPath();
      for (let i = 0; i < verts; i++) {
        const angle = (Math.PI * 2 / verts) * i;
        const radius = size / 2 * (0.7 + Math.random() * 0.6);
        const vx = x + size / 2 + Math.cos(angle) * radius;
        const vy = y + size / 2 + Math.sin(angle) * radius;
        i === 0 ? ctx.moveTo(vx, vy) : ctx.lineTo(vx, vy);
      }
      ctx.closePath();
      ctx.fill();
    });
    // power‑ups (rotating squares)
    ctx.fillStyle = 'cyan';
    powerUps.forEach(p => {
      ctx.save();
      ctx.translate(p.x + p.size / 2, p.y + p.size / 2);
      ctx.rotate(p.angle);
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    });
    // game over text
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  let last = performance.now();
  function loop(now) {
    const dt = now - last;
    last = now;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
