// Neon Escape game with enhanced graphics
// Targets <canvas id="game"></canvas> in the HTML.

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // Enable neon glow effect
  ctx.shadowColor = '#0ff';
  ctx.shadowBlur = 8;
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur, type = 'sine') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur / 1000);
    osc.stop(audioCtx.currentTime + dur / 1000);
  }
  function playThrust() { playTone(200, 80, 'square'); }
  function playCollision() { playTone(100, 300, 'sawtooth'); }
  function playPowerUp() { playTone(400, 120, 'triangle'); }
  function playGameOver() { playTone(50, 600, 'sine'); }

  const DEG = Math.PI / 180;

  // Ship definition
  const ship = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    r: 12,
    angle: 0,
    vx: 0,
    vy: 0,
    thrust: 0.2,
    rotateSpeed: 3 * DEG,
    trail: [], // recent positions for neon trail effect
    maxTrail: 15,
    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.strokeStyle = '#0ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-this.r, this.r);
      ctx.lineTo(0, -this.r * 1.5);
      ctx.lineTo(this.r, this.r);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    },
    update() {
      // record trail before moving
      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > this.maxTrail) this.trail.shift();
      this.x += this.vx;
      this.y += this.vy;
      // wrap around edges
      if (this.x < 0) this.x += canvas.width;
      if (this.x > canvas.width) this.x -= canvas.width;
      if (this.y < 0) this.y += canvas.height;
      if (this.y > canvas.height) this.y -= canvas.height;
    },
  };

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    // Resume audio context on first interaction (required by browsers)
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.key] = true;
    if (e.key === 'ArrowUp') playThrust();
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function handleInput() {
    if (keys['ArrowLeft']) ship.angle -= ship.rotateSpeed;
    if (keys['ArrowRight']) ship.angle += ship.rotateSpeed;
    if (keys['ArrowUp']) {
      ship.vx += Math.cos(ship.angle) * ship.thrust;
      ship.vy += Math.sin(ship.angle) * ship.thrust;
    }
  }

  // Asteroid handling
  const asteroids = [];
  function spawnAsteroid() {
    const size = Math.random() * 20 + 15;
    const a = Math.random() * Math.PI * 2;
    const speed = Math.random() * 1.5 + 0.5;
    asteroids.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: size,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
    });
  }
  setInterval(spawnAsteroid, 1500);

  // Power‑up handling (simple shield)
  const powerUps = [];
  function spawnPowerUp() {
    powerUps.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: 10,
      type: 'shield',
      ttl: 8000, // milliseconds
    });
  }
  setInterval(spawnPowerUp, 10000);

  let shield = false;
  let shieldTimer = 0;
  let score = 0;
  let gameOver = false;

  function detectCollisions() {
    // ship vs asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      const dx = ship.x - a.x;
      const dy = ship.y - a.y;
      const dist = Math.hypot(dx, dy);
      if (dist < ship.r + a.r) {
        if (shield) {
          // destroy asteroid, consume shield
          shield = false;
          asteroids.splice(i, 1);
        } else {
          gameOver = true;
          playCollision();
          playGameOver();
        }
        return;
      }
    }
    // ship vs power‑ups
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const p = powerUps[i];
      const dx = ship.x - p.x;
      const dy = ship.y - p.y;
      if (Math.hypot(dx, dy) < ship.r + p.r) {
        if (p.type === 'shield') {
          shield = true;
          shieldTimer = Date.now() + 5000; // 5 s shield
          playPowerUp();
        }
        powerUps.splice(i, 1);
      }
    }
  }

  function updatePowerUps(dt) {
    const now = Date.now();
    for (let i = powerUps.length - 1; i >= 0; i--) {
      if (now > powerUps[i].ttl) powerUps.splice(i, 1);
    }
    if (shield && now > shieldTimer) shield = false;
  }

  function updateAsteroids() {
    for (const a of asteroids) {
      a.x += a.vx;
      a.y += a.vy;
      if (a.x < 0) a.x += canvas.width;
      if (a.x > canvas.width) a.x -= canvas.width;
      if (a.y < 0) a.y += canvas.height;
      if (a.y > canvas.height) a.y -= canvas.height;
    }
  }

  function draw() {
    // Neon background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#003');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Ship trail (fading neon)
    if (ship.trail) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < ship.trail.length; i++) {
        const pt = ship.trail[i];
        const alpha = (i + 1) / ship.trail.length * 0.6;
        ctx.fillStyle = `rgba(0,255,255,${alpha})`;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, ship.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // shield visual
    if (shield) {
      ctx.strokeStyle = 'rgba(0,255,255,0.3)';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(ship.x, ship.y, ship.r + 6, 0, Math.PI * 2);
      ctx.stroke();
    }

    ship.draw();

    // Neon asteroids with subtle glow
    ctx.save();
    ctx.shadowColor = '#f0f';
    ctx.shadowBlur = 12;
    for (const a of asteroids) {
      ctx.fillStyle = '#f0f';
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Neon power‑ups (shields)
    ctx.fillStyle = '#0ff';
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 10;
    for (const p of powerUps) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Reset shadow for other elements
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
    if (shield) ctx.fillText('Shield!', 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '48px monospace';
      ctx.fillText('GAME OVER', canvas.width / 2 - 140, canvas.height / 2);
    }
  }

  let last = performance.now();
  function loop(now) {
    const dt = now - last;
    last = now;
    if (!gameOver) {
      handleInput();
      ship.update();
      updateAsteroids();
      updatePowerUps(dt);
      detectCollisions();
      score += dt * 0.01;
    }
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
