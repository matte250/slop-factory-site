// Canvas Asteroid Dodge – concise implementation
// Assumes an HTML <canvas id="game"></canvas> exists.

window.addEventListener('load', () => {
  // Set up audio context (will resume on first user interaction)
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Simple tone player
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
    setTimeout(() => {
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
      osc.stop(audioCtx.currentTime + 0.12);
    }, duration);
  }
  // Resume audio on first key press (required by some browsers)
  const resumeAudio = () => { audioCtx.resume(); window.removeEventListener('keydown', resumeAudio); };
  window.addEventListener('keydown', resumeAudio);
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;

  // Ship definition (triangle)
  const ship = {
    x: width / 2,
    y: height - 40,
    size: 20,
    speed: 4,
  };

  // Simple starfield for background
  const stars = [];
  const starCount = 80;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5 + 0.5,
    });
  }

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // Asteroid pool
  const asteroids = [];
  let spawnTimer = 0;
  const spawnInterval = 90; // frames
  let frame = 0;
  let gameOver = false;
  let startTime = performance.now();

  function spawnAsteroid() {
    const radius = 10 + Math.random() * 15;
    asteroids.push({
      x: Math.random() * (width - radius * 2) + radius,
      y: -radius,
      r: radius,
      speed: 2 + Math.random() * 2,
      angle: Math.random() * Math.PI * 2,
    });
    // Play short spawn tone
    playTone(300, 80);
  }

  function update() {
    // Move ship
    if (keys.ArrowLeft || keys.a) ship.x -= ship.speed;
    if (keys.ArrowRight || keys.d) ship.x += ship.speed;
    if (keys.ArrowUp || keys.w) ship.y -= ship.speed;
    if (keys.ArrowDown || keys.s) ship.y += ship.speed;
    // Keep within bounds
    ship.x = Math.max(ship.size, Math.min(width - ship.size, ship.x));
    ship.y = Math.max(ship.size, Math.min(height - ship.size, ship.y));

    // Spawn asteroids
    if (spawnTimer <= 0) {
      spawnAsteroid();
      spawnTimer = spawnInterval;
    } else spawnTimer--;

    // Move asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // Remove off‑screen
      if (a.y - a.r > height) asteroids.splice(i, 1);
    }

    // Collision detection
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.r + ship.size * 0.6) { // rough ship radius
        // Collision sound
        playTone(100, 200);
        gameOver = true;
        break;
      }
    }
  }

  function drawShip() {
    // Ship with glowing gradient
    const grad = ctx.createLinearGradient(ship.x - ship.size, ship.y - ship.size, ship.x + ship.size, ship.y + ship.size);
    grad.addColorStop(0, '#4caf50');
    grad.addColorStop(1, '#81c784');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.size);
    ctx.lineTo(ship.x - ship.size, ship.y + ship.size);
    ctx.lineTo(ship.x + ship.size, ship.y + ship.size);
    ctx.closePath();
    ctx.fill();
  }

function draw() {
  // Background – dark space with stars
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#555';
  for (const s of stars) {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw ship with gradient stroke
  drawShip();

  // Draw asteroids with rotating radial gradient
  for (const a of asteroids) {
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.angle);
    const grad = ctx.createRadialGradient(0, 0, a.r * 0.2, 0, 0, a.r);
    grad.addColorStop(0, '#aaa');
    grad.addColorStop(1, '#333');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, a.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Score display
  const score = Math.floor((performance.now() - startTime) / 1000);
  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  ctx.fillText(`Score: ${score}`, 10, 20);

  // Game over overlay
  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#ff5555';
    ctx.font = '36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', width / 2, height / 2);
  }
}

  function loop() {
    if (!gameOver) {
      update();
      draw();
      requestAnimationFrame(loop);
    } else {
      draw(); // final frame with overlay
    }
  }

  // Start the game loop
  requestAnimationFrame(loop);
});
