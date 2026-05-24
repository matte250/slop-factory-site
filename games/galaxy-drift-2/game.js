// Simple top‑down space game (Galaxy Drift)
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Resume audio on first user interaction
  const resumeAudio = () => { audioCtx.resume(); window.removeEventListener('click', resumeAudio); };
  window.addEventListener('click', resumeAudio);

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
  function playThrust() { playTone(400, 0.08); }
  function playCollision() { playTone(100, 0.4); }

  // Background stars
  const STAR_COUNT = 100;
  const stars = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }


  // Ship state
  const ship = {
    x: width / 2,
    y: height / 2,
    vx: 0,
    vy: 0,
    angle: 0, // radians, not used for movement but for drawing
    radius: 10,
    thrust: 0.1,
    rotateSpeed: 0.05,
  };

  // Asteroid state
  const asteroids = [];
  const ASTEROID_COUNT = 5;
  const ASTEROID_SPEED = 1.5;

  function spawnAsteroids() {
    // Initialize asteroids with random position, velocity, and rotation
    for (let i = 0; i < ASTEROID_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = ASTEROID_SPEED * (0.5 + Math.random());
      asteroids.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 15 + Math.random() * 10,
        angle: Math.random() * Math.PI * 2,
        angularVelocity: (Math.random() - 0.5) * 0.02,
      });
    }
    // Remove original loop later

  }

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  let gameOver = false;

  function update() {
    // Update stars (twinkling)
    for (const s of stars) {
      s.radius = 0.5 + Math.random() * 1.5;
    }
    if (gameOver) return;

    // Ship controls (WASD or Arrow keys)
    if (keys['ArrowUp'] || keys['w']) {
      ship.vx += Math.cos(ship.angle) * ship.thrust;
      ship.vy += Math.sin(ship.angle) * ship.thrust;
      playThrust();
    }
    if (keys['ArrowDown'] || keys['s']) {
      ship.vx -= Math.cos(ship.angle) * ship.thrust;
      ship.vy -= Math.sin(ship.angle) * ship.thrust;
    }
    if (keys['ArrowLeft'] || keys['a']) {
      ship.angle -= ship.rotateSpeed;
    }
    if (keys['ArrowRight'] || keys['d']) {
      ship.angle += ship.rotateSpeed;
    }

    // Update ship position
    ship.x += ship.vx;
    ship.y += ship.vy;

    // Update asteroids (position and rotation)
    for (const a of asteroids) {
      a.x += a.vx;
      a.y += a.vy;
      a.angle += a.angularVelocity;
      // wrap asteroids
      if (a.x < 0) a.x += width;
      if (a.x > width) a.x -= width;
      if (a.y < 0) a.y += height;
      if (a.y > height) a.y -= height;
    }

    // Collision detection
    for (const a of asteroids) {
      const dx = ship.x - a.x;
      const dy = ship.y - a.y;
      const dist = Math.hypot(dx, dy);
if (dist < ship.radius + a.radius) {
          gameOver = true;
          playCollision();
        }
    }

    // Off‑canvas check
    if (ship.x < 0 || ship.x > width || ship.y < 0 || ship.y > height) {
      gameOver = true;
    }
  }

  function draw() {
    // Space background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#000020');
    bgGrad.addColorStop(1, '#000010');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Slight motion blur overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, width, height);

    // Draw background stars
    ctx.fillStyle = 'white';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw ship (triangle) with cyan fill and white outline
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.beginPath();
    ctx.moveTo(ship.radius, 0);
    ctx.lineTo(-ship.radius, ship.radius / 2);
    ctx.lineTo(-ship.radius, -ship.radius / 2);
    ctx.closePath();
    ctx.fillStyle = 'cyan';
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // Draw rotating asteroids with gradient
    for (const a of asteroids) {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.angle);
      const grad = ctx.createRadialGradient(0, 0, a.radius * 0.2, 0, 0, a.radius);
      grad.addColorStop(0, '#888');
      grad.addColorStop(1, '#333');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, a.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = 'red';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  spawnAsteroids();
  requestAnimationFrame(loop);
})();
