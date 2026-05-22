// Asteroid Dodge game
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas element #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
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

  // Player ship
  const ship = {
    width: 40,
    height: 20,
    x: width / 2 - 20,
    y: height - 30,
    speed: 5,
  };

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    // Resume AudioContext on first user interaction (browser policy)
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.key] = true;
    if (['ArrowLeft','ArrowRight','a','d'].includes(e.key)) playTone(300,0.05);
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // Asteroids
  const asteroids = [];
  const spawnInterval = 1000; // ms
  let lastSpawn = 0;

  // Starfield for background
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 1,
      speed: 0.5 + Math.random() * 0.5,
    });
  }

  let score = 0;
  let startTime = performance.now();
  let gameOver = false;

  function spawnAsteroid() {
    const size = 20 + Math.random() * 30; // 20-50
    const x = Math.random() * (width - size);
    const speed = 2 + Math.random() * 3; // 2-5
    const angle = Math.random() * Math.PI * 2;
    const angularSpeed = (Math.random() - 0.5) * 0.02; // rotate slowly
    asteroids.push({ x, y: -size, size, speed, angle, angularSpeed });
    // Play a short high‑pitched tone for spawn
    playTone(400, 0.05);
  }

  function update(dt) {
    // Move ship
    if (keys['ArrowLeft'] || keys['a']) ship.x -= ship.speed;
    if (keys['ArrowRight'] || keys['d']) ship.x += ship.speed;
    ship.x = Math.max(0, Math.min(width - ship.width, ship.x));

    // Spawn asteroids
    if (performance.now() - lastSpawn > spawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }

    // Update stars (background)
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.y += s.speed;
      if (s.y > height) {
        s.y = 0;
        s.x = Math.random() * width;
      }
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      a.angle += a.angularSpeed;
      // Remove off‑screen
      if (a.y > height) asteroids.splice(i, 1);
    }

    // Collision detection (simple AABB)
    for (const a of asteroids) {
      if (
        ship.x < a.x + a.size &&
        ship.x + ship.width > a.x &&
        ship.y < a.y + a.size &&
        ship.y + ship.height > a.y
      ) {
        gameOver = true;
        break;
      }
    }

    // Update score
    score = Math.floor((performance.now() - startTime) / 1000);
  }

function draw() {
    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#001');
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Starfield
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ship (drawn as triangle)
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.height);
    ctx.lineTo(ship.x + ship.width / 2, ship.y);
    ctx.lineTo(ship.x + ship.width, ship.y + ship.height);
    ctx.closePath();
    ctx.fill();

    // Asteroids with rotation and shading
    for (const a of asteroids) {
      ctx.save();
      const cx = a.x + a.size / 2;
      const cy = a.y + a.size / 2;
      ctx.translate(cx, cy);
      ctx.rotate(a.angle);
      // radial gradient for a rocky look
      const radGrad = ctx.createRadialGradient(0, 0, a.size * 0.2, 0, 0, a.size / 2);
      radGrad.addColorStop(0, '#777');
      radGrad.addColorStop(1, '#333');
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(0, 0, a.size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 10, 20);

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.font = '32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.font = '32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop(timestamp) {
    if (gameOver) return;
    const dt = timestamp - (lastFrame || timestamp);
    lastFrame = timestamp;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  let lastFrame = 0;
  requestAnimationFrame(loop);
})();
