// Asteroid Dodge game
// Canvas element with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio context is resumed on user interaction
  const resumeAudio = () => { if (audioCtx.state !== 'running') audioCtx.resume(); };
  window.addEventListener('keydown', resumeAudio, { once: true });
  // Simple tone player
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
  // Create background starfield
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 2 + 1,
      speed: Math.random() * 0.5 + 0.2,
    });
  }

  // Set canvas dimensions if not already set
  if (!canvas.width) canvas.width = canvas.clientWidth || 800;
  if (!canvas.height) canvas.height = canvas.clientHeight || 600;

  const ship = {
    x: canvas.width / 2,
    y: canvas.height - 40,
    width: 30,
    height: 30,
    speed: 5,
    gradient: null,
  };
  // Create ship gradient after ship dimensions are known
  const shipGrad = ctx.createLinearGradient(0, 0, 0, ship.height);
  shipGrad.addColorStop(0, '#00f');
  shipGrad.addColorStop(1, '#66f');
  ship.gradient = shipGrad;

  const keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false };
  window.addEventListener('keydown', e => { if (e.key in keys) keys[e.key] = true; });
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  let asteroids = [];
  let spawnTimer = 0;
  let score = 0;
  let spawnInterval = 1000; // ms
  let lastTime = 0;
  let speedMultiplier = 1;
  let gameOver = false;

  function spawnAsteroid() {
    // Create asteroid with radial gradient for depth
    const radius = Math.random() * 15 + 10;
    const x = Math.random() * (canvas.width - radius * 2) + radius;
    const gradient = ctx.createRadialGradient(x, -radius, 0, x, -radius, radius);
    gradient.addColorStop(0, '#bbb');
    gradient.addColorStop(1, '#555');
    asteroids.push({ x, y: -radius, radius, speed: 2 * speedMultiplier, gradient });
    // Play spawn sound
    playTone(300, 0.05);
  }

  function update(dt) {
    // Update score based on time survived
    score += dt * 0.01; // score increments slowly
    // Move background stars
    for (const s of stars) {
      s.y += s.speed * dt / 16;
      if (s.y > canvas.height) {
        s.y = 0;
        s.x = Math.random() * canvas.width;
      }
    }
    if (gameOver) return;
    // Move ship
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    // Clamp ship inside canvas
    ship.x = Math.max(0, Math.min(canvas.width - ship.width, ship.x));
    ship.y = Math.max(0, Math.min(canvas.height - ship.height, ship.y));

    // Spawn logic
    spawnTimer += dt;
    if (spawnTimer > spawnInterval) {
      spawnTimer -= spawnInterval;
      spawnAsteroid();
      // Gradually increase difficulty
      speedMultiplier += 0.02;
      spawnInterval = Math.max(200, spawnInterval - 5);
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed * dt / 16; // normalize to ~60fps
      // Remove off-screen
      if (a.y - a.radius > canvas.height) asteroids.splice(i, 1);
    }

    // Collision detection
    for (const a of asteroids) {
      const shipCenterX = ship.x + ship.width / 2;
      const shipCenterY = ship.y + ship.height / 2;
      const dx = shipCenterX - a.x;
      const dy = shipCenterY - a.y;
      const dist = Math.hypot(dx, dy);
if (dist < a.radius + Math.max(ship.width, ship.height) / 2) {
          // Play collision sound
          playTone(150, 0.2);
          gameOver = true;
          break;
        }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw ship (triangle) with gradient
    ctx.fillStyle = ship.gradient;
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.width / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.height);
    ctx.lineTo(ship.x + ship.width, ship.y + ship.height);
    ctx.closePath();
    ctx.fill();
    // Draw asteroids with their gradients
    for (const a of asteroids) {
      ctx.fillStyle = a.gradient || '#888';
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
