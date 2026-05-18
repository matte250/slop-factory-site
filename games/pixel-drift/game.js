// Minimal Pixel Drift game implementation
// Assumes a <canvas id="game"></canvas> exists in the page.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id="game" not found');
  const ctx = canvas.getContext('2d');
  // Set canvas size to fill parent or a default size
  canvas.width = canvas.clientWidth || 400;
  canvas.height = canvas.clientHeight || 600;

  // Create starfield background
  const STAR_COUNT = 100;
  const stars = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }

  const PLAYER_W = 30;
  const PLAYER_H = 15;
  const PLAYER_SPEED = 4;
  const ASTEROID_SIZE = 20;
  const ASTEROID_MIN_SPEED = 2;
  const ASTEROID_MAX_SPEED = 5;
  const FUEL_PICKUP_SIZE = 12;

  let playerX = canvas.width / 2 - PLAYER_W / 2;
  const playerY = canvas.height - PLAYER_H - 10;
  let moveLeft = false, moveRight = false;
  let asteroids = [];
  let fuelPickups = [];
  let fuel = 100; // percent
  let score = 0;
  let lastSpawn = 0;
  let lastFuelSpawn = 0;
  let gameOver = false;

  // Input handling
  // Sound setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  const keyDown = e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') moveLeft = true;
    if (e.key === 'ArrowRight' || e.key === 'd') moveRight = true;
  };
  const keyUp = e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') moveLeft = false;
    if (e.key === 'ArrowRight' || e.key === 'd') moveRight = false;
  };
  window.addEventListener('keydown', e => { audioCtx.resume(); keyDown(e); });
  window.addEventListener('keyup', keyUp);

  // Touch controls – simple horizontal drag
  let touchStartX = null;
  canvas.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
  });
  canvas.addEventListener('touchmove', e => {
    if (!touchStartX) return;
    const dx = e.touches[0].clientX - touchStartX;
    if (dx < -10) moveLeft = true, moveRight = false;
    else if (dx > 10) moveRight = true, moveLeft = false;
    touchStartX = e.touches[0].clientX;
  });
  canvas.addEventListener('touchend', () => {
    moveLeft = moveRight = false;
    touchStartX = null;
  });

  function spawnAsteroid() {
    const x = Math.random() * (canvas.width - ASTEROID_SIZE);
    const speed = ASTEROID_MIN_SPEED + Math.random() * (ASTEROID_MAX_SPEED - ASTEROID_MIN_SPEED);
    asteroids.push({ x, y: -ASTEROID_SIZE, speed });
  }
  function spawnFuel() {
    const x = Math.random() * (canvas.width - FUEL_PICKUP_SIZE);
    const speed = 2 + Math.random() * 2;
    fuelPickups.push({ x, y: -FUEL_PICKUP_SIZE, speed });
  }

  function rectsCollide(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function update(delta) {
    if (gameOver) return;
    // Player movement
    if (moveLeft) playerX = Math.max(0, playerX - PLAYER_SPEED);
    if (moveRight) playerX = Math.min(canvas.width - PLAYER_W, playerX + PLAYER_SPEED);

    // Spawn asteroids every 800ms
    if (performance.now() - lastSpawn > 800) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }
    // Spawn fuel pickups every 5000ms
    if (performance.now() - lastFuelSpawn > 5000) {
      spawnFuel();
      lastFuelSpawn = performance.now();
    }

    // Update asteroids
    asteroids.forEach(a => a.y += a.speed);
    asteroids = asteroids.filter(a => a.y < canvas.height + ASTEROID_SIZE);

    // Update fuel pickups
    fuelPickups.forEach(p => p.y += p.speed);
    fuelPickups = fuelPickups.filter(p => p.y < canvas.height + FUEL_PICKUP_SIZE);

    // Update starfield (slow drift)
    stars.forEach(s => {
      s.y += 0.3;
      if (s.y > canvas.height) {
        s.y = 0;
        s.x = Math.random() * canvas.width;
      }
    });

    // Collision detection
    const playerRect = { x: playerX, y: playerY, w: PLAYER_W, h: PLAYER_H };
    for (const a of asteroids) {
      if (rectsCollide(playerRect, { x: a.x, y: a.y, w: ASTEROID_SIZE, h: ASTEROID_SIZE })) {
        beep(200, 0.3); // collision sound
        gameOver = true;
        break;
      }
    }
    for (let i = fuelPickups.length - 1; i >= 0; i--) {
      const p = fuelPickups[i];
      if (rectsCollide(playerRect, { x: p.x, y: p.y, w: FUEL_PICKUP_SIZE, h: FUEL_PICKUP_SIZE })) {
        beep(600, 0.15); // fuel pickup sound
        fuel = Math.min(100, fuel + 30);
        fuelPickups.splice(i, 1);
      }
    }

    // Fuel consumption
    fuel -= delta * 0.01; // slower depletion
    if (fuel <= 0) gameOver = true;

    // Score based on time survived
    score = Math.floor(performance.now() / 1000);
  }

  function draw() {
    // Clear with dark space gradient
    const grd = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grd.addColorStop(0, '#001');
    grd.addColorStop(1, '#000');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw starfield
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Player ship (gradient triangle)
    const shipGrad = ctx.createLinearGradient(playerX, playerY, playerX + PLAYER_W, playerY + PLAYER_H);
    shipGrad.addColorStop(0, '#4caf50');
    shipGrad.addColorStop(1, '#2e7d32');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(playerX, playerY + PLAYER_H);
    ctx.lineTo(playerX + PLAYER_W / 2, playerY);
    ctx.lineTo(playerX + PLAYER_W, playerY + PLAYER_H);
    ctx.closePath();
    ctx.fill();

    // Asteroids as shaded circles
    asteroids.forEach(a => {
      const radGrad = ctx.createRadialGradient(a.x + ASTEROID_SIZE / 2, a.y + ASTEROID_SIZE / 2, ASTEROID_SIZE * 0.2,
                                            a.x + ASTEROID_SIZE / 2, a.y + ASTEROID_SIZE / 2, ASTEROID_SIZE / 2);
      radGrad.addColorStop(0, '#bbb');
      radGrad.addColorStop(1, '#555');
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(a.x + ASTEROID_SIZE / 2, a.y + ASTEROID_SIZE / 2, ASTEROID_SIZE / 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Fuel pickups as rotating squares (simple visual)
    ctx.fillStyle = '#ff0';
    fuelPickups.forEach(p => {
      ctx.save();
      ctx.translate(p.x + FUEL_PICKUP_SIZE / 2, p.y + FUEL_PICKUP_SIZE / 2);
      const angle = (performance.now() / 200) % (Math.PI * 2);
      ctx.rotate(angle);
      ctx.fillRect(-FUEL_PICKUP_SIZE / 2, -FUEL_PICKUP_SIZE / 2, FUEL_PICKUP_SIZE, FUEL_PICKUP_SIZE);
      ctx.restore();
    });

    // UI: Score and fuel bar
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    ctx.fillText('Fuel:', 10, 40);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(50, 30, 100, 10);
    ctx.fillStyle = '#0f0';
    ctx.fillRect(50, 30, fuel, 10);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f00';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
      ctx.fillText('Final Score: ' + score, canvas.width / 2, canvas.height / 2 + 30);
    }
  }

  let lastTime = performance.now();
  function loop() {
    const now = performance.now();
    const delta = now - lastTime;
    lastTime = now;
    update(delta);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
