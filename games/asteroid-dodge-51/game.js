// Simple ship‑asteroid dodge game
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  // Audio context for simple sounds
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // Ship - triangle shape
  const ship = { x: width / 2, y: height - 60, size: 20, speed: 4, dx: 0, dy: 0 };

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; // resume audio context on first interaction
  if (audioCtx.state === 'suspended') audioCtx.resume();
  // play movement sound
  beep(600, 0.02);
});
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // Asteroids
  const asteroids = [];
  const asteroidFreq = 1000; // ms
  const asteroidSpeed = 2;
  let lastAsteroid = 0;

  // Stars background
  const stars = [];
  const starCount = 80;
  for (let i = 0; i < starCount; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height, radius: Math.random() * 1.5 + 0.5, speed: Math.random() * 0.5 + 0.2 });
  }


  // Score
  let startTime = performance.now();
  let score = 0;

  function spawnAsteroid() {
    // Play spawn sound
    beep(300, 0.05);
    const size = Math.random() * 20 + 10;
    const x = Math.random() * (width - size);
    asteroids.push({ x, y: -size, w: size, h: size });
  }

  function update(dt) {
    // Move ship
    ship.dx = 0; ship.dy = 0;
    if (keys.ArrowLeft) ship.dx = -ship.speed;
    if (keys.ArrowRight) ship.dx = ship.speed;
    if (keys.ArrowUp) ship.dy = -ship.speed;
    if (keys.ArrowDown) ship.dy = ship.speed;
    ship.x = Math.max(0, Math.min(width - ship.size, ship.x + ship.dx));
    ship.y = Math.max(0, Math.min(height - ship.size, ship.y + ship.dy));

    // Stars movement
    for (const s of stars) {
      s.y += s.speed;
      if (s.y > height) { s.y = 0; s.x = Math.random() * width; }
    }

    // Spawn asteroids
    if (performance.now() - lastAsteroid > asteroidFreq) {
      spawnAsteroid();
      lastAsteroid = performance.now();
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += asteroidSpeed;
      // Remove off‑screen
      if (a.y > height) asteroids.splice(i, 1);
    }

    // Check collisions (square bounding box)
    for (const a of asteroids) {
      if (a.x < ship.x + ship.size && a.x + a.w > ship.x && a.y < ship.y + ship.size && a.y + a.h > ship.y) {
        // Game over
        beep(150, 0.4);
        alert('Game Over! Score: ' + Math.floor(score));
        // Reset
        asteroids.length = 0;
        ship.x = width / 2; ship.y = height - 60;
        startTime = performance.now();
        break;
      }
    }

    // Score
    score = (performance.now() - startTime) / 1000;
  }

  function draw() {
    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#001');
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Stars
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ship - triangle
    ctx.fillStyle = '#0af';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.size);
    ctx.lineTo(ship.x + ship.size / 2, ship.y);
    ctx.lineTo(ship.x + ship.size, ship.y + ship.size);
    ctx.closePath();
    ctx.fill();

    // Asteroids - circles with simple shading
    for (const a of asteroids) {
      const rad = a.w / 2;
      const cx = a.x + rad;
      const cy = a.y + rad;
      const gradient = ctx.createRadialGradient(cx - rad / 3, cy - rad / 3, rad / 3, cx, cy, rad);
      gradient.addColorStop(0, '#bbb');
      gradient.addColorStop(1, '#555');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    // Score text
    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
  }

  let last = performance.now();
  function loop(now) {
    const dt = now - last;
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
