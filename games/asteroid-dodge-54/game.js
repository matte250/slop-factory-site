// Asteroid Dodge Game
// Canvas element with id="game" is expected in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration = 0.1, type = 'sine') {
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
  // Set canvas size to fill the window (adjust as needed)
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();

  // Starfield background
  const starCount = 150;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }
  function drawStars() {
    // Update star positions for subtle twinkling effect
    for (const s of stars) {
      s.y += 0.2;
      if (s.y > canvas.height) s.y = 0;
    }
    // Draw stars
    ctx.fillStyle = '#111';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
}
window.addEventListener('resize', resize);

  // Ship definition
  const ship = {
    width: 40,
    height: 20,
    x: canvas.width / 2,
    y: canvas.height - 30,
    speed: 5,
    dx: 0,
    dy: 0,
    color: '#0f0',
  };

  // Input handling (arrow keys / WASD)
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    // Restart on Space after game over
    if (e.key === ' ' && !gameRunning) startGame();
  });
  window.addEventListener('keyup', e => {
    keys[e.key] = false;
  });

  // Asteroid pool
  const asteroids = [];
  let asteroidTimer = 0;
  let asteroidInterval = 2000; // ms
  let lastTime = 0;
  let score = 0;
  let gameRunning = false;

  function reset() {
    ship.x = canvas.width / 2;
    ship.y = canvas.height - 30;
    ship.dx = ship.dy = 0;
    asteroids.length = 0;
    asteroidTimer = 0;
    asteroidInterval = 2000;
    lastTime = performance.now();
    score = 0;
  }

  function startGame() {
    reset();
    gameRunning = true;
    requestAnimationFrame(loop);
  }

  function spawnAsteroid() {
    const radius = 15 + Math.random() * 15;
    const x = Math.random() * (canvas.width - radius * 2) + radius;
    const speed = 2 + Math.random() * 3 + (score / 1000); // increase speed with score
    asteroids.push({ x, y: -radius, radius, speed });
    // Play spawn sound
    playTone(200, 0.07, 'square');
  }

  function updateShip() {
    ship.dx = 0; ship.dy = 0;
    if (keys['ArrowLeft'] || keys['a']) ship.dx = -ship.speed;
    if (keys['ArrowRight'] || keys['d']) ship.dx = ship.speed;
    if (keys['ArrowUp'] || keys['w']) ship.dy = -ship.speed;
    if (keys['ArrowDown'] || keys['s']) ship.dy = ship.speed;
    ship.x = Math.max(0, Math.min(canvas.width - ship.width, ship.x + ship.dx));
    ship.y = Math.max(0, Math.min(canvas.height - ship.height, ship.y + ship.dy));
  }

  function updateAsteroids(delta) {
    // Move asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed * delta * 0.06; // scale speed
      // Remove off‑screen asteroids and increase score
      if (a.y - a.radius > canvas.height) {
        // Play score sound when asteroid passes
        playTone(400, 0.08, 'sawtooth');
        asteroids.splice(i, 1);
        score += 10;
        // gradually speed up spawning
        asteroidInterval = Math.max(500, asteroidInterval - 20);
      }
    }
    // Spawn new asteroids based on timer
    asteroidTimer += delta;
    if (asteroidTimer > asteroidInterval) {
      spawnAsteroid();
      asteroidTimer = 0;
    }
  }

  function checkCollision() {
    // Check collision and play sound if hit
    for (const a of asteroids) {
      // Simple AABB check against ship rectangle
      const shipRect = { x: ship.x, y: ship.y, w: ship.width, h: ship.height };
      const distX = Math.abs(a.x - (shipRect.x + shipRect.w / 2));
      const distY = Math.abs(a.y - (shipRect.y + shipRect.h / 2));
      if (distX > (shipRect.w / 2 + a.radius) || distY > (shipRect.h / 2 + a.radius)) continue;
      if (distX <= (shipRect.w / 2) || distY <= (shipRect.h / 2)) { playTone(100, 0.2, 'sawtooth'); return true; }
      const dx = distX - shipRect.w / 2;
      const dy = distY - shipRect.h / 2;
      if (dx * dx + dy * dy <= a.radius * a.radius) return true;
    }
    return false;
  }

  function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#000020');
    bgGrad.addColorStop(1, '#000000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Stars
    drawStars();
    // Ship (draw as triangle)
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.height);
    ctx.lineTo(ship.x + ship.width / 2, ship.y);
    ctx.lineTo(ship.x + ship.width, ship.y + ship.height);
    ctx.closePath();
    ctx.fill();
    // Asteroids (with radial gradient)
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 30);
    if (!gameRunning) {
      ctx.textAlign = 'center';
      ctx.fillText('Game Over – Press Space to Restart', canvas.width / 2, canvas.height / 2);
    }
  }

  function loop(timestamp) {
    const delta = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameRunning) {
      draw();
      return;
    }
    updateShip();
    updateAsteroids(delta);
    if (checkCollision()) {
      gameRunning = false;
    }
    draw();
    requestAnimationFrame(loop);
  }

  // Start automatically
  startGame();
})();
