// Asteroid Avoider Game
// Canvas with id "game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let collisionPlayed = false;
  const width = canvas.width = 800;
  const height = canvas.height = 600;

  // Starfield for background
  const stars = Array.from({length: 100}, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 1.5 + 0.5
  }));

  // Ship
  const ship = {
    x: width / 2,
    y: height - 50,
    radius: 12,
    speed: 4,
    color: '#00ffea', // cyan ship
    thrust: false
  };

  const keys = {};
  window.addEventListener('keydown', e => {
  // Resume audio context on first interaction
  if (audioCtx.state === 'suspended') audioCtx.resume();
  keys[e.key] = true;
});
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // Asteroids
  const asteroids = [];
  const asteroidSpawnInterval = 1000; // ms
  const maxAsteroidSize = 30;
  const minAsteroidSize = 10;

  function spawnAsteroid() {
    const size = Math.random() * (maxAsteroidSize - minAsteroidSize) + minAsteroidSize;
    const side = Math.random(); // 0 left, 0.5 top, 1 right
    let x, y, vx, vy;
    if (side < 0.33) { // left
      x = -size;
      y = Math.random() * height;
      vx = Math.random() * 2 + 1;
      vy = Math.random() * 2 - 1;
    } else if (side < 0.66) { // top
      x = Math.random() * width;
      y = -size;
      vx = Math.random() * 2 - 1;
      vy = Math.random() * 2 + 1;
    } else { // right
      x = width + size;
      y = Math.random() * height;
      vx = -(Math.random() * 2 + 1);
      vy = Math.random() * 2 - 1;
    }
    asteroids.push({x, y, vx, vy, size});
  }

  let lastSpawn = 0;
  let gameOver = false;

  let prevThrust = false;
function playTone(freq, duration) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'square';
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
  osc.start();
  setTimeout(() => {
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
    osc.stop(audioCtx.currentTime + 0.06);
  }, duration);
}
function playThrust() { playTone(400, 50); }
function playCollision() { playTone(100, 300); }
function update(dt) {
    // Ship movement
    const moving = keys.ArrowLeft || keys.ArrowRight || keys.ArrowUp || keys.ArrowDown;
    ship.thrust = moving;
    // Play thrust sound on start of movement
    if (moving && !prevThrust) {
      playThrust();
    }
    prevThrust = moving;
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    // Keep within bounds
    ship.x = Math.max(ship.radius, Math.min(width - ship.radius, ship.x));
    ship.y = Math.max(ship.radius, Math.min(height - ship.radius, ship.y));

    // Starfield scroll
    for (const s of stars) {
      s.y += 0.5;
      if (s.y > height) { s.y = 0; s.x = Math.random() * width; }
    }

    // Asteroid movement
    for (const a of asteroids) {
      a.x += a.vx;
      a.y += a.vy;
    }
    // Remove off‑screen asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      if (a.x < -a.size || a.x > width + a.size || a.y < -a.size || a.y > height + a.size) {
        asteroids.splice(i, 1);
      }
    }
    // Collision detection
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.size + ship.radius) {
        gameOver = true;
        if (!collisionPlayed) {
          playCollision();
          collisionPlayed = true;
        }
        break;
      }
    }
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Starfield
    ctx.fillStyle = 'white';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ship with thrust flame
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.radius);
    ctx.lineTo(ship.x - ship.radius, ship.y + ship.radius);
    ctx.lineTo(ship.x + ship.radius, ship.y + ship.radius);
    ctx.closePath();
    ctx.fill();
    if (ship.thrust) {
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.moveTo(ship.x, ship.y + ship.radius);
      ctx.lineTo(ship.x - ship.radius / 2, ship.y + ship.radius + 10);
      ctx.lineTo(ship.x + ship.radius / 2, ship.y + ship.radius + 10);
      ctx.closePath();
      ctx.fill();
    }

    // Asteroids with gradient
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.size * 0.2, a.x, a.y, a.size);
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#333');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Game over text
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  let lastTime = performance.now();
  function loop(now) {
    const dt = now - lastTime;
    lastTime = now;
    if (!gameOver) {
      if (now - lastSpawn > asteroidSpawnInterval) {
        spawnAsteroid();
        lastSpawn = now;
      }
      update(dt);
    }
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
