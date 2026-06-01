// Asteroid Escape – simple canvas game
// The HTML contains a <canvas id="game"></canvas>
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Resume audio on first user interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  window.addEventListener('keydown', resumeAudio, { once: true });
  window.addEventListener('click', resumeAudio, { once: true });
  function beep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  const width = (canvas.width = canvas.offsetWidth || 800);
  const height = (canvas.height = canvas.offsetHeight || 600);

  // Ship settings
  const ship = { w: 40, h: 20, x: width / 2 - 20, y: height - 30, speed: 5 };
  // Generate background stars
  const stars = [];
  const starCount = 80;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5 + 0.5,
    });
  }

  // Asteroid settings
  const asteroids = [];
  const asteroidSize = 30;
  const spawnInterval = 1000; // ms
  let lastSpawn = 0;

  // Score
  let startTime = performance.now();
  let score = 0;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnAsteroid() {
    const x = Math.random() * (width - asteroidSize);
    asteroids.push({ x, y: -asteroidSize, w: asteroidSize, h: asteroidSize, speed: 2 + Math.random() * 2 });
    // Play a short beep for each new asteroid
    beep(400, 0.08);
  }

  function update(dt) {
    // Move ship
    if (keys['ArrowLeft'] || keys['a']) ship.x -= ship.speed;
    if (keys['ArrowRight'] || keys['d']) ship.x += ship.speed;
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));

    // Spawn asteroids
    if (performance.now() - lastSpawn > spawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // Remove off‑screen
      if (a.y > height) asteroids.splice(i, 1);
    }

    // Collision detection
    for (const a of asteroids) {
      if (
        a.x < ship.x + ship.w &&
        a.x + a.w > ship.x &&
        a.y < ship.y + ship.h &&
        a.y + a.h > ship.y
      ) {
        // Game over – stop animation and play sound
        beep(200, 0.3);
        cancelAnimationFrame(animId);
        alert('Game Over! Score: ' + Math.floor(score));
        return;
      }
    }

    // Update score (seconds survived)
    score = (performance.now() - startTime) / 1000;
  }

  function draw() {
    // Background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    // Stars
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Ship (triangle)
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // Asteroids (circles with gradient)
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x + a.w/2, a.y + a.h/2, a.w*0.1, a.x + a.w/2, a.y + a.h/2, a.w/2);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.w/2, a.y + a.h/2, a.w/2, 0, Math.PI * 2);
      ctx.fill();
    }
    // Score text
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
  }

  let animId;
  let lastTime = 0;
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    animId = requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
