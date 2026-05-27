// Asteroid Dodge – concise implementation targeting canvas#game

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // resume audio on first user interaction (required by browsers)
  const resumeAudio = () => { audioCtx.resume(); window.removeEventListener('click', resumeAudio); window.removeEventListener('keydown', resumeAudio); };
  window.addEventListener('click', resumeAudio);
  window.addEventListener('keydown', resumeAudio);

  // helper to play a beep
  function playBeep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // Ship – simple triangle (rocket) centered vertically
  const ship = { x: 40, y: height / 2, size: 20, speed: 4 };
  const keys = {};
  const asteroids = [];
  const stars = [];
  let score = 0;

  // create background stars
  function initStars(count = 100) {
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.5 + 0.5,
      });
    }
  }
  initStars();
  let lastSpawn = 0;
  let startTime = performance.now();
  let gameOver = false;

  // Input handling
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

    function spawnAsteroid() {
      const radius = 10 + Math.random() * 20;
      const side = Math.floor(Math.random() * 4);
      let x, y, vx, vy;
      const speed = 2 + Math.random() * 2;
      // spawn on random edge moving inward
      if (side === 0) { // left
        x = -radius; y = Math.random() * height; vx = speed; vy = 0;
      } else if (side === 1) { // right
        x = width + radius; y = Math.random() * height; vx = -speed; vy = 0;
      } else if (side === 2) { // top
        x = Math.random() * width; y = -radius; vx = 0; vy = speed;
      } else { // bottom
        x = Math.random() * width; y = height + radius; vx = 0; vy = -speed;
      }
      asteroids.push({ x, y, radius, vx, vy });
      // subtle spawn sound
      playBeep(300, 0.05);
    }

  function update(dt) {
    // Ship movement
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    // Keep ship inside canvas
    ship.x = Math.max(0, Math.min(width - ship.size, ship.x));
    ship.y = Math.max(0, Math.min(height - ship.size, ship.y));

    // Asteroid spawn
    if (performance.now() - lastSpawn > 800) { // approx 1 per sec
      spawnAsteroid();
      lastSpawn = performance.now();
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx;
      a.y += a.vy;
      // remove off‑screen
      if (a.x < -a.radius || a.x > width + a.radius || a.y < -a.radius || a.y > height + a.radius) {
        asteroids.splice(i, 1);
      }
    }

    // Collision detection
    const shipCx = ship.x + ship.size / 2;
    const shipCy = ship.y + ship.size / 2;
    for (const a of asteroids) {
      const dx = shipCx - a.x;
      const dy = shipCy - a.y;
      const dist2 = dx * dx + dy * dy;
      const radSum = ship.size / 2 + a.radius;
      if (dist2 < radSum * radSum) {
        // collision sound
        playBeep(120, 0.2);
        gameOver = true;
        break;
      }
    }

    // Score = seconds survived
    score = ((performance.now() - startTime) / 1000).toFixed(1);
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001d3d');
    bgGrad.addColorStop(1, '#000814');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // stars
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // Ship (blue triangle rocket)
    ctx.fillStyle = '#00f';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.size / 2);
    ctx.lineTo(ship.x + ship.size, ship.y);
    ctx.lineTo(ship.x + ship.size, ship.y + ship.size);
    ctx.closePath();
    ctx.fill();
    // Asteroids (gray circles with subtle gradient)
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // Score display
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}s`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#ff0';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText(`Game Over – ${score}s`, width / 2, height / 2);
    }
  }

  function loop(timestamp) {
    if (!gameOver) {
      const dt = timestamp - (lastTime || timestamp);
      update(dt);
      draw();
      lastTime = timestamp;
      requestAnimationFrame(loop);
    } else {
      draw(); // final frame with overlay
    }
  }
  let lastTime = 0;
  requestAnimationFrame(loop);
})();
