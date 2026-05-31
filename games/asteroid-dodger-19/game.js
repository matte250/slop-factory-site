// Asteroid Dodger – minimal implementation targeting <canvas id="game"></canvas>
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  // Background hum
  setInterval(() => playBeep(60, 0.2), 5000);

  // Game state
  // Starfield for background
  const stars = Array.from({ length: 100 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    r: Math.random() * 2 + 1
  }));

  const ship = { x: width / 2, y: height - 60, w: 30, h: 40, speed: 5 };
  const asteroids = [];
  const particles = [];
  let health = 3;
  let score = 0;
  let lastAsteroid = 0;
  let gameOver = false;

  // Input handling
  const keys = { ArrowLeft: false, ArrowRight: false };
  // Resume audio context on first user interaction
  window.addEventListener('click', () => audioCtx.resume());
  window.addEventListener('keydown', e => { if (e.key in keys) keys[e.key] = true; });
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  function spawnAsteroid() {
    const size = 20 + Math.random() * 30;
    const x = Math.random() * (width - size);
    const speed = 2 + Math.random() * 3;
    asteroids.push({ x, y: -size, size, speed });
  }

  function update(dt) {
    // Move ship
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));

    // Move stars to create scrolling background
    stars.forEach(s => {
      s.y += 0.5; // slow downward motion
      if (s.y > height) {
        s.y = 0;
        s.x = Math.random() * width;
      }
    });

    // Spawn asteroids
    if (performance.now() - lastAsteroid > 800) { // every 0.8s
      spawnAsteroid();
      lastAsteroid = performance.now();
    }

    // Update asteroids and handle collisions
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // Collision check (simple AABB)
      if (
        a.x < ship.x + ship.w && a.x + a.size > ship.x &&
        a.y < ship.y + ship.h && a.y + a.size > ship.y
      ) {
        // create explosion particles
        for (let p = 0; p < 15; p++) {
          particles.push({
            x: a.x + a.size / 2,
            y: a.y + a.size / 2,
            life: Math.random() * 0.5 + 0.5
          });
        }
        asteroids.splice(i, 1);
        playBeep(150, 0.1);
        health--;
        if (health <= 0) { gameOver = true; playBeep(200, 0.3); }
        continue;
      }
      // Remove off‑screen
      if (a.y > height) asteroids.splice(i, 1);
    }

    // Update particles (fade out)
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt / 1000; // decay per second
      if (p.life <= 0) particles.splice(i, 1);
    }

    // Score based on time survived
    score = Math.floor(performance.now() / 100);
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    // Starfield background
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#555';
    stars.forEach(s => ctx.beginPath() || ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2) && ctx.fill());

    // Ship (triangle)
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y);
    ctx.lineTo(ship.x - ship.w / 2, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();

    // Asteroids with radial gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x + a.size / 2, a.y + a.size / 2, a.size * 0.2, a.x + a.size / 2, a.y + a.size / 2, a.size / 2);
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#444');
      ctx.fillStyle = grad;
      ctx.fillRect(a.x, a.y, a.size, a.size);
    });

    // Particles (explosions)
    particles.forEach(p => {
      ctx.fillStyle = `rgba(255,165,0,${p.life})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Health: ${health}`, 10, 20);
    ctx.fillText(`Score: ${score}`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  let last = 0;
  function loop(timestamp) {
    const dt = timestamp - last;
    last = timestamp;
    if (!gameOver) update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
