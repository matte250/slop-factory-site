// game.js – Asteroid Deflector implementation
// Assumes an HTML canvas with id "game" is present.

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  // Resize to fill the page
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // regenerate stars for new size
    stars.length = 0;
    initStars();
  }
window.addEventListener('resize', resize);
    const stars = [];
    // Initialize background stars
    initStars();
    // Function to generate stars
    function initStars(count = 200) {
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 1.5 + 0.5,
        });
      }
    }

  const center = { x: () => canvas.width / 2, y: () => canvas.height / 2 };
  const shipRadius = 20; // visual ship size
  const shieldRadius = 80; // distance from ship centre
  const shieldArc = Math.PI / 3; // 60° sweep

  let shieldAngle = 0; // current direction (radians)
  let shieldDir = 0; // -1 left, 1 right, 0 none
  const rotateSpeed = 0.04; // rad per frame

  // Input handling – arrow keys and mouse drag
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') shieldDir = -1;
    else if (e.key === 'ArrowRight') shieldDir = 1;
  });
  window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' && shieldDir === -1) shieldDir = 0;
    else if (e.key === 'ArrowRight' && shieldDir === 1) shieldDir = 0;
  });

  let dragging = false;
  let lastMouseX = 0;
  canvas.addEventListener('mousedown', (e) => {
    dragging = true;
    lastMouseX = e.clientX;
  });
  canvas.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastMouseX;
    shieldAngle += dx * 0.005; // Pixels to radians conversion
    lastMouseX = e.clientX;
  });
  canvas.addEventListener('mouseup', () => (dragging = false));
  canvas.addEventListener('mouseleave', () => (dragging = false));

  // Asteroid handling
  const asteroids = [];
  const particles = []; // explosion fragments
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.3, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playBlockSound() { playTone(600, 0.07); }
  function playExplosionSound() { playTone(150, 0.3); }
  function playGameOverSound() { playTone(80, 0.5); }
  // Ensure audio context resumes on first interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  canvas.addEventListener('mousedown', resumeAudio);
  window.addEventListener('keydown', resumeAudio);

  let spawnInterval = 2000; // ms
  let lastSpawn = 0;
  let speedMultiplier = 1;
  let points = 0;
  let gameOver = false;

  function spawnAsteroid() {
    // Choose random edge
    const edge = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    const speedBase = 1.2 * speedMultiplier;
    if (edge === 0) { // top
      x = Math.random() * canvas.width;
      y = -20;
    } else if (edge === 1) { // right
      x = canvas.width + 20;
      y = Math.random() * canvas.height;
    } else if (edge === 2) { // bottom
      x = Math.random() * canvas.width;
      y = canvas.height + 20;
    } else { // left
      x = -20;
      y = Math.random() * canvas.height;
    }
    // direction towards centre
    const dx = center.x() - x;
    const dy = center.y() - y;
    const len = Math.hypot(dx, dy);
    vx = (dx / len) * speedBase;
    vy = (dy / len) * speedBase;
    // random size
    const size = Math.random() * 8 + 8;
    asteroids.push({ x, y, vx, vy, radius: size });
  }

  // Create particle explosion at (x,y). If fatal is true, particles linger longer.
  function createParticles(x, y, fatal = false) {
    const count = fatal ? 30 : 15;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2 + 0.5;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 2 + 1,
        alpha: 1,
        decay: fatal ? 0.015 : 0.03,
      });
    }
  }

  // Update particles position and fade them out.
  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dt * 0.03;
      p.y += p.vy * dt * 0.03;
      p.alpha -= p.decay * dt * 0.06;
      if (p.alpha <= 0) {
        particles.splice(i, 1);
      }
    }
  }

  function update(dt) {
    if (gameOver) {
      // continue particle explosion after game over
      updateParticles(dt);
      return;
    }
    // shield rotation via keys
    shieldAngle += shieldDir * rotateSpeed;
    shieldAngle = (shieldAngle + Math.PI * 2) % (Math.PI * 2);

    // spawn logic
    lastSpawn += dt;
    if (lastSpawn > spawnInterval) {
      spawnAsteroid();
      lastSpawn = 0;
      if (spawnInterval > 500) spawnInterval -= 30;
      speedMultiplier += 0.01;
    }

    // move asteroids and handle collisions
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx * dt * 0.06;
      a.y += a.vy * dt * 0.06;

      const dx = a.x - center.x();
      const dy = a.y - center.y();
      const dist = Math.hypot(dx, dy);

      if (dist <= shipRadius) {
        const angle = Math.atan2(dy, dx);
        const diff = Math.abs(((angle - shieldAngle + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
        if (diff <= shieldArc / 2) {
          points++;
          createParticles(a.x, a.y);
          playBlockSound();
          asteroids.splice(i, 1);
          continue;
        } else {
          gameOver = true;
          createParticles(a.x, a.y, true);
          playExplosionSound();
          playGameOverSound();
          break;
        }
      }
    }
    // update particles (fade/move)
    updateParticles(dt);
    // update stars twinkle
    updateStars(dt);
  }
// Update stars twinkle effect
function updateStars(dt) {
  for (let s of stars) {
    // small random jitter in radius to simulate twinkle
    s.radius += (Math.random() - 0.5) * 0.02;
    if (s.radius < 0.3) s.radius = 0.3;
    if (s.radius > 2) s.radius = 2;
  }
}

  function draw() {
    // clear background with radial space gradient
    const bgGrad = ctx.createRadialGradient(
      canvas.width / 2,
      canvas.height / 2,
      canvas.width * 0.1,
      canvas.width / 2,
      canvas.height / 2,
      Math.max(canvas.width, canvas.height) / 2
    );
    bgGrad.addColorStop(0, '#001a33');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // stars background
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // ship with gradient
    const grad = ctx.createRadialGradient(
      center.x(), center.y(), shipRadius * 0.2,
      center.x(), center.y(), shipRadius
    );
    grad.addColorStop(0, '#0f0');
    grad.addColorStop(1, '#050');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(center.x(), center.y(), shipRadius, 0, Math.PI * 2);
    ctx.fill();

    // shield (glowing arc)
    ctx.strokeStyle = '#0ff';
    ctx.lineWidth = 6;
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(
      center.x(),
      center.y(),
      shieldRadius,
      shieldAngle - shieldArc / 2,
      shieldAngle + shieldArc / 2
    );
    ctx.stroke();
    ctx.shadowBlur = 0; // reset

    // asteroids with gradient
    for (const a of asteroids) {
      const radGrad = ctx.createRadialGradient(
        a.x, a.y, a.radius * 0.3,
        a.x, a.y, a.radius
      );
      radGrad.addColorStop(0, '#f88');
      radGrad.addColorStop(1, '#822');
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // particles (explosions) with fading
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      ctx.fillStyle = `rgba(255, 200, 0, ${p.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // UI – score / game over
    ctx.fillStyle = '#fff';
    ctx.font = '20px monospace';
    ctx.fillText('Score: ' + points, 20, 30);
    if (gameOver) {
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  let lastTime = performance.now();
  function loop(now) {
    const dt = now - lastTime;
    lastTime = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
