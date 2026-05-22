// Asteroid Dodger – minimal canvas game
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = (canvas.width = canvas.clientWidth || 800);
  const height = (canvas.height = canvas.clientHeight || 600);
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  function playCollision() {
    // low rumble
    playTone(100, 300);
    // higher ping
    setTimeout(() => playTone(300, 200), 150);
  }

  // Player ship
  const ship = { x: width / 2, y: height - 60, w: 40, h: 20, speed: 5 };

  // Asteroids pool
  const asteroids = [];
  const asteroidSpawnInterval = 1000; // ms
  let lastSpawn = 0;
  // Starfield particles
  const starCount = 100;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height, speed: Math.random() * 0.5 + 0.2 });
  }

  // Score
  let startTime = performance.now();
  let score = 0;

  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnAsteroid() {
    const size = Math.random() * 30 + 15;
    const x = Math.random() * (width - size);
    const y = -size;
    const speed = Math.random() * 2 + 1;
    asteroids.push({ x, y, size, speed });
  }

  function update(dt) {
    // Move ship
    if (keys.ArrowLeft || keys.a) ship.x -= ship.speed;
    if (keys.ArrowRight || keys.d) ship.x += ship.speed;
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));

    // Update stars (move downwards, wrap)
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.y += s.speed * dt * 0.05; // speed scaled by dt
      if (s.y > height) {
        s.y = -2;
        s.x = Math.random() * width;
      }
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      if (a.y - a.size > height) asteroids.splice(i, 1);
    }

    // Spawn new asteroids
    if (performance.now() - lastSpawn > asteroidSpawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }

    // Collision detection (simple AABB vs circle)
    for (const a of asteroids) {
      const dx = Math.max(ship.x, Math.min(a.x + a.size, ship.x + ship.w)) - Math.max(ship.x, Math.min(a.x, ship.x + ship.w));
      const dy = Math.max(ship.y, Math.min(a.y + a.size, ship.y + ship.h)) - Math.max(ship.y, Math.min(a.y, ship.y + ship.h));
      if (dx < 0 && dy < 0) {
        // collision – play sound then end
        playCollision();
        alert('Game Over! Score: ' + Math.floor(score));
        document.location.reload();
        return;
      }
    }

    // Update score
    score = (performance.now() - startTime) / 1000;
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // Gradient background (space)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // Moving starfield
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      ctx.fillStyle = '#fff';
      ctx.fillRect(s.x, s.y, 2, 2);
    }
    // Ship as triangle
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y);
    ctx.lineTo(ship.x + ship.w / 2, ship.y - ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y);
    ctx.closePath();
    ctx.fill();
    // Asteroids with radial gradient
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(
        a.x + a.size / 2,
        a.y + a.size / 2,
        a.size * 0.1,
        a.x + a.size / 2,
        a.y + a.size / 2,
        a.size / 2
      );
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.size / 2, a.y + a.size / 2, a.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 30);
  }

  let last = performance.now();
  function loop() {
    const now = performance.now();
    const dt = now - last;
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
