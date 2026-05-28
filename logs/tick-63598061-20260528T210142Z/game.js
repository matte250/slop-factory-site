// Space Junk Dodger – enhanced graphics
// Targets <canvas id="game"> defined elsewhere.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Starfield background
  const stars = [];
  const starCount = Math.floor((width * height) / 8000);
  for (let i = 0; i < starCount; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height, twinkle: Math.random() * 0.5 });
  }

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain).connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  // Ambient low hum
  const ambientOsc = audioCtx.createOscillator();
  const ambientGain = audioCtx.createGain();
  ambientOsc.frequency.value = 30;
  ambientGain.gain.value = 0.02;
  ambientOsc.connect(ambientGain).connect(audioCtx.destination);
  ambientOsc.start();

  // Ship definition
  const ship = {
    x: width / 2,
    y: height - 60,
    size: 20,
    speed: 4,
    dx: 0,
    dy: 0,
  };

  // Asteroid list
  const asteroids = [];
  const asteroidSpawnRate = 1000; // ms
  const asteroidSpeed = 2;
  let lastSpawn = 0;
  let gameOver = false;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; audioCtx.resume(); });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function update(dt) {
    if (gameOver) return;
    // Move ship based on arrow keys
    ship.dx = 0; ship.dy = 0;
    if (keys['ArrowLeft']) ship.dx = -ship.speed;
    if (keys['ArrowRight']) ship.dx = ship.speed;
    if (keys['ArrowUp']) ship.dy = -ship.speed;
    if (keys['ArrowDown']) ship.dy = ship.speed;
    ship.x = Math.max(ship.size, Math.min(width - ship.size, ship.x + ship.dx));
    ship.y = Math.max(ship.size, Math.min(height - ship.size, ship.y + ship.dy));

    // Update starfield (slow scroll & twinkle)
    const starSpeed = 0.5;
    for (const s of stars) {
      s.y += starSpeed;
      if (s.y > height) s.y -= height;
      // twinkle by tiny random offset
      s.twinkle = Math.random() * 0.5;
    }

    // Spawn asteroids
    if (Date.now() - lastSpawn > asteroidSpawnRate) {
      lastSpawn = Date.now();
      const radius = 15 + Math.random() * 20;
      const x = radius + Math.random() * (width - 2 * radius);
      const angle = Math.random() * Math.PI * 2;
    const rotSpeed = (Math.random() - 0.5) * 0.02; // radians per frame
      asteroids.push({ x, y: -radius, radius, speed: asteroidSpeed + Math.random(), angle, rotSpeed });
      // Play a subtle beep for new asteroid
      playBeep(200, 0.05);
    }


    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // Remove if off-screen
      if (a.y - a.radius > height) asteroids.splice(i, 1);
    }

    // Collision detection (simple circle vs point approximation)
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.radius + ship.size / 2) {
        gameOver = true;
        // Play collision sound (low pitch)
        playBeep(100, 0.3);
        break;
      }
    }
  }

  function draw() {
    // Clear with slight opacity for motion trails
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, width, height);

    // Draw starfield with twinkle
    for (const s of stars) {
      ctx.fillStyle = `rgba(255,255,255,${0.5 + s.twinkle})`;
      ctx.fillRect(s.x, s.y, 1, 1);
    }

    // Ship with gradient and glow
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 10;
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y - ship.size, ship.x, ship.y + ship.size);
    shipGrad.addColorStop(0, '#00ffff');
    shipGrad.addColorStop(1, '#0066ff');
    ctx.fillStyle = shipGrad;
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y - ship.size, ship.x, ship.y + ship.size);
    shipGrad.addColorStop(0, '#00ffff');
    shipGrad.addColorStop(1, '#0066ff');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.size);
    ctx.lineTo(ship.x - ship.size / 2, ship.y + ship.size / 2);
    ctx.lineTo(ship.x + ship.size / 2, ship.y + ship.size / 2);
    ctx.closePath();
    ctx.fill();

    // Asteroids with radial gradient and rotation
    for (const a of asteroids) {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.angle);
      const grad = ctx.createRadialGradient(0, 0, a.radius * 0.2, 0, 0, a.radius);
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#222');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, a.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  let lastTime = 0;
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
