// Simple Space Escape game based on IDEA.md
// Targets a <canvas id="game"></canvas> in the HTML.

(() => {
  const canvas = document.getElementById('game');
  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  // Simple beep for events
  function playBeep(freq, duration) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    oscillator.start();
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + duration);
  }
  // Continuous engine hum while moving
  let engineOsc = null;
  function startEngine() {
    if (engineOsc) return;
    engineOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    engineOsc.type = 'square';
    engineOsc.frequency.setValueAtTime(80, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
    engineOsc.connect(gain).connect(audioCtx.destination);
    engineOsc.start();
  }
  function stopEngine() {
    if (!engineOsc) return;
    engineOsc.stop();
    engineOsc.disconnect();
    engineOsc = null;
  }
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    oscillator.start();
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + duration);
  }
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Star field for background
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.5 + 0.5,
    });
  }

  // Player ship
  const ship = {
    x: width / 2,
    y: height - 60,
    width: 40,
    height: 40,
    speed: 5,
    color: '#0ff',
  };

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    // Ensure audio context is resumed after user interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // Asteroids
  const asteroids = [];
  const asteroidSpawnInterval = 1500; // ms
  let lastSpawn = 0;

  // Scoring
  let score = 0;
  let startTime = performance.now();

  function spawnAsteroid() {
    const size = Math.random() * 30 + 20;
    asteroids.push({
      x: Math.random() * (width - size),
      y: -size,
      size,
      speed: Math.random() * 2 + 2,
      color: '#f55',
    });
  }

  function update(dt) {
    // Engine sound based on ship movement
    const moving = keys.ArrowLeft || keys.ArrowRight || keys.ArrowUp || keys.ArrowDown;
    if (moving) startEngine(); else stopEngine();
    // Move background stars for a scrolling effect
    for (const s of stars) {
      s.y += 0.2; // slow drift
      if (s.y > height) {
        s.y = 0;
        s.x = Math.random() * width;
      }
    }
    // Move ship
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    // Keep inside bounds
    ship.x = Math.max(0, Math.min(width - ship.width, ship.x));
    ship.y = Math.max(0, Math.min(height - ship.height, ship.y));

    // Spawn asteroids
    if (performance.now() - lastSpawn > asteroidSpawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // Remove off‑screen
      if (a.y > height) {
        asteroids.splice(i, 1);
        score += 1; // reward for dodging
        playBeep(300, 0.1); // dodge sound
      }
    }

    // Collision detection
    for (const a of asteroids) {
      if (
        ship.x < a.x + a.size &&
        ship.x + ship.width > a.x &&
        ship.y < a.y + a.size &&
        ship.y + ship.height > a.y
      ) {
        // Game over
        playBeep(150, 0.3); // collision sound
    alert(`Game Over! Score: ${score}`);
        // Reset state
        ship.x = width / 2;
        ship.y = height - 60;
        asteroids.length = 0;
        score = 0;
        startTime = performance.now();
        break;
      }
    }

    // Update score based on time survived
    score = Math.floor((performance.now() - startTime) / 1000);
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // Background stars
    for (const s of stars) {
      ctx.fillStyle = `rgba(255,255,255,${s.opacity})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // Ship (draw as triangle)
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.width / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.height);
    ctx.lineTo(ship.x + ship.width, ship.y + ship.height);
    ctx.closePath();
    ctx.fill();
    // Asteroids with gradient shading
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(
        a.x + a.size / 2,
        a.y + a.size / 2,
        a.size * 0.1,
        a.x + a.size / 2,
        a.y + a.size / 2,
        a.size / 2
      );
      grad.addColorStop(0, '#ffaaaa');
      grad.addColorStop(1, '#aa0000');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.size / 2, a.y + a.size / 2, a.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    // Score display
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 30);
  }

  function loop(timestamp) {
    const dt = timestamp - (lastFrame || timestamp);
    lastFrame = timestamp;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  let lastFrame = 0;
  requestAnimationFrame(loop);
})();
