// Simple Space Dodge game
// Canvas with id="game" must exist in the HTML.
(() => {
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }
  function playLaser() { playTone(800, 0.08); }
  function playExplosion() { playTone(200, 0.2); }

  const canvas = document.getElementById('game');
  if (!canvas) { console.error('Canvas #game not found'); return; }
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;

  // Ship
  const ship = { x: width / 2, y: height / 2, size: 15, speed: 3 };
  const keys = {};
  window.addEventListener('keydown', e => keys[e.key] = true);
  window.addEventListener('keyup', e => keys[e.key] = false);

  // Bullets
  const bullets = [];
  const bulletSpeed = 6;
  // Asteroids
  const asteroids = [];
  const asteroidSpeed = 1.5;
  const spawnInterval = 1500; // ms
  let lastSpawn = 0;
  let score = 0;

  function spawnAsteroid() {
    // Choose random edge
    const side = Math.floor(Math.random() * 4);
    let x, y, dx, dy;
    const size = 20 + Math.random() * 20;
    if (side === 0) { // top
      x = Math.random() * width; y = -size; }
    else if (side === 1) { // right
      x = width + size; y = Math.random() * height; }
    else if (side === 2) { // bottom
      x = Math.random() * width; y = height + size; }
    else { // left
      x = -size; y = Math.random() * height; }
    // direction toward ship
    const angle = Math.atan2(ship.y - y, ship.x - x);
    dx = Math.cos(angle) * asteroidSpeed;
    dy = Math.sin(angle) * asteroidSpeed;
    const rot = Math.random() * Math.PI * 2; // initial rotation
    const rotSpeed = (Math.random() - 0.5) * 0.02; // spin
    asteroids.push({ x, y, dx, dy, size, rot, rotSpeed });
  }

  function update(dt) {
    // Ship movement
    if (keys['ArrowUp']) ship.y -= ship.speed;
    if (keys['ArrowDown']) ship.y += ship.speed;
    if (keys['ArrowLeft']) ship.x -= ship.speed;
    if (keys['ArrowRight']) ship.x += ship.speed;
    // Keep within bounds
    ship.x = Math.max(0, Math.min(width, ship.x));
    ship.y = Math.max(0, Math.min(height, ship.y));

    // Shoot
    if (keys[' ']) {
      if (!keys['_spaceDown']) {
        bullets.push({ x: ship.x, y: ship.y, dx: 0, dy: -bulletSpeed, radius: 3 });
        playLaser();
        keys['_spaceDown'] = true;
      }
    } else {
      keys['_spaceDown'] = false;
    }

    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.x += b.dx; b.y += b.dy;
      if (b.x < 0 || b.x > width || b.y < 0 || b.y > height) bullets.splice(i, 1);
    }

    // Spawn asteroids
    if (performance.now() - lastSpawn > spawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }

    // Update asteroids (position & rotation)
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.dx; a.y += a.dy;
      a.rot += a.rotSpeed; // spin
      // Collision with ship
      const distShip = Math.hypot(a.x - ship.x, a.y - ship.y);
      if (distShip < a.size + ship.size) {
        alert('Game Over! Score: ' + score);
        asteroids.length = 0; bullets.length = 0; score = 0; ship.x = width/2; ship.y = height/2;
        return;
      }
      // Collision with bullets
      for (let j = bullets.length - 1; j >= 0; j--) {
        const b = bullets[j];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist < a.size + b.radius) {
          asteroids.splice(i, 1);
          bullets.splice(j, 1);
          score++;
          playExplosion();
          break;
        }
      }
    }
  }

  // Starfield background
const stars = [];
function initStars(count) {
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5 + 0.5,
    });
  }
}
initStars(100);

function draw() {
  // Dark background
  ctx.fillStyle = '#000020';
  ctx.fillRect(0, 0, width, height);
  // Stars
  ctx.fillStyle = 'white';
  stars.forEach(s => {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  });
  // Ship (triangle) with cyan fill and optional thrust flame
  ctx.fillStyle = 'cyan';
  ctx.beginPath();
  ctx.moveTo(ship.x, ship.y - ship.size);
  ctx.lineTo(ship.x - ship.size, ship.y + ship.size);
  ctx.lineTo(ship.x + ship.size, ship.y + ship.size);
  ctx.closePath();
  ctx.fill();
  // Thrust flame when moving forward
  if (keys['ArrowUp']) {
    ctx.fillStyle = 'orange';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.size);
    ctx.lineTo(ship.x - ship.size / 2, ship.y + ship.size + 10);
    ctx.lineTo(ship.x + ship.size / 2, ship.y + ship.size + 10);
    ctx.closePath();
    ctx.fill();
  }
  // Bullets with radial gradient
  bullets.forEach(b => {
    const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.radius);
    grad.addColorStop(0, 'yellow');
    grad.addColorStop(1, 'rgba(255,165,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fill();
  });
  // Asteroids as rotating polygons
  ctx.fillStyle = 'gray';
  asteroids.forEach(a => {
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.rot);
    ctx.beginPath();
    const points = 8;
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const radius = a.size * (0.7 + Math.random() * 0.6);
      const ix = Math.cos(angle) * radius;
      const iy = Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(ix, iy); else ctx.lineTo(ix, iy);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });
  // Score
  ctx.fillStyle = 'white';
  ctx.font = '16px sans-serif';
  ctx.fillText('Score: ' + score, 10, 20);
}

  let lastTime = performance.now();
  function loop() {
    const now = performance.now();
    const dt = now - lastTime;
    lastTime = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
