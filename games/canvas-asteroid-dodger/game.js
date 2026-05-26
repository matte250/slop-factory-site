// Asteroid Dodger game – enhanced graphics
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration, type = 'sine') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  function playExplosion() {
    // short noise burst
    const bufferSize = audioCtx.sampleRate * 0.2;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, audioCtx.currentTime);
    noise.connect(filter).connect(audioCtx.destination);
    noise.start();
    noise.stop(audioCtx.currentTime + 0.2);
  }
  function playThrust() {
    playTone(200, 100, 'square');
  }

  // Create starfield background
  const starCount = 80;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5 + 0.5,
    });
  }

  // Player ship
  const ship = {
    x: width / 2,
    y: height - 60,
    size: 20,
    speed: 4,
    shield: 100,
  };

  const keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false };
  document.addEventListener('keydown', async e => {
    if (e.key in keys) {
      keys[e.key] = true;
      // Ensure audio context is running
      if (audioCtx.state !== 'running') await audioCtx.resume();
      playThrust();
    }
  });
  document.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  // Asteroids
  const asteroids = [];
  const asteroidSpawnRate = 0.02; // chance per frame
  const asteroidSpeed = 2;

  let score = 0;
  let lastTime = performance.now();

  function spawnAsteroid() {
    const size = Math.random() * 30 + 10;
    asteroids.push({
      x: Math.random() * (width - size),
      y: -size,
      size,
    });
  }

  function update(dt) {
    // Move ship
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    // Keep inside canvas
    ship.x = Math.max(0, Math.min(width - ship.size, ship.x));
    ship.y = Math.max(0, Math.min(height - ship.size, ship.y));

    // Spawn asteroids
    if (Math.random() < asteroidSpawnRate) spawnAsteroid();

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += asteroidSpeed;
      // Remove off-screen
      if (a.y > height) asteroids.splice(i, 1);
    }

    // Collision detection
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      if (
        ship.x < a.x + a.size &&
        ship.x + ship.size > a.x &&
        ship.y < a.y + a.size &&
        ship.y + ship.size > a.y
      ) {
        ship.shield -= 20;
        asteroids.splice(i, 1);
        playExplosion();
        if (ship.shield <= 0) {
          // Game over sound
          playExplosion();
          alert(`Game Over! Score: ${Math.floor(score)}`);
          document.location.reload();
        }
      }
    }

    // Score based on distance (time)
    score += dt * 0.01; // arbitrary factor
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // Draw starfield
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = 'white';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // Draw ship as triangle
    ctx.fillStyle = '#00ffcc';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y);
    ctx.lineTo(ship.x + ship.size, ship.y + ship.size * 1.5);
    ctx.lineTo(ship.x - ship.size, ship.y + ship.size * 1.5);
    ctx.closePath();
    ctx.fill();
    // Shield indicator (green bar with red background)
    ctx.fillStyle = 'red';
    ctx.fillRect(5, 5, 100, 10);
    ctx.fillStyle = 'lime';
    ctx.fillRect(5, 5, ship.shield, 10);
    // Draw asteroids with radial gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(
        a.x + a.size / 2,
        a.y + a.size / 2,
        a.size * 0.2,
        a.x + a.size / 2,
        a.y + a.size / 2,
        a.size / 2
      );
      grad.addColorStop(0, '#666');
      grad.addColorStop(1, '#222');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.size / 2, a.y + a.size / 2, a.size / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // Score
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${Math.floor(score)}`, width - 120, 20);
  }

  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
