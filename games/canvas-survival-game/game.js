// Simple canvas survival game with improved graphics

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  // Starfield background
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
      twinkle: Math.random() * 1000,
    });
  }
  function drawStars() {
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      const alpha = 0.5 + 0.5 * Math.sin((performance.now() - s.twinkle) / 500);
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let boostOsc = null;
  function playBoost() {
    if (boostOsc) return;
    boostOsc = audioCtx.createOscillator();
    boostOsc.type = 'sawtooth';
    boostOsc.frequency.setValueAtTime(300, audioCtx.currentTime);
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    boostOsc.connect(gain).connect(audioCtx.destination);
    boostOsc.start();
  }
  function stopBoost() {
    if (!boostOsc) return;
    boostOsc.stop();
    boostOsc.disconnect();
    boostOsc = null;
  }
  function playCrash() {
    const osc = audioCtx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(100, audioCtx.currentTime);
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.4);
  }

  // Ship definition
  const ship = {
    x: width / 2,
    y: height - 40,
    w: 30,
    h: 30,
    speed: 3,
    boost: 6,
    moving: 0, // -1 left, 1 right, 0 idle
    boostActive: false,
    draw() {
      // Draw ship as a triangle
      ctx.fillStyle = '#0ff';
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - this.h / 2); // tip
      ctx.lineTo(this.x - this.w / 2, this.y + this.h / 2); // left base
      ctx.lineTo(this.x + this.w / 2, this.y + this.h / 2); // right base
      ctx.closePath();
      ctx.fill();
    },
    update() {
      const s = this.boostActive ? this.boost : this.speed;
      this.x += this.moving * s;
      if (this.x < this.w / 2) this.x = this.w / 2;
      if (this.x > width - this.w / 2) this.x = width - this.w / 2;
    },
  };

  // Asteroid pool
  const asteroids = [];
  const asteroidSpawnInterval = 1000; // ms
  const asteroidMaxSpeed = 3;
  let lastSpawn = 0;

  function spawnAsteroid() {
    const radius = 10 + Math.random() * 15;
    const x = radius + Math.random() * (width - 2 * radius);
    const speed = 1 + Math.random() * asteroidMaxSpeed;
    asteroids.push({ x, y: -radius, r: radius, speed });
  }

  function updateAsteroids(dt) {
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed * (dt / 16);
      if (a.y - a.r > height) asteroids.splice(i, 1);
    }
    if (performance.now() - lastSpawn > asteroidSpawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }
  }

  function drawAsteroids() {
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#ff8');
      grad.addColorStop(1, '#b00');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function checkCollision() {
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      const shipRadius = Math.hypot(ship.w, ship.h) / 2;
      if (dist < a.r + shipRadius) return true;
    }
    return false;
  }

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
    if (e.key === ' ') keys.boost = true;
    updateDirection();
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
    if (e.key === ' ') keys.boost = false;
    updateDirection();
  });

  function updateDirection() {
    ship.moving = keys.left ? -1 : keys.right ? 1 : 0;
    const wasBoost = ship.boostActive;
    ship.boostActive = !!keys.boost;
    // Ensure AudioContext is resumed on user interaction
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    if (ship.boostActive && !wasBoost) {
      playBoost();
    } else if (!ship.boostActive && wasBoost) {
      stopBoost();
    }
  }

  // Game loop
  let score = 0;
  let lastTime = performance.now();
  let gameOver = false;

  function loop(now) {
    const dt = now - lastTime;
    lastTime = now;
    // Draw background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    drawStars();

    ship.update();
    ship.draw();
    updateAsteroids(dt);
    drawAsteroids();

    if (checkCollision()) {
      // Play crash sound once
      if (!gameOver) playCrash();
      gameOver = true;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
      ctx.fillText(`Score: ${Math.floor(score)}`, width / 2, height / 2 + 30);
      return;
    }

    score += dt * 0.01; // distance based score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${Math.floor(score)}`, 10, 20);

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
