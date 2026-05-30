// Asteroid Dodge Game
// Targets canvas element with id="game"

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, duration) {
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
  const width = canvas.width;
  const height = canvas.height;

  // Game state
  // Add starfield for background
  const starCount = 100;
  const stars = Array.from({length: starCount}, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 1.5 + 0.5,
    speed: Math.random() * 0.5 + 0.2
  }));
  const state = {
    ship: { x: width / 2, y: height - 30, width: 40, height: 20, speed: 5 },
    asteroids: [],
    score: 0,
    lastAsteroidTime: 0,
    asteroidInterval: 800, // ms
    running: true,
  };

  // Input handling (arrow keys and mouse)
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    state.ship.x = mx;
  });

  function spawnAsteroid() {
    // Play spawn sound
    playBeep(400, 0.1);
    const size = Math.random() * 30 + 20;
    const x = Math.random() * (width - size);
    const speed = Math.random() * 2 + 1;
    state.asteroids.push({ x, y: -size, size, speed });
  }

  function update(dt) {
    // Move starfield
    for (const s of stars) {
      s.y += s.speed;
      if (s.y > height) {
        s.y = 0;
        s.x = Math.random() * width;
      }
    }
    // Ship movement via arrow keys
    if (keys['ArrowLeft']) state.ship.x -= state.ship.speed;
    if (keys['ArrowRight']) state.ship.x += state.ship.speed;
    // Clamp ship within canvas
    state.ship.x = Math.max(state.ship.width / 2, Math.min(width - state.ship.width / 2, state.ship.x));

    // Spawn asteroids based on interval
    const now = Date.now();
    if (now - state.lastAsteroidTime > state.asteroidInterval) {
      spawnAsteroid();
      state.lastAsteroidTime = now;
    }

    // Update asteroids
    for (let i = state.asteroids.length - 1; i >= 0; i--) {
      const a = state.asteroids[i];
      a.y += a.speed;
      // Remove off‑screen asteroids
      if (a.y - a.size > height) state.asteroids.splice(i, 1);
    }

    // Collision detection
    for (const a of state.asteroids) {
      const dx = Math.abs(a.x + a.size / 2 - state.ship.x);
      const dy = Math.abs(a.y + a.size / 2 - state.ship.y);
      if (dx < (a.size / 2 + state.ship.width / 2) && dy < (a.size / 2 + state.ship.height / 2)) {
        state.running = false;
        // Play crash sound
        playBeep(150, 0.3);
        break;
      }
    }

    // Increment score
    if (state.running) state.score += dt / 1000; // seconds
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    // Draw starfield background
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw ship (simple triangle with gradient)
    const shipGrad = ctx.createLinearGradient(state.ship.x - state.ship.width / 2, state.ship.y, state.ship.x + state.ship.width / 2, state.ship.y + state.ship.height);
    shipGrad.addColorStop(0, '#00ff00');
    shipGrad.addColorStop(1, '#006600');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(state.ship.x, state.ship.y);
    ctx.lineTo(state.ship.x - state.ship.width / 2, state.ship.y + state.ship.height);
    ctx.lineTo(state.ship.x + state.ship.width / 2, state.ship.y + state.ship.height);
    ctx.closePath();
    ctx.fill();

    // Draw asteroids
    ctx.fillStyle = '#a52a2a';
    for (const a of state.asteroids) {
      ctx.beginPath();
      ctx.arc(a.x + a.size / 2, a.y + a.size / 2, a.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(state.score), 10, 20);

    // Game over overlay
    if (!state.running) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2 - 10);
      ctx.font = '18px sans-serif';
      ctx.fillText('Final Score: ' + Math.floor(state.score), width / 2, height / 2 + 20);
    }
  }

  let lastTime = performance.now();
  function loop(ts) {
    const dt = ts - lastTime;
    lastTime = ts;
    if (state.running) update(dt);
    draw();
    if (state.running) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
