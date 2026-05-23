// Astro Dodge – enhanced graphics version with sound
// Requires a <canvas id="game"></canvas> in the HTML

(() => {
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio context runs after first interaction
  const resumeAudio = () => { audioCtx.state === 'suspended' && audioCtx.resume(); };
  window.addEventListener('keydown', resumeAudio, {once: true});

  // Simple beep for collisions
  const playBeep = (freq = 220, duration = 0.2) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };

  // Ambient background tone
  let bgOsc;
  const startBackgroundTone = () => {
    bgOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    bgOsc.frequency.value = 60; // low hum
    gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
    bgOsc.connect(gain).connect(audioCtx.destination);
    bgOsc.start();
  };
  const stopBackgroundTone = () => {
    if (bgOsc) { bgOsc.stop(); bgOsc.disconnect(); }
  };

  // Start background tone now (will resume on first key press)
  startBackgroundTone();
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  // Size canvas to fill its container or the window
  canvas.width = canvas.clientWidth || window.innerWidth;
  canvas.height = canvas.clientHeight || window.innerHeight;

  // ----- Starfield -----
  const starCount = 120;
  const stars = [];
  const initStars = () => {
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.5 + 0.5,
        speed: Math.random() * 0.6 + 0.2,
      });
    }
  };
  initStars();

  // ----- Player ship -----
  const ship = {
    w: 24,
    h: 24,
    x: canvas.width / 2 - 12,
    y: canvas.height - 50,
    speed: 5,
    colour: '#0ff',
  };

  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // ----- Asteroids -----
  const asteroids = [];
  const asteroidSpawnInterval = 800; // ms
  const maxAsteroids = 30;
  const spawnAsteroid = () => {
    if (asteroids.length >= maxAsteroids) return;
    const radius = 12 + Math.random() * 12;
    const x = Math.random() * (canvas.width - radius * 2) + radius;
    const y = -radius;
    const speed = 2 + Math.random() * 2;
    const angle = Math.random() * Math.PI * 2;
    const angularSpeed = (Math.random() - 0.5) * 0.04; // rotation per frame
    asteroids.push({ x, y, radius, speed, angle, angularSpeed, colour: '#f44' });
  };
  const asteroidTimer = setInterval(spawnAsteroid, asteroidSpawnInterval);

  let score = 0;
  let gameOver = false;

  const update = () => {
    if (gameOver) return;
    // ---- Move ship ----
    if (keys['ArrowLeft'] && ship.x > 0) ship.x -= ship.speed;
    if (keys['ArrowRight'] && ship.x + ship.w < canvas.width) ship.x += ship.speed;
    if (keys['ArrowUp'] && ship.y > 0) ship.y -= ship.speed;
    if (keys['ArrowDown'] && ship.y + ship.h < canvas.height) ship.y += ship.speed;

    // ---- Update stars (parallax background) ----
    for (const s of stars) {
      s.y += s.speed;
      if (s.y > canvas.height) {
        s.y = -s.radius;
        s.x = Math.random() * canvas.width;
      }
    }

    // ---- Move asteroids ----
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      a.angle += a.angularSpeed;
      if (a.y - a.radius > canvas.height) asteroids.splice(i, 1);
    }

    // ---- Collision detection ----
    for (const a of asteroids) {
      const dx = (ship.x + ship.w / 2) - a.x;
      const dy = (ship.y + ship.h / 2) - a.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.radius + Math.max(ship.w, ship.h) / 2) {
        // Play collision sound
        playBeep(110, 0.3);
        gameOver = true;
        clearInterval(asteroidTimer);
        // Stop background tone
        stopBackgroundTone();
        break;
      }
    }

    score++;
    draw();
    requestAnimationFrame(update);
  };

  const draw = () => {
    // Clear with a deep‑space gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#02010a');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw stars
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw ship with a subtle glow
    const shipGrad = ctx.createRadialGradient(
      ship.x + ship.w / 2,
      ship.y + ship.h / 2,
      2,
      ship.x + ship.w / 2,
      ship.y + ship.h / 2,
      ship.w
    );
    shipGrad.addColorStop(0, '#0fffff');
    shipGrad.addColorStop(1, ship.colour);
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();

    // Draw asteroids with radial shading and rotation
    for (const a of asteroids) {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.angle);
      const grad = ctx.createRadialGradient(0, 0, a.radius * 0.2, 0, 0, a.radius);
      grad.addColorStop(0, '#fff');
      grad.addColorStop(1, a.colour);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, a.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Score display
    ctx.fillStyle = '#0f0';
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + score, 10, 20);

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
      ctx.font = '24px sans-serif';
      ctx.fillText('Final Score: ' + score, canvas.width / 2, canvas.height / 2 + 40);
    }
  };

  // Start the game loop
  requestAnimationFrame(update);
})();
