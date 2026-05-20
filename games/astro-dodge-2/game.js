// Astro Dodge game with enhanced graphics
// Canvas element with id="game" expected in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  // Set canvas size to fill parent or use defaults
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 400;

  // Create a simple starfield background
  const stars = [];
  const STAR_COUNT = 100;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
      twinkle: Math.random() * 0.05 + 0.02,
      phase: Math.random() * Math.PI * 2
    });
  }

  function drawStars() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      const alpha = 0.5 + 0.5 * Math.sin(Date.now() * s.twinkle + s.phase);
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  const PLAYER_SPEED = 4;
  const ASTEROID_SPEED_INITIAL = 2;
  const ASTEROID_SPEED_INCREMENT = 0.0005; // per frame
  const ASTEROID_SPAWN_INTERVAL = 90; // frames

  let frames = 0;
  let score = 0;
  let asteroidSpeed = ASTEROID_SPEED_INITIAL;
  let keyUp = false;
  let keyDown = false;

  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
  }
  function playScoreSound() { beep(880, 0.08); }
  function playCrashSound() { beep(150, 0.3); }

  const player = {
    x: 80,
    y: canvas.height / 2,
    width: 20,
    height: 30,
    draw() {
      // Gradient ship for a sleek look
      const grad = ctx.createLinearGradient(this.x - this.width, this.y - this.height / 2, this.x, this.y + this.height / 2);
      grad.addColorStop(0, '#0ff');
      grad.addColorStop(1, '#00f');
      ctx.fillStyle = grad;
      // Simple triangle ship
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - this.width, this.y + this.height / 2);
      ctx.lineTo(this.x - this.width, this.y - this.height / 2);
      ctx.closePath();
      ctx.fill();
      // Ship outline for contrast
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.stroke();
    },
    update() {
      if (keyUp) this.y -= PLAYER_SPEED;
      if (keyDown) this.y += PLAYER_SPEED;
      // Clamp to canvas
      this.y = Math.max(this.height / 2, Math.min(canvas.height - this.height / 2, this.y));
    }
  };

  const asteroids = [];

  function spawnAsteroid() {
    const radius = 15 + Math.random() * 15;
    const y = radius + Math.random() * (canvas.height - 2 * radius);
    asteroids.push({ x: canvas.width + radius, y, radius, passed: false });
  }

  function updateAsteroids() {
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= asteroidSpeed;
      // Score when passing ship
      if (!a.passed && a.x < player.x) {
        a.passed = true;
        score++;
        playScoreSound();
      }
      // Remove off‑screen
      if (a.x + a.radius < 0) asteroids.splice(i, 1);
    }
  }

  function drawAsteroids() {
    ctx.fillStyle = '#a52a2a';
    for (const a of asteroids) {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function checkCollision() {
    for (const a of asteroids) {
      // Simple circle‑triangle collision approximation using distance to ship centre
      const dx = a.x - player.x;
      const dy = a.y - player.y;
      const dist = Math.hypot(dx, dy);
      const shipApproxRadius = Math.max(player.width, player.height) / 2;
      if (dist < a.radius + shipApproxRadius) {
        return true;
      }
    }
    return false;
  }

  function drawScore() {
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
  }

  function updateStars() {
    // Move stars left to create parallax effect
    for (const s of stars) {
      s.x -= 0.5; // slower than asteroids
      if (s.x < 0) {
        s.x = canvas.width + s.radius;
        s.y = Math.random() * canvas.height;
      }
    }
  }

function loop() {
    // Draw background first
    drawStars();
    updateStars();
    // Clear only non‑star area (already cleared in drawStars)
    player.update();
    player.draw();
    if (frames % ASTEROID_SPAWN_INTERVAL === 0) spawnAsteroid();
    updateAsteroids();
    drawAsteroids();
    drawScore();
    // Increase difficulty gradually
    asteroidSpeed += ASTEROID_SPEED_INCREMENT;
    if (checkCollision()) {
      // Game over – display message and stop animation
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = '32px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
      ctx.font = '20px sans-serif';
      ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 30);
      return;
    }
    frames++;
    requestAnimationFrame(loop);
  }

  // Input handling – keyboard
  window.addEventListener('keydown', e => {
    // Resume audio context on first interaction
    audioCtx.resume();
    if (e.code === 'ArrowUp' || e.code === 'KeyW') keyUp = true;
    if (e.code === 'ArrowDown' || e.code === 'KeyS') keyDown = true;
  });
  window.addEventListener('keyup', e => {
    if (e.code === 'ArrowUp' || e.code === 'KeyW') keyUp = false;
    if (e.code === 'ArrowDown' || e.code === 'KeyS') keyDown = false;
  });
  // Touch – simple tap halves screen for up/down
  canvas.addEventListener('touchstart', e => {
    const touchY = e.touches[0].clientY - canvas.getBoundingClientRect().top;
    if (touchY < canvas.height / 2) keyUp = true; else keyDown = true;
  });
  canvas.addEventListener('touchend', () => {
    keyUp = false;
    keyDown = false;
  });

  // Start the loop
  requestAnimationFrame(loop);
})();
