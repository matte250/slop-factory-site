// Minimal Nebula Escape game
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');

  // Set canvas dimensions to its displayed size
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  const { width, height } = canvas;

  // Ship definition
  const ship = {
    x: width / 2,
    y: height - 40,
    radius: 12,
    speed: 4,
    color: 'cyan',
  };

  // Asteroid pool
  const asteroids = [];
  const asteroidSpawnInterval = 1000; // ms
  let lastAsteroidTime = 0;

  // Star field
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.5,
      speed: Math.random() * 0.5 + 0.2,
    });
  }

  // Input handling
  const keys = { ArrowLeft: false, ArrowRight: false };
  // Audio setup
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioCtx();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playMoveSound() { playTone(400, 0.05); }
  function playCrashSound() { playTone(150, 0.5); }
  window.addEventListener('keydown', e => {
    if (e.key in keys) {
      keys[e.key] = true;
      playMoveSound();
    }
  });
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  let gameOver = false;

  function update(dt) {
    // Move ship
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    // Keep within bounds (off-screen loses)
    if (ship.x < 0 || ship.x > width) { gameOver = true; playCrashSound(); }

    // Update stars
    for (const s of stars) {
      s.y += s.speed;
      if (s.y > height) { s.y = 0; s.x = Math.random() * width; }
    }

    // Spawn asteroids
    if (!gameOver && Date.now() - lastAsteroidTime > asteroidSpawnInterval) {
      const size = Math.random() * 20 + 10;
      asteroids.push({
        x: Math.random() * (width - size),
        y: -size,
        size,
        speed: Math.random() * 2 + 1,
        color: 'gray',
      });
      lastAsteroidTime = Date.now();
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      if (a.y - a.size > height) asteroids.splice(i, 1);
      // Collision detection (circle-rectangle)
      const dx = Math.abs(ship.x - (a.x + a.size / 2));
      const dy = Math.abs(ship.y - (a.y + a.size / 2));
      if (dx <= a.size / 2 + ship.radius && dy <= a.size / 2 + ship.radius) {
        gameOver = true;
        playCrashSound();
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#00102a');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // Stars with subtle color variation
    for (const s of stars) {
      const hue = Math.floor(200 + Math.random() * 60);
      ctx.fillStyle = `hsl(${hue}, 80%, 80%)`;
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }
    // Ship (gradient triangle) with subtle glow
    const shipGrad = ctx.createLinearGradient(0, ship.y, 0, ship.y + ship.radius * 2);
    shipGrad.addColorStop(0, '#00ffff');
    shipGrad.addColorStop(1, '#0066ff');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y);
    ctx.lineTo(ship.x - ship.radius, ship.y + ship.radius * 1.5);
    ctx.lineTo(ship.x + ship.radius, ship.y + ship.radius * 1.5);
    ctx.closePath();
    ctx.fill();
    // subtle glow
    ctx.shadowColor = 'rgba(0,255,255,0.5)';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;
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
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#222');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.size / 2, a.y + a.size / 2, a.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = 'red';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  let lastTime = 0;
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
