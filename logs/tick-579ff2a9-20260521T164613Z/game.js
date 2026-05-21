// Endless Asteroid Dodge
// Simple canvas game: ship moves with arrow keys/WASD, shoots with space. Added basic sound effects using Web Audio API.
// Asteroids spawn from edges and drift inward. Game speeds up over time.

(() => {
  /*** Setup ***/
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }
  const width = canvas.width;
  const height = canvas.height;

  /*** Game state ***/
  const ship = { x: width / 2, y: height / 2, r: 10, angle: 0, speed: 2 };
  const bullets = [];
  const asteroids = [];
  let keys = {};
  let lastSpawn = 0;
  let spawnInterval = 2000; // ms
  let lastTime = 0;
  let gameOver = false;
  let score = 0;
  let speedFactor = 1;

  /*** Input ***/
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  /*** Helpers ***/
  function randRange(min, max) { return Math.random() * (max - min) + min; }
  function distance(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }

  /*** Entity creation ***/
  function spawnAsteroid() {
    // choose edge
    const edge = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    const radius = randRange(8, 20) * speedFactor;
    const speed = randRange(0.5, 1.5) * speedFactor;
    if (edge === 0) { // top
      x = randRange(0, width);
      y = -radius;
    } else if (edge === 1) { // right
      x = width + radius;
      y = randRange(0, height);
    } else if (edge === 2) { // bottom
      x = randRange(0, width);
      y = height + radius;
    } else { // left
      x = -radius;
      y = randRange(0, height);
    }
    // drift toward center
    const dx = width / 2 - x;
    const dy = height / 2 - y;
    const len = Math.hypot(dx, dy);
    vx = (dx / len) * speed;
    vy = (dy / len) * speed;
    asteroids.push({ x, y, vx, vy, r: radius });
  }

  function fireBullet() {
    const angle = ship.angle;
    const speed = 5 * speedFactor;
    bullets.push({
      x: ship.x + Math.cos(angle) * ship.r,
      y: ship.y + Math.sin(angle) * ship.r,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: 2,
    });
  }

  /*** Game loop ***/
  function update(dt) {
    // Ship movement
    if (keys['ArrowUp'] || keys['w']) ship.y -= ship.speed * speedFactor;
    if (keys['ArrowDown'] || keys['s']) ship.y += ship.speed * speedFactor;
    if (keys['ArrowLeft'] || keys['a']) ship.x -= ship.speed * speedFactor;
    if (keys['ArrowRight'] || keys['d']) ship.x += ship.speed * speedFactor;
    // Keep ship inside canvas
    ship.x = Math.max(0, Math.min(width, ship.x));
    ship.y = Math.max(0, Math.min(height, ship.y));
    // Ship angle faces mouse? use direction of last movement
    if (keys['ArrowUp'] || keys['w']) ship.angle = -Math.PI / 2;
    if (keys['ArrowDown'] || keys['s']) ship.angle = Math.PI / 2;
    if (keys['ArrowLeft'] || keys['a']) ship.angle = Math.PI;
    if (keys['ArrowRight'] || keys['d']) ship.angle = 0;
    // Shooting
    if (keys[' ']) { // space bar
      if (!keys['_spaceCooldown']) {
        fireBullet();
        keys['_spaceCooldown'] = true;
        setTimeout(() => (keys['_spaceCooldown'] = false), 200);
      }
    }
    // Update bullets
    bullets.forEach(b => { b.x += b.vx * dt; b.y += b.vy * dt; });
    // Remove off‑screen bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      if (b.x < 0 || b.x > width || b.y < 0 || b.y > height) bullets.splice(i, 1);
    }
    // Update asteroids
    asteroids.forEach(a => { a.x += a.vx * dt; a.y += a.vy * dt; });
    // Collision: ship vs asteroids
    for (const a of asteroids) {
      if (distance(ship.x, ship.y, a.x, a.y) < ship.r + a.r) {
        gameOver = true;
        break;
      }
    }
    // Collision: bullets vs asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      let hit = false;
      for (let j = bullets.length - 1; j >= 0; j--) {
        const b = bullets[j];
        if (distance(b.x, b.y, a.x, a.y) < b.r + a.r) {
          hit = true;
          bullets.splice(j, 1);
          break;
        }
      }
      if (hit) {
        asteroids.splice(i, 1);
        score++;
      }
    }
    // Spawn new asteroids
    if (performance.now() - lastSpawn > spawnInterval / speedFactor) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }
    // Gradually increase difficulty
    speedFactor = 1 + score * 0.05;
  }

  // Create a starfield background once
const stars = [];
for (let i = 0; i < 100; i++) {
  stars.push({ x: Math.random() * width, y: Math.random() * height, radius: Math.random() * 1.5 + 0.5 });
}

function draw() {
    ctx.clearRect(0, 0, width, height);
    // Ship
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.fillStyle = 'cyan';
    ctx.beginPath();
    ctx.moveTo(ship.r, 0);
    ctx.lineTo(-ship.r, -ship.r / 2);
    ctx.lineTo(-ship.r, ship.r / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // Bullets
    ctx.fillStyle = 'yellow';
    bullets.forEach(b => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // Asteroids
    ctx.fillStyle = 'gray';
    asteroids.forEach(a => {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // UI
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = (timestamp - lastTime) / 16.666; // normalize to ~60fps units
    lastTime = timestamp;
    if (!gameOver) update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  // Start
  requestAnimationFrame(loop);
})();
