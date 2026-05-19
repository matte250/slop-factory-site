// Asteroid Dodge Game
// Requires a <canvas id="game"></canvas> in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;
  // Initialize Web Audio context and background tone
  window._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Background hum (low sine wave)
  const bgOsc = window._audioCtx.createOscillator();
  const bgGain = window._audioCtx.createGain();
  bgOsc.frequency.value = 60;
  bgGain.gain.value = 0.02;
  bgOsc.connect(bgGain);
  bgGain.connect(window._audioCtx.destination);
  bgOsc.start();
  // Simple tone helper
  function playTone(freq, duration) {
    const osc = window._audioCtx.createOscillator();
    const gain = window._audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(window._audioCtx.destination);
    gain.gain.setValueAtTime(0.1, window._audioCtx.currentTime);
    osc.start();
    osc.stop(window._audioCtx.currentTime + duration);
  }

  // Ship definition
  const ship = {
    x: 50,
    y: height / 2,
    w: 20,
    h: 15,
    speed: 4,
    draw() {
      // Ship with glossy gradient
      const grad = ctx.createLinearGradient(this.x - this.w, this.y - this.h / 2, this.x, this.y + this.h / 2);
      grad.addColorStop(0, '#0f0');
      grad.addColorStop(1, '#004400');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - this.w, this.y + this.h / 2);
      ctx.lineTo(this.x - this.w, this.y - this.h / 2);
      ctx.closePath();
      ctx.fill();
    }
  };

  // Asteroid pool
  const asteroids = [];
  const asteroidSpawnInterval = 1500; // ms
  const asteroidSpeed = 3;
  const asteroidSizeRange = [15, 40];

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    // Resume audio context on first interaction
    if (window._audioCtx && window._audioCtx.state === 'suspended') {
      window._audioCtx.resume();
    }
    // Play move sound for up/down
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      playTone(400, 0.05);
    }
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => keys[e.key] = false);
  // Mouse / touch drag
  let dragging = false;
  canvas.addEventListener('mousedown', () => dragging = true);
  canvas.addEventListener('mouseup', () => dragging = false);
  canvas.addEventListener('mouseleave', () => dragging = false);
  canvas.addEventListener('mousemove', e => {
    if (dragging) ship.y = e.offsetY;
  });
  canvas.addEventListener('touchstart', e => { dragging = true; e.preventDefault(); });
  canvas.addEventListener('touchend', () => dragging = false);
  canvas.addEventListener('touchmove', e => {
    if (dragging) {
      const rect = canvas.getBoundingClientRect();
      ship.y = e.touches[0].clientY - rect.top;
    }
    e.preventDefault();
  }, { passive: false });

  // Scoring
  let startTime = null;
  let score = 0;

  function spawnAsteroid() {
    const size = Math.random() * (asteroidSizeRange[1] - asteroidSizeRange[0]) + asteroidSizeRange[0];
    asteroids.push({
      x: width + size,
      y: Math.random() * height,
      r: size / 2,
      speed: asteroidSpeed + Math.random() * 2
    });
  }

  let lastSpawn = 0;

  function update(delta) {
    // Ship movement via arrow keys
    if (keys['ArrowUp']) ship.y -= ship.speed;
    if (keys['ArrowDown']) ship.y += ship.speed;
    // Keep ship within bounds
    ship.y = Math.max(ship.h / 2, Math.min(height - ship.h / 2, ship.y));

    // Asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed;
      // Remove off‑screen
      if (a.x + a.r < 0) asteroids.splice(i, 1);
    }
    // Spawn new asteroids
    if (performance.now() - lastSpawn > asteroidSpawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }
    // Collision detection
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.r + Math.max(ship.w, ship.h) / 2) {
        // Play crash sound
        if (window._audioCtx) {
          const osc = window._audioCtx.createOscillator();
          const gain = window._audioCtx.createGain();
          osc.frequency.value = 150;
          osc.type = 'sawtooth';
          osc.connect(gain);
          gain.connect(window._audioCtx.destination);
          gain.gain.setValueAtTime(0.2, window._audioCtx.currentTime);
          osc.start();
          osc.stop(window._audioCtx.currentTime + 0.2);
        }
        // Game over
        alert('Game Over! Score: ' + Math.floor(score));
        reset();
        return;
      }
    }
    // Update score
    const now = performance.now();
    if (!startTime) startTime = now;
    score = (now - startTime) / 1000; // seconds survived
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // Starfield background with moving stars
    // Create gradient sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, '#001133');
    skyGrad.addColorStop(1, '#000022');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);
    // Draw moving stars
    if (!window._stars) {
      // Initialize stars
      window._stars = [];
      for (let i = 0; i < 100; i++) {
        window._stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 2 + 0.5,
          speed: 0.5 + Math.random() * 0.5,
        });
      }
    }
    ctx.fillStyle = '#fff';
    for (const s of window._stars) {
      s.x -= s.speed;
      if (s.x < 0) {
        s.x = width;
        s.y = Math.random() * height;
      }
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }

    // Draw ship
    ship.draw();
    // Draw asteroids
    // Asteroids with radial gradient shading
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#444');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Score display
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
  }

  function loop(timestamp) {
    update(timestamp);
    draw();
    requestAnimationFrame(loop);
  }

  function reset() {
    asteroids.length = 0;
    ship.y = height / 2;
    startTime = null;
    score = 0;
    lastSpawn = performance.now();
  }

  // Start the game loop
  requestAnimationFrame(loop);
})();
