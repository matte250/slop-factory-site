// Simple Orbital Dodge game
// Canvas element with id="game" is expected in the HTML.
// The player controls a ship that orbits a planet. Press Space or click to toggle
// between inner (radius 80) and outer (radius 140) orbit. Asteroids spawn from the
// canvas edges and move toward the planet. Collision ends the game. Fuel depletes
// over time; when it reaches zero the game ends.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  const width = (canvas.width = canvas.clientWidth);
  const height = (canvas.height = canvas.clientHeight);

  // Game constants
  // Sound assets (place .wav/.mp3 files in same directory)
  const soundToggle = new Audio('toggle.wav');
  const soundCollision = new Audio('collision.wav');
  const soundSpawn = new Audio('spawn.wav');
  const soundMusic = new Audio('music.mp3');
  soundMusic.loop = true;
  soundMusic.volume = 0.3;
  soundMusic.play().catch(() => {});
  const PLANET_RADIUS = 30;
  const ORBIT_INNER = 80;
  const ORBIT_OUTER = 140;
  const SHIP_RADIUS = 8;
  const ASTEROID_MIN_SPEED = 1.0;
  const ASTEROID_MAX_SPEED = 2.5;
  const SPAWN_INTERVAL = 1500; // ms
  const FUEL_DEPLETION_RATE = 0.02; // per frame

  // Generate starfield
const STAR_COUNT = 120;
const stars = [];
for (let i = 0; i < STAR_COUNT; i++) {
  stars.push({ x: Math.random() * width, y: Math.random() * height });
}

let angle = 0; // radians
  let orbitRadius = ORBIT_INNER;
  let fuel = 100;
  let score = 0;
  let asteroids = [];
  let lastSpawn = 0;
  let running = true;

  // Helper functions
  const rand = (min, max) => Math.random() * (max - min) + min;

  const spawnAsteroid = () => {
    soundSpawn.play();
    // Choose a side: 0=top,1=right,2=bottom,3=left
    const side = Math.floor(rand(0, 4));
    let x, y;
    const margin = 10;
    if (side === 0) { // top
      x = rand(margin, width - margin);
      y = -margin;
    } else if (side === 1) { // right
      x = width + margin;
      y = rand(margin, height - margin);
    } else if (side === 2) { // bottom
      x = rand(margin, width - margin);
      y = height + margin;
    } else { // left
      x = -margin;
      y = rand(margin, height - margin);
    }
    // Direction towards planet centre
    const dx = width / 2 - x;
    const dy = height / 2 - y;
    const dist = Math.hypot(dx, dy);
    const speed = rand(ASTEROID_MIN_SPEED, ASTEROID_MAX_SPEED);
    const vx = (dx / dist) * speed;
    const vy = (dy / dist) * speed;
    const size = rand(6, 12);
    asteroids.push({ x, y, vx, vy, size });
  };

  const update = (delta) => {
    if (!running) return;
    // Update ship angle
    angle += 0.03; // constant angular speed
    // Update fuel
    fuel = Math.max(0, fuel - FUEL_DEPLETION_RATE);
    if (fuel === 0) running = false;
    // Update asteroids
    asteroids.forEach((a) => {
      a.x += a.vx;
      a.y += a.vy;
    });
    // Remove off‑screen asteroids & increase score
    asteroids = asteroids.filter((a) => {
      const off = a.x < -20 || a.x > width + 20 || a.y < -20 || a.y > height + 20;
      if (off) score++;
      return !off;
    });
    // Collision detection
    const shipX = width / 2 + orbitRadius * Math.cos(angle);
    const shipY = height / 2 + orbitRadius * Math.sin(angle);
    for (const a of asteroids) {
      const d = Math.hypot(a.x - shipX, a.y - shipY);
      if (d < a.size + SHIP_RADIUS) {
        running = false;
        soundCollision.play();
        break;
      }
    }
    // Spawn new asteroids
    if (Date.now() - lastSpawn > SPAWN_INTERVAL) {
      spawnAsteroid();
      lastSpawn = Date.now();
    }
  };

  const draw = () => {
    // Background – starfield
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    // Draw stars
    stars.forEach(s => {
      ctx.fillStyle = 'white';
      ctx.fillRect(s.x, s.y, 1, 1);
    });
    // Planet with gradient
    const planetGrad = ctx.createRadialGradient(width / 2, height / 2, PLANET_RADIUS / 2, width / 2, height / 2, PLANET_RADIUS);
    planetGrad.addColorStop(0, '#777');
    planetGrad.addColorStop(1, '#333');
    ctx.fillStyle = planetGrad;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, PLANET_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    // Ship – triangle with slight glow
    const shipX = width / 2 + orbitRadius * Math.cos(angle);
    const shipY = height / 2 + orbitRadius * Math.sin(angle);
    ctx.save();
    ctx.translate(shipX, shipY);
    ctx.rotate(angle + Math.PI / 2);
    const shipPath = new Path2D();
    shipPath.moveTo(0, -SHIP_RADIUS);
    shipPath.lineTo(SHIP_RADIUS * 0.8, SHIP_RADIUS);
    shipPath.lineTo(-SHIP_RADIUS * 0.8, SHIP_RADIUS);
    shipPath.closePath();
    ctx.fillStyle = '#0f0';
    ctx.shadowColor = '#0f0';
    ctx.shadowBlur = 8;
    ctx.fill(shipPath);
    ctx.restore();
    // Asteroids – irregular circles with gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.size * 0.3, a.x, a.y, a.size);
      grad.addColorStop(0, '#c55');
      grad.addColorStop(1, '#622');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.size, 0, Math.PI * 2);
      ctx.fill();
    });
    // UI – fuel & score (unchanged)
    // UI – fuel & score
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Fuel: ${fuel.toFixed(0)}%`, 10, 20);
    ctx.fillText(`Score: ${score}`, 10, 40);
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  };

  // Input – toggle orbit radius
  const toggleOrbit = () => {
    orbitRadius = orbitRadius === ORBIT_INNER ? ORBIT_OUTER : ORBIT_INNER;
    soundToggle.play();
  };
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') toggleOrbit();
  });
  canvas.addEventListener('click', toggleOrbit);

  // Main loop
  let lastTime = 0;
  const loop = (time) => {
    const delta = time - lastTime;
    lastTime = time;
    update(delta);
    draw();
    if (running) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
