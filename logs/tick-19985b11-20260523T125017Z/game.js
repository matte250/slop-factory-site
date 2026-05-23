// Simple Asteroid Escape game with enhanced graphics
// Canvas with id="game" must exist in the HTML.
(() => {
  // ----- audio setup -----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let thrustOsc = null;
  function playThrust(start) {
    if (start) {
      if (thrustOsc) return;
      thrustOsc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      thrustOsc.frequency.setValueAtTime(200, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      thrustOsc.connect(gain).connect(audioCtx.destination);
      thrustOsc.start();
    } else {
      if (thrustOsc) {
        thrustOsc.stop();
        thrustOsc.disconnect();
        thrustOsc = null;
      }
    }
  }
  function playShoot() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.setValueAtTime(600, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
  }
  function playExplosion() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.setValueAtTime(100, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
  }
  function playFuel() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  }
  function playGameOver() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.setValueAtTime(50, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 1);
  }

  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;

  // ---- starfield background ----
  const stars = [];
  for (let i = 0; i < 200; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height, r: Math.random() * 1.5 + 0.5 });
  }

  // ---------- game objects ----------
  const ship = {
    x: width / 2,
    y: height / 2,
    angle: 0,
    vx: 0,
    vy: 0,
    radius: 10,
    fuel: 100,
  };

  const bullets = [];
  const asteroids = [];
  const fuels = [];

  // ---------- helper functions ----------
  const rand = (min, max) => Math.random() * (max - min) + min;
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  function spawnAsteroid() {
    const edge = Math.floor(rand(0, 4));
    const pos = { x: 0, y: 0 };
    switch (edge) {
      case 0: pos.x = 0; pos.y = rand(0, height); break; // left
      case 1: pos.x = width; pos.y = rand(0, height); break; // right
      case 2: pos.x = rand(0, width); pos.y = 0; break; // top
      case 3: pos.x = rand(0, width); pos.y = height; break; // bottom
    }
    const speed = rand(0.5, 2);
    const angle = Math.atan2(ship.y - pos.y, ship.x - pos.x);
    asteroids.push({ x: pos.x, y: pos.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, r: rand(15, 30) });
  }

  function spawnFuel() {
    fuels.push({ x: rand(0, width), y: rand(0, height), r: 8, value: 30 });
  }

  // ---------- input ----------
  const keys = {};
  window.addEventListener('keydown', e => {
    // resume audio context on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.code] = true;
    if (e.code === 'Space') playShoot();
  });
  window.addEventListener('keyup', e => {
    keys[e.code] = false;
    if (e.code === 'ArrowUp') playThrust(false);
  });

  // ---------- game loop ----------
  let last = performance.now();
  let asteroidTimer = 0;
  let fuelTimer = 0;
  let gameOver = false;
  let startTime = performance.now();

  function update(dt) {
    if (gameOver) return;
    // ship control
    if (keys['ArrowLeft']) ship.angle -= 3 * dt;
    if (keys['ArrowRight']) ship.angle += 3 * dt;
    if (keys['ArrowUp'] && ship.fuel > 0) {
      const thrust = 0.1;
      ship.vx += Math.cos(ship.angle) * thrust;
      ship.vy += Math.sin(ship.angle) * thrust;
      ship.fuel -= dt * 5; // fuel consumption
      playThrust(true);
    } else {
      playThrust(false);
    }
    // shoot
    if (keys['Space']) {
      if (!ship._lastShot || performance.now() - ship._lastShot > 200) {
        bullets.push({ x: ship.x, y: ship.y, vx: Math.cos(ship.angle) * 5, vy: Math.sin(ship.angle) * 5, ttl: 1000 });
        ship._lastShot = performance.now();
      }
    }
    // update ship position
    ship.x += ship.vx; ship.y += ship.vy;
    // wrap around edges
    if (ship.x < 0) ship.x += width; if (ship.x > width) ship.x -= width;
    if (ship.y < 0) ship.y += height; if (ship.y > height) ship.y -= height;
    // friction
    ship.vx *= 0.99; ship.vy *= 0.99;

    // bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.x += b.vx; b.y += b.vy; b.ttl -= dt * 1000;
      if (b.ttl <= 0) { bullets.splice(i, 1); continue; }
    }

    // asteroids
    asteroids.forEach(a => { a.x += a.vx; a.y += a.vy; });
    // spawn asteroids
    asteroidTimer += dt;
    if (asteroidTimer > 1.5) { spawnAsteroid(); asteroidTimer = 0; }

    // fuels
    fuelTimer += dt;
    if (fuelTimer > 5) { spawnFuel(); fuelTimer = 0; }

    // collisions
    // ship-asteroid
    let gameOverTriggered = false;
    for (const a of asteroids) {
      if (distance(ship, a) < ship.radius + a.r) {
        if (!gameOver) {
          playExplosion();
          playGameOver();
        }
        gameOver = true;
        gameOverTriggered = true;
      }
    }
    // bullet-asteroid
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      for (let j = asteroids.length - 1; j >= 0; j--) {
        const a = asteroids[j];
        if (distance(b, a) < a.r) {
          // destroy asteroid with explosion sound
          playExplosion();
          bullets.splice(i, 1);
          asteroids.splice(j, 1);
          break;
        }
      }
    }
    // ship-fuel
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
      if (distance(ship, f) < ship.radius + f.r) {
        ship.fuel = Math.min(100, ship.fuel + f.value);
        fuels.splice(i, 1);
      }
    }
    // out of fuel
    if (ship.fuel <= 0) gameOver = true;
  }

  function draw() {
    // starfield background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = 'white';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // ship with thrust flame
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    // thrust flame when accelerating
    if (keys['ArrowUp'] && ship.fuel > 0) {
      ctx.beginPath();
      ctx.moveTo(-12, 0);
      ctx.lineTo(-22, -5);
      ctx.lineTo(-22, 5);
      ctx.closePath();
      ctx.fillStyle = 'orange';
      ctx.fill();
    }
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(-10, -8);
    ctx.lineTo(-10, 8);
    ctx.closePath();
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    // fuel bar with gradient
    const fuelGrad = ctx.createLinearGradient(10, 10, 110, 10);
    fuelGrad.addColorStop(0, 'red');
    fuelGrad.addColorStop(1, 'lime');
    ctx.fillStyle = fuelGrad;
    ctx.fillRect(10, 10, ship.fuel, 5);
    // bullets with glow
    ctx.fillStyle = 'yellow';
    ctx.shadowColor = 'yellow';
    ctx.shadowBlur = 8;
    bullets.forEach(b => ctx.beginPath(), ctx.arc(b.x, b.y, 3, 0, Math.PI * 2), ctx.fill());
    ctx.shadowBlur = 0;
    // asteroids with gradient fill
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#222');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#555';
      ctx.stroke();
    });
    // fuel pickups with glow
    fuels.forEach(f => {
      ctx.save();
      ctx.shadowColor = 'lime';
      ctx.shadowBlur = 6;
      ctx.fillStyle = 'lime';
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    // time display
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
    ctx.fillStyle = 'white';
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 4;
    ctx.fillText(`Time: ${elapsed}s`, width - 100, 20);
    ctx.shadowBlur = 0;
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2 - 60, height / 2);
    }
  }

  function loop(now) {
    const dt = (now - last) / 1000;
    last = now;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
