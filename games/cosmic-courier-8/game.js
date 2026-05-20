// Cosmic Courier – minimal canvas game
// Target canvas: <canvas id="game"></canvas>

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // safety in case HTML changes
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth;
  const height = canvas.height = canvas.offsetHeight;
  // background stars
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height, r: Math.random() * 1.5 + 0.5 });
  }
  // background gradient
  const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
  bgGradient.addColorStop(0, '#001');
  bgGradient.addColorStop(1, '#000');
  // audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // resume audio on user interaction
  window.addEventListener('keydown', () => { if (audioCtx.state === 'suspended') audioCtx.resume(); }, { once: true });
  function playSound(freq, duration, type = 'sine') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  function playThrust() { playSound(300, 100, 'triangle'); }
  function playExplosion() { playSound(80, 400, 'sawtooth'); }
  function playCollect() { playSound(600, 80, 'square'); }
  // particle system for thrust and explosions
  const particles = [];
  function spawnParticle(x, y, vx, vy, life, color) {
    particles.push({ x, y, vx, vy, life, color });
  }
  function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }
  function drawBackground() {
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);
  }
  function drawStars() {
    ctx.fillStyle = '#555';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  function drawParticles() {
    for (const p of particles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(p.life / 30, 0);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // ----------- Input handling -----------
  const keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false, Space: false, KeyA: false, KeyD: false, KeyW: false };
  window.addEventListener('keydown', e => { if (e.code in keys) keys[e.code] = true; });
  window.addEventListener('keyup', e => { if (e.code in keys) keys[e.code] = false; });

  // ----------- Game objects -----------
  const ship = {
    x: width / 2,
    y: height / 2,
    angle: -Math.PI / 2,
    vx: 0,
    vy: 0,
    radius: 10,
    boostTimer: 0,
  };

  const asteroids = [];
  const cargos = [];
  let score = 0;
  let gameOver = false;
  let spawnTimer = 0;
  let cargoTimer = 0;
  let difficulty = 0;

  // ----------- Helper functions -----------
  const rand = (min, max) => Math.random() * (max - min) + min;
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  function spawnAsteroid() {
    const edge = Math.floor(rand(0, 4)); // 0 top,1 right,2 bottom,3 left
    const size = rand(15, 30);
    const speed = rand(0.5, 1.5) + difficulty * 0.2;
    let x, y, vx, vy;
    switch (edge) {
      case 0: x = rand(0, width); y = -size; vx = rand(-1, 1); vy = speed; break;
      case 1: x = width + size; y = rand(0, height); vx = -speed; vy = rand(-1, 1); break;
      case 2: x = rand(0, width); y = height + size; vx = rand(-1, 1); vy = -speed; break;
      case 3: x = -size; y = rand(0, height); vx = speed; vy = rand(-1, 1); break;
    }
    asteroids.push({ x, y, vx, vy, r: size });
  }

  function spawnCargo() {
    const size = 12;
    const x = rand(size, width - size);
    const y = rand(size, height - size);
    cargos.push({ x, y, size, collected: false });
  }

  function updateShip(dt) {
    const thrust = (keys.ArrowUp || keys.KeyW) ? 0.1 : 0;
    const boost = (keys.Space && ship.boostTimer <= 0) ? 0.3 : 0;
    if (boost) ship.boostTimer = 30; // frames of boost
    const accel = thrust + (ship.boostTimer > 0 ? boost : 0);
    if (accel) {
      ship.vx += Math.cos(ship.angle) * accel;
      ship.vy += Math.sin(ship.angle) * accel;
      // play thrust sound
      playThrust();
      // spawn thrust particles
      const angle = ship.angle + Math.PI; // opposite direction
      const speed = 0.5;
      spawnParticle(
        ship.x + Math.cos(angle) * ship.radius,
        ship.y + Math.sin(angle) * ship.radius,
        Math.cos(angle) * speed + (Math.random() - 0.5) * 0.2,
        Math.sin(angle) * speed + (Math.random() - 0.5) * 0.2,
        30,
        'orange'
      );
    }
    // rotation
    if (keys.ArrowLeft || keys.KeyA) ship.angle -= 0.06;
    if (keys.ArrowRight || keys.KeyD) ship.angle += 0.06;
    // friction
    ship.vx *= 0.99;
    ship.vy *= 0.99;
    // position
    ship.x += ship.vx;
    ship.y += ship.vy;
    // keep within bounds – hitting edge ends game
    if (ship.x < 0 || ship.x > width || ship.y < 0 || ship.y > height) gameOver = true;
    // decrement boost timer
    if (ship.boostTimer > 0) ship.boostTimer--;
  }

  function updateAsteroids(dt) {
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx;
      a.y += a.vy;
      // remove if far off-screen
      if (a.x < -a.r || a.x > width + a.r || a.y < -a.r || a.y > height + a.r) asteroids.splice(i, 1);
    }
  }

  function checkCollisions() {
    // ship vs asteroids
    for (const a of asteroids) {
      if (distance(ship, a) < ship.radius + a.r) {
        // explode ship with sound and particles
        playExplosion();
        for (let i = 0; i < 30; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 2 + 0.5;
          spawnParticle(
            ship.x,
            ship.y,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            40,
            'red'
          );
        }
        gameOver = true;
        return;
      }
    }
    // ship vs cargo
    for (let i = cargos.length - 1; i >= 0; i--) {
      const c = cargos[i];
      if (!c.collected && Math.abs(ship.x - c.x) < ship.radius + c.size && Math.abs(ship.y - c.y) < ship.radius + c.size) {
        c.collected = true;
        score += 10;
        cargos.splice(i, 1);
        playCollect();
      }
    }
  }

  function drawShip() {
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-8, -6);
    ctx.lineTo(-8, 6);
    ctx.closePath();
    ctx.fillStyle = '#0ff';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  function drawAsteroids() {
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#444');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawCargos() {
    for (const c of cargos) {
      if (!c.collected) {
        const grad = ctx.createRadialGradient(
          c.x,
          c.y,
          c.size * 0.2,
          c.x,
          c.y,
          c.size
        );
        grad.addColorStop(0, '#ff0');
        grad.addColorStop(1, '#aa0');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawHUD() {
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f44';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  // ----------- Main loop -----------
  let last = performance.now();
  function loop(now) {
    const dt = now - last;
    last = now;
    if (!gameOver) {
      // spawn logic
      spawnTimer += dt;
      cargoTimer += dt;
      if (spawnTimer > 2000 - difficulty * 100) { // faster spawns
        spawnAsteroid();
        spawnTimer = 0;
        difficulty += 0.01;
      }
      if (cargoTimer > 5000) { spawnCargo(); cargoTimer = 0; }
      // updates
      updateShip(dt);
      updateAsteroids(dt);
      updateParticles();
      checkCollisions();
    }
    // draw
    drawBackground();
    drawStars();
    drawShip();
    drawAsteroids();
    drawCargos();
    drawParticles();
    drawHUD();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
