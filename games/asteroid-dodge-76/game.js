// Asteroid Dodge game
// Targets <canvas id="game"></canvas>
(() => {
  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq, duration) {
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

  const canvas = document.getElementById('game');
  if (!canvas) { console.error('Canvas #game not found'); return; }
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Ship properties
  const ship = {
    w: 40,
    h: 20,
    x: width / 2 - 20,
    y: height - 30,
    speed: 5,
    color: '#0f0'
  };

  // Asteroid properties
  const asteroids = [];
  // Starfield properties
  const stars = [];
  const starCount = 100;
  function initStars() {
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.5 + 0.5
      });
    }
  }
  initStars();
  let asteroidSpawnInterval = 1500; // ms
  let lastSpawn = 0;
  let speedIncrease = 0.02; // per second
  let baseSpeed = 1.5;

  let keys = {};
  let gameOver = false;
  let startTime = performance.now();
  const maxTime = 60000; // 60s

  function spawnAsteroid() {
    // Play a subtle spawn sound
    beep(300, 0.05);
    const radius = 10 + Math.random() * 15;
    const x = Math.random() * (width - radius * 2) + radius;
    asteroids.push({ x, y: -radius, r: radius, speed: baseSpeed + Math.random() });
  }

  function update(dt) {
    if (gameOver) return;
    // Move ship
    if (keys.ArrowLeft || keys.a) { ship.x -= ship.speed; beep(200,0.03); }
    if (keys.ArrowRight || keys.d) { ship.x += ship.speed; beep(200,0.03); }
    if (keys.ArrowRight || keys.d) ship.x += ship.speed;
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));

    // Spawn asteroids
    if (performance.now() - lastSpawn > asteroidSpawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
      // gradually increase spawn rate
      asteroidSpawnInterval = Math.max(300, asteroidSpawnInterval - 20);
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed * dt * 0.06; // scale speed
      // Collision detection (simple AABB vs circle)
      const shipRect = { x: ship.x, y: ship.y, w: ship.w, h: ship.h };
      const distX = Math.abs(a.x - (shipRect.x + shipRect.w / 2));
      const distY = Math.abs(a.y - (shipRect.y + shipRect.h / 2));
      if (distX > (shipRect.w / 2 + a.r) || distY > (shipRect.h / 2 + a.r)) {
        // no collision
      } else if (distX <= shipRect.w / 2 || distY <= shipRect.h / 2) {
          beep(500,0.2);
          gameOver = true;
      } else {
        const dx = distX - shipRect.w / 2;
        const dy = distY - shipRect.h / 2;
        if (dx * dx + dy * dy <= a.r * a.r) gameOver = true;
      }
      // Remove off-screen
      if (a.y - a.r > height) asteroids.splice(i, 1);
    }

    // Increase asteroid speed over time
    const elapsed = (performance.now() - startTime) / 1000;
    baseSpeed += speedIncrease * dt * 0.001;

    // End after timer
    if (performance.now() - startTime > maxTime) gameOver = true;
  }

  function draw() {
    // Background with moving starfield
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      // slight downward drift to simulate motion
      s.y += 0.3;
      if (s.y > height) { s.y = 0; s.x = Math.random() * width; }
    }
    // Ship as triangle with gradient
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x, ship.y + ship.h);
    shipGrad.addColorStop(0, '#0f0');
    shipGrad.addColorStop(1, '#070');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // Asteroids with radial gradient
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop(timestamp) {
    const dt = timestamp - (loop.last || timestamp);
    loop.last = timestamp;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Input handling
  // Ensure audio context is running after first user interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  window.addEventListener('click', resumeAudio);
  window.addEventListener('keydown', e => { keys[e.key] = true; resumeAudio(); });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  requestAnimationFrame(loop);
})();
