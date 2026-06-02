// Canvas Survival Game – Improved Graphics
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth;
  const height = canvas.height = canvas.offsetHeight;
  // Generate starfield background
  const stars = [];
  for (let i = 0; i < 200; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }

  // Ship state
  const ship = { x: width / 2, y: height / 2, angle: 0, vx: 0, vy: 0, radius: 10 };
  const thrust = 0.1; // acceleration per frame
  const turnSpeed = 0.05; // radians per frame

  // Input handling
  const keys = {};
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
    osc.stop(audioCtx.currentTime + duration);
  }
  function playThrust() { playTone(300, 0.07); }
  function playExplosion() {
    // noise burst
    const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.2, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
    }
    const noise = audioCtx.createBufferSource();
    const gain = audioCtx.createGain();
    noise.buffer = buffer;
    noise.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    noise.start();
    noise.stop(audioCtx.currentTime + 0.2);
  }
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp') playThrust();
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // Asteroids
  const asteroids = [];
  const asteroidSpawnInterval = 2000; // ms
  let lastSpawn = 0;
  const maxAsteroids = 20;

  // Score
  let startTime = null;
  let score = 0;
  let gameOver = false;

  function spawnAsteroid() {
    const radius = 15 + Math.random() * 15;
    const edge = Math.floor(Math.random() * 4);
    // spawn on a random edge
    let x, y, vx, vy;
    switch (edge) {
      case 0: // top
        x = Math.random() * width; y = -radius; vx = (Math.random() - 0.5) * 2; vy = Math.random() * 2 + 1; break;
      case 1: // right
        x = width + radius; y = Math.random() * height; vx = -Math.random() * 2 - 1; vy = (Math.random() - 0.5) * 2; break;
      case 2: // bottom
        x = Math.random() * width; y = height + radius; vx = (Math.random() - 0.5) * 2; vy = -Math.random() * 2 - 1; break;
      case 3: // left
        x = -radius; y = Math.random() * height; vx = Math.random() * 2 + 1; vy = (Math.random() - 0.5) * 2; break;
    }
    asteroids.push({ x, y, vx, vy, radius });
  }

  function update(dt) {
    // Ship controls
    if (keys.ArrowLeft) ship.angle -= turnSpeed;
    if (keys.ArrowRight) ship.angle += turnSpeed;
    if (keys.ArrowUp) {
      ship.vx += Math.cos(ship.angle) * thrust;
      ship.vy += Math.sin(ship.angle) * thrust;
    }
    // Apply velocity
    ship.x += ship.vx;
    ship.y += ship.vy;
    // Simple friction
    ship.vx *= 0.99;
    ship.vy *= 0.99;
    // Keep ship inside arena (wrap)
    if (ship.x < 0) ship.x += width;
    if (ship.x > width) ship.x -= width;
    if (ship.y < 0) ship.y += height;
    if (ship.y > height) ship.y -= height;

    // Asteroids movement
    asteroids.forEach(a => {
      a.x += a.vx;
      a.y += a.vy;
      // wrap
      if (a.x < -a.radius) a.x = width + a.radius;
      if (a.x > width + a.radius) a.x = -a.radius;
      if (a.y < -a.radius) a.y = height + a.radius;
      if (a.y > height + a.radius) a.y = -a.radius;
    });

    // Spawn asteroids
    if (Date.now() - lastSpawn > asteroidSpawnInterval && asteroids.length < maxAsteroids) {
      spawnAsteroid();
      lastSpawn = Date.now();
    }

    // Collision detection
    for (const a of asteroids) {
      const dx = ship.x - a.x;
      const dy = ship.y - a.y;
      const dist = Math.hypot(dx, dy);
      if (dist < ship.radius + a.radius) {
        gameOver = true;
        playExplosion();
        break;
      }
    }

    // Score
    if (!gameOver && startTime !== null) {
      score = (Date.now() - startTime) / 1000; // seconds
    }
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#000020');
    bgGrad.addColorStop(1, '#000000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Starfield
    ctx.fillStyle = 'white';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Ship (triangle with gradient & glow)
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    // Glow effect
    ctx.shadowColor = '#88ccff';
    ctx.shadowBlur = 8;
    const shipGrad = ctx.createLinearGradient(-15, 0, 15, 0);
    shipGrad.addColorStop(0, '#66aaff');
    shipGrad.addColorStop(1, '#0044bb');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(-10, -8);
    ctx.lineTo(-10, 8);
    ctx.closePath();
    ctx.fill();
    ctx.shadowColor = 'transparent'; // disable shadow for stroke
    ctx.strokeStyle = '#001144';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // Asteroids (gray with slight outline)
    ctx.fillStyle = '#888888';
    ctx.strokeStyle = '#555555';
    ctx.lineWidth = 1.5;
    asteroids.forEach(a => {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    // Score
    ctx.fillStyle = 'lime';
    ctx.font = '16px monospace';
    ctx.fillText(`Score: ${score.toFixed(1)}s`, 10, 20);

    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '32px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop(timestamp) {
    if (!startTime) startTime = Date.now();
    const dt = timestamp - (lastTime || timestamp);
    lastTime = timestamp;
    if (!gameOver) update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  let lastTime = null;
  requestAnimationFrame(loop);
})();
