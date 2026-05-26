// Asteroid Dodge game (canvas id="game")
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let bgOsc = null;
  function startBackground() {
    if (bgOsc) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 50;
    gain.gain.value = 0.02;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    bgOsc = osc;
  }
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;

  // Player ship
  const ship = { x: 50, y: height / 2, w: 30, h: 20, dy: 0, speed: 4 };

  // Input handling (WASD / Arrow keys)
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    startBackground();
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // Asteroids
  const asteroids = [];
  // Starfield stars
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height, speed: 0.2 + Math.random() * 0.3 });
  }
  const asteroidSpawnInterval = 1200; // ms
  let lastSpawn = 0;

  // Game state
  let score = 0;
  let gameOver = false;

  function spawnAsteroid() {
    const size = 20 + Math.random() * 30;
    asteroids.push({ x: width + size, y: Math.random() * (height - size), w: size, h: size, speed: 2 + Math.random() * 3 });
  }

  function update(dt) {
    // Move stars for parallax effect
    for (const s of stars) {
      s.x -= s.speed;
      if (s.x < 0) s.x = width;
    }
    // Move ship based on input
    if (keys.ArrowUp || keys.w) ship.dy = -ship.speed;
    else if (keys.ArrowDown || keys.s) ship.dy = ship.speed;
    else ship.dy = 0;
    ship.y += ship.dy;
    // Keep ship inside canvas
    ship.y = Math.max(0, Math.min(height - ship.h, ship.y));

    // Spawn asteroids
    if (performance.now() - lastSpawn > asteroidSpawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed;
      // Remove off‑screen
if (a.x + a.w < 0) {
          asteroids.splice(i, 1);
          score++;
          // Play short beep for scoring
          playTone(400, 0.05);
        } else if (collides(ship, a)) {
          gameOver = true;
          // Play collision sound
          playTone(200, 0.3);
        }
    }
  }

  function collides(r1, r2) {
    return !(r2.x > r1.x + r1.w ||
             r2.x + r2.w < r1.x ||
             r2.y > r1.y + r1.h ||
             r2.y + r2.h < r1.y);
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // Starfield background with moving stars
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    // draw stars
    ctx.fillStyle = '#555';
    for (const s of stars) {
      ctx.fillRect(s.x, s.y, 1, 1);
    }
    // Ship (triangle)
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h / 2);
    ctx.lineTo(ship.x + ship.w, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // Asteroids with simple shading
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(
        a.x + a.w / 2,
        a.y + a.h / 2,
        a.w * 0.1,
        a.x + a.w / 2,
        a.y + a.h / 2,
        a.w / 2
      );
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.w / 2, a.y + a.h / 2, a.w / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  let lastTime = 0;
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
