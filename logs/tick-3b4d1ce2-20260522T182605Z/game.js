// Asteroid Dodge game for <canvas id="game"></canvas>
(() => {
  // generate starfield background
  const stars = Array.from({length: 200}, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 1.5 + 0.5
  }));
  const canvas = document.getElementById('game');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // unlock audio on first user interaction
  const unlockAudio = () => { audioCtx.resume(); window.removeEventListener('click', unlockAudio); };
  window.addEventListener('click', unlockAudio);
  function beep(freq, duration, volume = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Player ship
  const ship = { w: 40, h: 20, x: width / 2 - 20, y: height - 30, speed: 5 };

  // Asteroid pool
  const asteroids = [];
  let asteroidSpawnTimer = 0;
  let asteroidSpawnInterval = 1500; // ms
  let lastTime = 0;
  let score = 0;
  let gameOver = false;

  function spawnAsteroid() {
    const size = Math.random() * 30 + 10;
    const speed = Math.random() * 1.5 + 1 + score * 0.02; // accelerate over time
    asteroids.push({ x: Math.random() * (width - size), y: -size, size, speed });
  }

  function update(dt) {
    // Move ship based on keyboard
    if (keys['ArrowLeft']) ship.x = Math.max(0, ship.x - ship.speed);
    if (keys['ArrowRight']) ship.x = Math.min(width - ship.w, ship.x + ship.speed);

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed * dt;
      // collision
      if (
        a.x < ship.x + ship.w && a.x + a.size > ship.x &&
        a.y < ship.y + ship.h && a.y + a.size > ship.y
      ) {
          beep(200, 200, 0.2); // collision beep
          gameOver = true;
        }
        // off-screen
        if (a.y > height) {
          asteroids.splice(i, 1);
          if (!gameOver) { beep(800, 100, 0.1); score++; }
        }
    }

    // spawn logic
    asteroidSpawnTimer += dt;
    if (asteroidSpawnTimer > asteroidSpawnInterval) {
      spawnAsteroid();
      asteroidSpawnTimer = 0;
      // gradually increase spawn rate
      asteroidSpawnInterval = Math.max(300, asteroidSpawnInterval * 0.985);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // starfield background
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // ship (triangle)
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // asteroids with gradient
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(
        a.x + a.size / 2, a.y + a.size / 2, a.size * 0.1,
        a.x + a.size / 2, a.y + a.size / 2, a.size / 2);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.size / 2, a.y + a.size / 2, a.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`,
      10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = (timestamp - lastTime) / 16.666; // normalize to ~60fps units
    lastTime = timestamp;
    if (!gameOver) update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
