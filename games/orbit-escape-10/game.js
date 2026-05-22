// Orbit Escape – enhanced graphics
// Targets canvas with id="game"

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Audio context and simple tone generator
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // ------- Settings -------
  const GRAVITY = 0.05; // planet pull towards center
  const THRUST = 0.2;
  const SHIP_RADIUS = 6;
  const ASTEROID_RADIUS = 12;
  const ASTEROID_SPAWN_INTERVAL = 2000; // ms
  const MAX_ASTEROIDS = 20;
  const BOUNDARY = Math.min(width, height) / 2 - 20;

  // ------- Game state -------
  const ship = {
    x: width / 2,
    y: height / 2 - BOUNDARY / 2,
    vx: 0,
    vy: 0,
    angle: Math.PI / 2, // facing clockwise
  };

  const asteroids = [];
  let lastAsteroidTime = 0;
  let gameOver = false;

  // ------- Helpers -------
  function dist(ax, ay, bx, by) {
    const dx = ax - bx;
    const dy = ay - by;
    return Math.hypot(dx, dy);
  }

  function spawnAsteroid() {
    // spawn at random angle around the circle outside boundary
    const angle = Math.random() * Math.PI * 2;
    const radius = BOUNDARY + 30 + Math.random() * 50;
    const x = width / 2 + Math.cos(angle) * radius;
    const y = height / 2 + Math.sin(angle) * radius;
    // velocity directed roughly toward centre with some variance
    const speed = 0.5 + Math.random() * 0.3;
    const vx = -Math.cos(angle) * speed + (Math.random() - 0.5) * 0.2;
    const vy = -Math.sin(angle) * speed + (Math.random() - 0.5) * 0.2;
    asteroids.push({ x, y, vx, vy });
    if (asteroids.length > MAX_ASTEROIDS) asteroids.shift();
  }

  function update(dt) {
    if (gameOver) return;
    // Apply gravity towards centre (planet at canvas centre)
    const cx = width / 2;
    const cy = height / 2;
    const dx = cx - ship.x;
    const dy = cy - ship.y;
    const distToCenter = Math.hypot(dx, dy) || 1;
    ship.vx += (dx / distToCenter) * GRAVITY * dt;
    ship.vy += (dy / distToCenter) * GRAVITY * dt;

    // Update ship position
    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;

    // Simple boundary lose condition (drift too far)
if (distToCenter > BOUNDARY * 1.5) {
        playTone(150, 0.3);
        gameOver = true;
      }

    // Update asteroids
    for (const a of asteroids) {
      a.x += a.vx * dt;
      a.y += a.vy * dt;
    }

    // Collision detection
    for (const a of asteroids) {
      if (dist(ship.x, ship.y, a.x, a.y) < SHIP_RADIUS + ASTEROID_RADIUS) {
        playTone(200, 0.3); // collision sound
        gameOver = true;
        break;
      }
    }

    // Spawn asteroids over time
    const now = performance.now();
    if (now - lastAsteroidTime > ASTEROID_SPAWN_INTERVAL) {
      spawnAsteroid();
      lastAsteroidTime = now;
    }
  }

  // ----- Graphics helpers -----
const stars = [];
for (let i = 0; i < 150; i++) {
  stars.push({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 1.2 + 0.2,
    alpha: Math.random() * 0.5 + 0.3,
  });
}

function drawBackground() {
  ctx.fillStyle = '#000010';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#fff';
  for (const s of stars) {
    ctx.globalAlpha = s.alpha;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawPlanet() {
  const grad = ctx.createRadialGradient(width / 2, height / 2, 5, width / 2, height / 2, 30);
  grad.addColorStop(0, '#5577aa');
  grad.addColorStop(1, '#223344');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(width / 2, height / 2, 30, 0, Math.PI * 2);
  ctx.fill();
}

// Ship trail buffer
const trail = [];
const MAX_TRAIL = 20;

function drawShip() {
  // add current position to trail
  trail.push({ x: ship.x, y: ship.y, angle: ship.angle });
  if (trail.length > MAX_TRAIL) trail.shift();

  // draw trail with fading
  for (let i = 0; i < trail.length; i++) {
    const p = trail[i];
    const t = i / trail.length;
    ctx.save();
    ctx.globalAlpha = (1 - t) * 0.4;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    ctx.fillStyle = '#00ff44';
    ctx.beginPath();
    ctx.moveTo(0, -SHIP_RADIUS);
    ctx.lineTo(SHIP_RADIUS * 0.6, SHIP_RADIUS);
    ctx.lineTo(-SHIP_RADIUS * 0.6, SHIP_RADIUS);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // draw current ship with glow
  ctx.save();
  ctx.shadowBlur = 12;
  ctx.shadowColor = '#00ff44';
  ctx.translate(ship.x, ship.y);
  ctx.rotate(ship.angle);
  ctx.fillStyle = '#00ff88';
  ctx.beginPath();
  ctx.moveTo(0, -SHIP_RADIUS);
  ctx.lineTo(SHIP_RADIUS, SHIP_RADIUS);
  ctx.lineTo(-SHIP_RADIUS, SHIP_RADIUS);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.shadowBlur = 0;
}

function drawAsteroid(a) {
  // irregular polygon
  ctx.save();
  ctx.translate(a.x, a.y);
  ctx.fillStyle = '#aaa';
  ctx.beginPath();
  const points = 7;
  const radius = ASTEROID_RADIUS;
  for (let i = 0; i < points; i++) {
    const ang = (i / points) * Math.PI * 2;
    const r = radius * (0.7 + Math.random() * 0.3);
    ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function draw() {
  drawBackground();
  drawPlanet();

  // Draw ship (including trail)
  drawShip();

  // Draw asteroids
  for (const a of asteroids) {
    drawAsteroid(a);
  }

  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#ff4444';
    ctx.font = '36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', width / 2, height / 2);
  }
}


  // Input – brief thrust on key press (space or up arrow)
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      // Ensure audio context is running (user gesture)
      if (audioCtx.state !== 'running') audioCtx.resume();
      // Apply brief thrust in current direction
      ship.vx += Math.cos(ship.angle) * THRUST;
      ship.vy += Math.sin(ship.angle) * THRUST;
      playTone(400, 0.1); // thrust sound
    }
  });

  // Main loop
  let lastTime = performance.now();
  function loop() {
    const now = performance.now();
    const dt = (now - lastTime) / 16; // normalize to ~60fps units
    lastTime = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
