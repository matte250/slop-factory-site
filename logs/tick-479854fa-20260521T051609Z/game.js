// Pixel Asteroid Dodge game
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');

  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Simple sound helper
  function playSound(freq, type = 'sine', duration = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.start(now);
    osc.stop(now + duration);
  }
  function playCollision() { playSound(120, 'sawtooth', 0.5); }
  // Resume audio context on first user interaction
  function resumeAudio() { if (audioCtx.state !== 'running') audioCtx.resume(); }
  window.addEventListener('click', resumeAudio);
  window.addEventListener('keydown', resumeAudio);

  // Set a default size if not defined in HTML/CSS
  canvas.width = canvas.width || 800;
  canvas.height = canvas.height || 400;

  // Generate background stars
  const STAR_COUNT = 100;
  const stars = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.5,
    });
  }

  const PLAYER_SIZE = 20;
  const PLAYER_X = 50; // distance from left edge

  const ASTEROID_MIN_SIZE = 15;
  const ASTEROID_MAX_SIZE = 40;
  const ASTEROID_MIN_SPEED = 2;
  const ASTEROID_MAX_SPEED = 6;
  const SPAWN_INTERVAL = 1000; // ms

  let playerY = canvas.height / 2 - PLAYER_SIZE / 2;
  const keys = { ArrowUp: false, ArrowDown: false, w: false, s: false };

  const asteroids = [];
  let lastSpawn = 0;
  let startTime = null;
  let gameOver = false;

  // Input handling
  window.addEventListener('keydown', (e) => {
    if (e.key in keys) keys[e.key] = true;
  });
  window.addEventListener('keyup', (e) => {
    if (e.key in keys) keys[e.key] = false;
  });

  function reset() {
    playerY = canvas.height / 2 - PLAYER_SIZE / 2;
    asteroids.length = 0;
    lastSpawn = 0;
    startTime = performance.now();
    gameOver = false;
    requestAnimationFrame(loop);
  }

  function spawnAsteroid() {
    const size = ASTEROID_MIN_SIZE + Math.random() * (ASTEROID_MAX_SIZE - ASTEROID_MIN_SIZE);
    const y = Math.random() * (canvas.height - size);
    const speed = ASTEROID_MIN_SPEED + Math.random() * (ASTEROID_MAX_SPEED - ASTEROID_MIN_SPEED);
    // generate irregular polygon points for asteroid
    const sides = Math.floor(Math.random() * 3) + 5; // 5-7 sides
    const angleStep = (Math.PI * 2) / sides;
    const radius = size / 2;
    const points = [];
    for (let i = 0; i < sides; i++) {
      const angle = i * angleStep;
      const offset = (Math.random() * 0.4 - 0.2) * radius; // +/-20%
      const r = radius + offset;
      points.push({ x: r * Math.cos(angle), y: r * Math.sin(angle) });
    }
    asteroids.push({ x: canvas.width, y, size, speed, points, color: `hsl(${Math.random() * 360}, 50%, 60%)` });
  }

  function update(dt) {
    // Player movement
    const moveSpeed = 300; // pixels per second
    if (keys.ArrowUp || keys.w) playerY -= moveSpeed * dt;
    if (keys.ArrowDown || keys.s) playerY += moveSpeed * dt;
    // Keep inside canvas
    playerY = Math.max(0, Math.min(canvas.height - PLAYER_SIZE, playerY));

    // Spawn asteroids
    if (performance.now() - lastSpawn > SPAWN_INTERVAL) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed;
      if (a.x + a.size < 0) asteroids.splice(i, 1);
    }

    // Collision detection
    for (const a of asteroids) {
      if (
        a.x < PLAYER_X + PLAYER_SIZE &&
        a.x + a.size > PLAYER_X &&
        a.y < playerY + PLAYER_SIZE &&
        a.y + a.size > playerY
      ) {
        playCollision();
        gameOver = true;
        break;
      }
    }
  }

function draw() {
    // Clear and draw background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Stars
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw player (red triangular ship)
    ctx.fillStyle = '#ff4500';
    ctx.beginPath();
    ctx.moveTo(PLAYER_X, playerY);
    ctx.lineTo(PLAYER_X, playerY + PLAYER_SIZE);
    ctx.lineTo(PLAYER_X + PLAYER_SIZE, playerY + PLAYER_SIZE / 2);
    ctx.closePath();
    ctx.fill();

    // Draw asteroids (irregular polygons)
    ctx.fillStyle = '#888';
    for (const a of asteroids) {
      if (a.points) {
        ctx.beginPath();
        const offsetX = a.x + a.size / 2;
        const offsetY = a.y + a.size / 2;
        const first = a.points[0];
        ctx.moveTo(offsetX + first.x, offsetY + first.y);
        for (let i = 1; i < a.points.length; i++) {
          const p = a.points[i];
          ctx.lineTo(offsetX + p.x, offsetY + p.y);
        }
        ctx.closePath();
        ctx.fill();
      } else {
        // fallback circle
        ctx.beginPath();
        ctx.arc(a.x + a.size / 2, a.y + a.size / 2, a.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw score (time survived)
    const seconds = ((performance.now() - startTime) / 1000).toFixed(1);
    ctx.fillStyle = '#0f0';
    ctx.font = '16px monospace';
    ctx.fillText(`Score: ${seconds}s`, 10, 20);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f00';
      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
      ctx.font = '20px sans-serif';
      ctx.fillText('Click to restart', canvas.width / 2, canvas.height / 2 + 20);
    }
  }

    // Draw score (time survived)
    const seconds = ((performance.now() - startTime) / 1000).toFixed(1);
    ctx.fillStyle = '#0f0';
    ctx.font = '16px monospace';
    ctx.fillText(`Score: ${seconds}s`, 10, 20);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f00';
      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
      ctx.font = '20px sans-serif';
      ctx.fillText('Click to restart', canvas.width / 2, canvas.height / 2 + 20);
    }
  }

  function loop(timestamp) {
    if (!startTime) startTime = timestamp;
    const dt = (timestamp - (startTime || timestamp)) / 1000; // seconds
    if (!gameOver) {
      update(dt);
    }
    draw();
    if (!gameOver) {
      requestAnimationFrame(loop);
    }
  }

  // Restart on click after game over
  canvas.addEventListener('click', () => {
    if (gameOver) reset();
  });

  // Start the game
  reset();
})();
