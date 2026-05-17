// Simple Celestial Chase game – enhanced graphics
// Targets <canvas id="game"></canvas>
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;
  // Generate a simple starfield for background
  const stars = [];
  for (let i = 0; i < 200; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.2 + 0.3,
    });
  }
  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }

  // ---------- Player ----------
  const ship = {
    x: width / 2,
    y: height / 2,
    angle: 0,
    vx: 0,
    vy: 0,
    radius: 12,
    hull: 3,
    thrust: 0.1,
    turnSpeed: 0.07,
  };

  // ---------- Input ----------
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.code] = true));
  window.addEventListener('keyup', e => (keys[e.code] = false));

  // ---------- Game objects ----------
  const lasers = [];
  const asteroids = [];
  const orbs = [];

  let score = 0;
  let lastAsteroid = 0;
  let lastOrb = 0;
  const asteroidInterval = 1500; // ms
  const orbInterval = 5000;

  function spawnAsteroid() {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 1.5;
    const size = 20 + Math.random() * 30;
    const edge = Math.floor(Math.random() * 4);
    let x, y, dx, dy;
    switch (edge) {
      case 0: // top
        x = Math.random() * width; y = -size; break;
      case 1: // right
        x = width + size; y = Math.random() * height; break;
      case 2: // bottom
        x = Math.random() * width; y = height + size; break;
      case 3: // left
        x = -size; y = Math.random() * height; break;
    }
    dx = Math.cos(angle) * speed;
    dy = Math.sin(angle) * speed;
    asteroids.push({x, y, dx, dy, size});
  }

  function spawnOrb() {
    const x = Math.random() * width;
    const y = Math.random() * height;
    orbs.push({x, y, radius: 8, ttl: 8000});
  }

  function update(delta) {
    // Player controls
    if (keys['ArrowLeft'] || keys['KeyA']) ship.angle -= ship.turnSpeed;
    if (keys['ArrowRight'] || keys['KeyD']) ship.angle += ship.turnSpeed;
    if (keys['ArrowUp'] || keys['KeyW']) {
      ship.vx += Math.cos(ship.angle) * ship.thrust;
      ship.vy += Math.sin(ship.angle) * ship.thrust;
    }
    // Fire laser
    if (keys['Space']) {
      // simple rate limit
      if (!ship.lastShot || Date.now() - ship.lastShot > 200) {
        ship.lastShot = Date.now();
        // play shooting sound
        playTone(800, 0.07);
        lasers.push({
          x: ship.x,
          y: ship.y,
          dx: Math.cos(ship.angle) * 6,
          dy: Math.sin(ship.angle) * 6,
          ttl: 800,
        });
      }
    }
    // Move ship
    ship.x += ship.vx;
    ship.y += ship.vy;
    // friction
    ship.vx *= 0.99;
    ship.vy *= 0.99;
    // wrap around edges
    if (ship.x < 0) ship.x += width;
    if (ship.x > width) ship.x -= width;
    if (ship.y < 0) ship.y += height;
    if (ship.y > height) ship.y -= height;

    // Update lasers
    for (let i = lasers.length - 1; i >= 0; i--) {
      const l = lasers[i];
      l.x += l.dx;
      l.y += l.dy;
      l.ttl -= delta;
      if (l.ttl <= 0) lasers.splice(i, 1);
    }

    // Spawn asteroids
    if (Date.now() - lastAsteroid > asteroidInterval) {
      spawnAsteroid();
      lastAsteroid = Date.now();
    }
    // Spawn orbs
    if (Date.now() - lastOrb > orbInterval) {
      spawnOrb();
      lastOrb = Date.now();
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.dx;
      a.y += a.dy;
      // remove if off‑screen
      if (a.x < -a.size || a.x > width + a.size || a.y < -a.size || a.y > height + a.size) {
        asteroids.splice(i, 1);
      }
    }

    // Update orbs
    for (let i = orbs.length - 1; i >= 0; i--) {
      const o = orbs[i];
      o.ttl -= delta;
      if (o.ttl <= 0) orbs.splice(i, 1);
    }

    // Collision detection
    // ship vs asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      const dx = ship.x - a.x;
      const dy = ship.y - a.y;
      const dist = Math.hypot(dx, dy);
          if (dist < ship.radius + a.size / 2) {
            ship.hull--;
            // hit sound
            playTone(200, 0.3);
            asteroids.splice(i, 1);
            if (ship.hull <= 0) {
              alert('Game Over! Score: ' + score);
              document.location.reload();
              return;
            }
          }
    }
    // lasers vs asteroids
    for (let i = lasers.length - 1; i >= 0; i--) {
      const l = lasers[i];
      for (let j = asteroids.length - 1; j >= 0; j--) {
        const a = asteroids[j];
        if (Math.hypot(l.x - a.x, l.y - a.y) < a.size / 2) {
          score += 10;
          lasers.splice(i, 1);
          asteroids.splice(j, 1);
          break;
        }
      }
    }
    // ship vs orbs
    for (let i = orbs.length - 1; i >= 0; i--) {
      const o = orbs[i];
      if (Math.hypot(ship.x - o.x, ship.y - o.y) < ship.radius + o.radius) {
        score += 5;
        orbs.splice(i, 1);
      }
    }
  }

  function draw() {
    // draw starfield background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    // ship
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.strokeStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(-10, -8);
    ctx.lineTo(-10, 8);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
    // lasers
    ctx.fillStyle = '#ff0';
    lasers.forEach(l => ctx.fillRect(l.x - 1, l.y - 1, 2, 2));
    // asteroids
    ctx.strokeStyle = '#888';
    asteroids.forEach(a => {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.size / 2, 0, Math.PI * 2);
      ctx.stroke();
    });
    // orbs
    ctx.fillStyle = '#0ff';
    orbs.forEach(o => ctx.beginPath() || ctx.arc(o.x, o.y, o.radius, 0, Math.PI * 2) && ctx.fill());
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    ctx.fillText('Hull: ' + ship.hull, 10, 40);
  }

  let last = performance.now();
  function loop(ts) {
    const delta = ts - last;
    last = ts;
    update(delta);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
