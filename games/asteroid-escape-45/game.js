// Game: Asteroid Escape
// Targets a <canvas id="game"> element.
// Minimalist implementation: ship (blue rect) on left, asteroids (gray rects) drift right->left.
// Up/Down arrows or mouse/touch move ship vertically. Score = time survived.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Ship (triangle)
  const ship = { x: 50, y: height / 2, w: 30, h: 20, speed: 5 };

  // Asteroids collection (circles)
  const asteroids = [];
  const asteroidSpawnInterval = 1500; // ms
  let lastSpawn = 0;

  // Stars for background
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 1,
      speed: Math.random() * 0.5 + 0.2,
    });
  }

  // Input handling
  const keys = { ArrowUp: false, ArrowDown: false };
  window.addEventListener('keydown', e => { if (e.key in keys) keys[e.key] = true; });
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });
  // Touch / mouse click moves ship towards pointer
  const pointer = { y: ship.y };
  const updatePointer = e => {
    const rect = canvas.getBoundingClientRect();
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    pointer.y = clientY - rect.top;
  };
  canvas.addEventListener('mousemove', updatePointer);
  canvas.addEventListener('touchmove', updatePointer);

  // Score
  let startTime = performance.now();
  let score = 0;
  const scoreEl = document.createElement('div');
  scoreEl.style.position = 'absolute';
  scoreEl.style.left = '10px';
  scoreEl.style.top = '10px';
  scoreEl.style.color = '#fff';
  scoreEl.style.font = '16px sans-serif';
  document.body.appendChild(scoreEl);

  // Audio context and helper functions
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  // Background hum (low frequency loop)
  let backgroundInterval = setInterval(() => playTone(80, 0.1), 1000);

  function spawnAsteroid() {
    const size = 20 + Math.random() * 30;
    const y = Math.random() * (height - size);
    const speed = 2 + Math.random() * 3;
    asteroids.push({ x: width, y, w: size, h: size, speed });
    // sound effect for new asteroid
    playTone(400, 0.05);
  }

  function update(dt) {
    // Ship movement
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    // pointer movement (smooth)
    const dy = pointer.y - (ship.y + ship.h/2);
    ship.y += dy * 0.1;
    // clamp
    ship.y = Math.max(0, Math.min(height - ship.h, ship.y));

    // Update stars (move left for parallax)
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.x -= s.speed;
      if (s.x < 0) {
        s.x = width;
        s.y = Math.random() * height;
      }
    }

    // Asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed;
      if (a.x + a.w < 0) asteroids.splice(i, 1);
      // collision
      if (a.x < ship.x + ship.w && a.x + a.w > ship.x &&
          a.y < ship.y + ship.h && a.y + a.h > ship.y) {
        gameOver();
        return false;
      }
    }

    // Spawn new asteroids
    if (performance.now() - lastSpawn > asteroidSpawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }

    // Score
    score = Math.floor((performance.now() - startTime) / 1000);
    scoreEl.textContent = `Score: ${score}`;
    return true;
  }

  function draw() {
    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#111');
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Stars (twinkling)
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ship (triangle)
    ctx.fillStyle = '#0af';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h / 2);
    ctx.lineTo(ship.x + ship.w, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();

    // Asteroids (circles)
    ctx.fillStyle = '#888';
    for (const a of asteroids) {
      ctx.beginPath();
      ctx.arc(a.x + a.w / 2, a.y + a.h / 2, a.w / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  let lastTime = 0;
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (!update(dt)) return; // stopped on collision
    draw();
    requestAnimationFrame(loop);
  }

  function gameOver() {
    // Stop background hum
    clearInterval(backgroundInterval);
    // Collision sound
    playTone(200, 0.3);
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#f00';
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', width / 2, height / 2);
    ctx.font = '24px sans-serif';
    ctx.fillText(`Score: ${score}`, width / 2, height / 2 + 40);
  }


  // Kick‑off
  requestAnimationFrame(loop);
})();
