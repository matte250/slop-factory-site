// Space Dodger Game
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }
  if (!canvas) return; // canvas must exist
  const ctx = canvas.getContext('2d');
  // full‑window size
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // generate static stars background
  const starCount = 100;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
    });
  }

  // Ship definition
  const ship = {
    width: 40,
    height: 20,
    x: canvas.width / 2 - 20,
    y: canvas.height - 30,
    speed: 6,
  };

  // Input handling
  const keys = {};
  window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      playTone(300, 0.05);
    }
  });
  window.addEventListener('keyup', (e) => { keys[e.key] = false; });
  // Resume audio on first interaction
  window.addEventListener('click', () => audioCtx.resume(), { once: true });

  // Asteroids
  const asteroids = [];
  let spawnInterval = 2000; // ms
  let lastSpawn = 0;
  let difficultyTimer = 0;

  let startTime = performance.now();
  let gameOver = false;

  function spawnAsteroid() {
    const radius = 15 + Math.random() * 10;
    const x = Math.random() * (canvas.width - radius * 2) + radius;
    const speed = 2 + Math.random() * 2 + difficultyTimer * 0.002; // increase with time
    asteroids.push({ x, y: -radius, radius, speed });
  }

  function update(dt) {
    // Move ship
    if (keys['ArrowLeft']) ship.x -= ship.speed;
    if (keys['ArrowRight']) ship.x += ship.speed;
    ship.x = Math.max(0, Math.min(canvas.width - ship.width, ship.x));

    // Spawn asteroids
    if (performance.now() - lastSpawn > spawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }
    // increase difficulty
    difficultyTimer += dt;
    if (difficultyTimer > 5000) {
      spawnInterval = Math.max(400, spawnInterval - 100); // faster spawning
      difficultyTimer = 0;
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // Remove off‑screen
      if (a.y - a.radius > canvas.height) asteroids.splice(i, 1);
      // Collision check (simple rectangle‑circle)
      const shipRect = { x: ship.x, y: ship.y, w: ship.width, h: ship.height };
      const distX = Math.abs(a.x - (shipRect.x + shipRect.w / 2));
      const distY = Math.abs(a.y - (shipRect.y + shipRect.h / 2));
      if (distX <= (shipRect.w / 2 + a.radius) && distY <= (shipRect.h / 2 + a.radius)) {
        gameOver = true;
        playTone(100, 0.3); // collision sound
      }
    }
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // stars (static background)
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.fillRect(s.x, s.y, 1, 1);
    }

    // Ship (triangle)
    ctx.fillStyle = '#0af';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.height);
    ctx.lineTo(ship.x + ship.width / 2, ship.y);
    ctx.lineTo(ship.x + ship.width, ship.y + ship.height);
    ctx.closePath();
    ctx.fill();

    // Asteroids with radial gradient shading
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
      grad.addColorStop(0, '#f66');
      grad.addColorStop(1, '#800');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Score
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Score: ${elapsed}s`, 10, 30);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '40px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2 - 100, canvas.height / 2);
    }
  }

  function loop(timestamp) {
    if (!gameOver) {
      const dt = timestamp - (lastFrame ?? timestamp);
      update(dt);
    }
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  let lastFrame = null;
  requestAnimationFrame(loop);
})();
