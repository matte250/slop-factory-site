// Simple Orbit Escape game
// Canvas with id="game" expected in HTML
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Audio assets
  const thrustSound = new Audio('thrust.wav');
  const explosionSound = new Audio('explosion.wav');
  const bgMusic = new Audio('background.mp3');
  bgMusic.loop = true;
  bgMusic.volume = 0.3;
  bgMusic.play().catch(() => {});
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;
  // generate starfield once
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height, r: Math.random() * 1.5 + 0.5 });
  }

  // Planet at centre with gradient
  const planet = { x: width / 2, y: height / 2, r: 40 };
  const planetGradient = ctx.createRadialGradient(planet.x, planet.y, planet.r * 0.2, planet.x, planet.y, planet.r);
  planetGradient.addColorStop(0, '#88ff88');
  planetGradient.addColorStop(1, '#226622');

  // Satellite state
  const sat = {
    x: planet.x + 120,
    y: planet.y,
    vx: 0,
    vy: -1.5,
    size: 8
  };

  // Thrust parameters
  const THRUST = 0.05;

  // Meteor pool
  const meteors = [];
  const METEOR_INTERVAL = 2000; // ms
  const METEOR_SPEED = 2;
  let lastMeteor = 0;

  let gameOver = false;
  let explosionPlayed = false;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) { thrustSound.currentTime = 0; thrustSound.play().catch(() => {}); } });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function spawnMeteor() {
    // Choose random edge
    const edge = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    if (edge === 0) { // top
      x = Math.random() * width; y = -10; vx = (Math.random() - 0.5) * METEOR_SPEED; vy = METEOR_SPEED;
    } else if (edge === 1) { // right
      x = width + 10; y = Math.random() * height; vx = -METEOR_SPEED; vy = (Math.random() - 0.5) * METEOR_SPEED;
    } else if (edge === 2) { // bottom
      x = Math.random() * width; y = height + 10; vx = (Math.random() - 0.5) * METEOR_SPEED; vy = -METEOR_SPEED;
    } else { // left
      x = -10; y = Math.random() * height; vx = METEOR_SPEED; vy = (Math.random() - 0.5) * METEOR_SPEED;
    }
    meteors.push({ x, y, vx, vy, r: 6 });
  }

  function update(dt) {
    if (gameOver) return;
    // Apply thrust based on arrow keys
    if (keys.ArrowUp) { sat.vy -= THRUST; }
    if (keys.ArrowDown) { sat.vy += THRUST; }
    if (keys.ArrowLeft) { sat.vx -= THRUST; }
    if (keys.ArrowRight) { sat.vx += THRUST; }

    // Update position
    sat.x += sat.vx * dt;
    sat.y += sat.vy * dt;

    // Meteor update
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      // Remove off-screen meteors
      if (m.x < -20 || m.x > width + 20 || m.y < -20 || m.y > height + 20) {
        meteors.splice(i, 1);
      }
    }

    // Collisions
    const distPlanet = Math.hypot(sat.x - planet.x, sat.y - planet.y);
    if (distPlanet < planet.r + sat.size) gameOver = true; // crash into planet
    if (sat.x < 0 || sat.x > width || sat.y < 0 || sat.y > height) gameOver = true; // drift off-screen
    for (const m of meteors) {
      const d = Math.hypot(sat.x - m.x, sat.y - m.y);
      if (d < sat.size + m.r) { gameOver = true; break; }
    }
    // Play explosion sound once on game over
    if (gameOver && !explosionPlayed) {
      explosionSound.currentTime = 0;
      explosionSound.play();
      bgMusic.pause();
      explosionPlayed = true;
    }
    // Spawn meteors
    const now = performance.now();
    if (now - lastMeteor > METEOR_INTERVAL) {
      spawnMeteor();
      lastMeteor = now;
    }
  }

  function draw() {
    // Background space gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#003');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Stars
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Planet with gradient
    ctx.fillStyle = planetGradient;
    ctx.beginPath();
    ctx.arc(planet.x, planet.y, planet.r, 0, Math.PI * 2);
    ctx.fill();

    // Satellite with glow
    const satGrad = ctx.createRadialGradient(sat.x, sat.y, sat.size * 0.2, sat.x, sat.y, sat.size * 2);
    satGrad.addColorStop(0, '#fff');
    satGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = satGrad;
    ctx.beginPath();
    ctx.arc(sat.x, sat.y, sat.size * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(sat.x, sat.y, sat.size, 0, Math.PI * 2);
    ctx.fill();

    // Meteors with tail gradient
    for (const m of meteors) {
      const trailGrad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r * 3);
      trailGrad.addColorStop(0, 'rgba(255,100,100,0.8)');
      trailGrad.addColorStop(1, 'rgba(255,100,100,0)');
      ctx.fillStyle = trailGrad;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r * 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#a33';
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  let last = performance.now();
  function loop() {
    const now = performance.now();
    const dt = (now - last) / 16; // normalize to ~60fps step
    last = now;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
