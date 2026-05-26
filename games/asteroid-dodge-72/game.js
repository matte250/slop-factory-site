// Asteroid Dodge game
// Canvas with id "game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Set canvas size if not already set
  canvas.width = canvas.width || 400;
  canvas.height = canvas.height || 600;

  const ship = { w: 40, h: 30, x: canvas.width / 2 - 20, y: canvas.height - 40, speed: 5 };
  const asteroids = [];
  // Starfield background
  const stars = [];
  const STAR_COUNT = 100;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, r: Math.random() * 1.5 + 0.5 });
  }
  let lastSpawn = 0;
  let score = 0;
  let startTime = Date.now();
  let running = true;

  const keys = {};
  window.addEventListener('keydown', e => {
    audioCtx.resume();
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnAsteroid() {
    const radius = Math.random() * 15 + 10;
    const x = Math.random() * (canvas.width - 2 * radius) + radius;
    const speed = 2 + Math.random() * 2 + score * 0.001; // gradually faster
    asteroids.push({ x, y: -radius, r: radius, speed });
    // Play spawn sound
    playTone(300, 0.05);
  }

  function update(dt) {
    // Move ship
    if (keys['ArrowLeft']) ship.x -= ship.speed;
    if (keys['ArrowRight']) ship.x += ship.speed;
    ship.x = Math.max(0, Math.min(canvas.width - ship.w, ship.x));

    // Spawn asteroids every 800ms
    if (Date.now() - lastSpawn > 800) {
      spawnAsteroid();
      lastSpawn = Date.now();
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // Remove off-screen
      if (a.y - a.r > canvas.height) asteroids.splice(i, 1);
    }

    // Collision detection
    for (const a of asteroids) {
      const distX = Math.max(ship.x, Math.min(a.x, ship.x + ship.w));
      const distY = Math.max(ship.y, Math.min(a.y, ship.y + ship.h));
      const dx = a.x - distX;
      const dy = a.y - distY;
      if (dx * dx + dy * dy < a.r * a.r) {
        // Play collision sound
        playTone(100, 0.3);
        running = false;
        break;
      }
    }

    // Update score
    score = Math.floor((Date.now() - startTime) / 1000);
  }

  function draw() {
    // Draw background (starfield)
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Ship
    ctx.fillStyle = '#0f0';
    ctx.fillRect(ship.x, ship.y, ship.w, ship.h);
    // Asteroids
    ctx.fillStyle = '#888';
    for (const a of asteroids) {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}s`, 10, 20);
  }

  function loop() {
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f00';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2 - 60, canvas.height / 2);
      ctx.fillText(`Score: ${score}s`, canvas.width / 2 - 55, canvas.height / 2 + 30);
      return;
    }
    const now = Date.now();
    const dt = now - (loop.last ?? now);
    loop.last = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  loop();
})();
