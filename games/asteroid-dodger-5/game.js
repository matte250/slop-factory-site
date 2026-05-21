// Asteroid Dodger game
// Targets <canvas id="game"></canvas>
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Canvas size (fallback if not set in HTML)
  canvas.width = canvas.width || 800;
  canvas.height = canvas.height || 600;

  const ship = {
    width: 50,
    height: 20,
    x: canvas.width / 2 - 25,
    y: canvas.height - 30,
    speed: 6,
  };

  const asteroids = [];
  const stars = [];
  // Initialize star field
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }
  const asteroidSpawnInterval = 1000; // ms
  const asteroidMinSpeed = 2;
  const asteroidMaxSpeed = 5;
  const asteroidMinSize = 15;
  const asteroidMaxSize = 40;

  let left = false,
    right = false,
    gameOver = false;

  // Input handling
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration / 1000);
  };
let audioStarted = false;
const keyDown = (e) => {
  // Ensure audio context is running after first user interaction
  if (!audioStarted) { audioCtx.resume(); audioStarted = true; }
  if (e.key === 'ArrowLeft' || e.key === 'a') { left = true; playTone(440, 80); }
  if (e.key === 'ArrowRight' || e.key === 'd') { right = true; playTone(440, 80); }
};
  const keyUp = (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') left = false;
    if (e.key === 'ArrowRight' || e.key === 'd') right = false;
  };
  window.addEventListener('keydown', keyDown);
  window.addEventListener('keyup', keyUp);

  const spawnAsteroid = () => {
  // Play a subtle spawn tone
  playTone(220, 50);

    const size = Math.random() * (asteroidMaxSize - asteroidMinSize) + asteroidMinSize;
    const x = Math.random() * (canvas.width - size * 2) + size;
    const speed = Math.random() * (asteroidMaxSpeed - asteroidMinSpeed) + asteroidMinSpeed;
    asteroids.push({ x, y: -size, radius: size, speed });
  };

  const update = () => {
    if (gameOver) return;
    // Move ship
    if (left) ship.x = Math.max(0, ship.x - ship.speed);
    if (right) ship.x = Math.min(canvas.width - ship.width, ship.x + ship.speed);

    // Move asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // Remove off‑screen asteroids
      if (a.y - a.radius > canvas.height) {
        asteroids.splice(i, 1);
        continue;
      }
      // Collision detection (circle vs rectangle)
      const closestX = Math.max(ship.x, Math.min(a.x, ship.x + ship.width));
      const closestY = Math.max(ship.y, Math.min(a.y, ship.y + ship.height));
      const dx = a.x - closestX;
      const dy = a.y - closestY;
      if (dx * dx + dy * dy < a.radius * a.radius) {
        endGame();
        return;
      }
    }
  };

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw star field background
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // Draw ship as a triangle with gradient
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x, ship.y + ship.height);
    shipGrad.addColorStop(0, '#0f0');
    shipGrad.addColorStop(1, '#050');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.height);
    ctx.lineTo(ship.x + ship.width / 2, ship.y);
    ctx.lineTo(ship.x + ship.width, ship.y + ship.height);
    ctx.closePath();
    ctx.fill();
    // Draw asteroids with radial gradient
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const loop = () => {
    if (gameOver) return;
    update();
    draw();
    requestAnimationFrame(loop);
  };

  const endGame = () => {
    gameOver = true;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
  };

  // Start game loop and asteroid spawning
  setInterval(spawnAsteroid, asteroidSpawnInterval);
  requestAnimationFrame(loop);
})();
