// Simple Asteroid Evader game
// Canvas with id "game" must exist in the HTML

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;
  // Background gradient for space
  const backgroundGrad = (() => {
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#000020');
    grad.addColorStop(1, '#000040');
    return grad;
  })();

  // Simple sound utilities using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.stop(audioCtx.currentTime + dur);
  }
  function playThrust() { playTone(400, 0.08); }
  function playExplosion() { playTone(100, 0.4); }

  const height = canvas.height = canvas.clientHeight || 600;

  // Ship definition with gradient and thrust flame
    const ship = {
    isThrusting: false,
    isThrusting: false,
    x: width / 2,
    y: height / 2,
    vx: 0,
    vy: 0,
    angle: 0, // radians
    radius: 12,
    thrust: 0.1,
    rotateSpeed: 0.07,
    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      // Ship body gradient
      const grad = ctx.createRadialGradient(0, 0, this.radius * 0.2, 0, 0, this.radius);
      grad.addColorStop(0, '#6f6');
      grad.addColorStop(1, '#0a0');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, -this.radius);
      ctx.lineTo(this.radius, this.radius);
      ctx.lineTo(-this.radius, this.radius);
      ctx.closePath();
      ctx.fill();
      // Thrust flame when accelerating
      if (this.isThrusting) {
        ctx.fillStyle = 'orange';
        ctx.beginPath();
        ctx.moveTo(0, this.radius);
        ctx.lineTo(this.radius * 0.5, this.radius + 10);
        ctx.lineTo(-this.radius * 0.5, this.radius + 10);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    },
    update() {
      this.x += this.vx;
      this.y += this.vy;
      // screen wrap
      if (this.x < 0) this.x += width;
      if (this.x > width) this.x -= width;
      if (this.y < 0) this.y += height;
      if (this.y > height) this.y -= height;
    }
  };

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.code] = true; });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  // Asteroid definition
  const asteroids = [];
  const asteroidConfig = {
    minRadius: 15,
    maxRadius: 30,
    minSpeed: 0.5,
    maxSpeed: 2.0,
    spawnInterval: 2000 // ms
  };

  function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
  }

  function spawnAsteroid() {
    const radius = randomBetween(asteroidConfig.minRadius, asteroidConfig.maxRadius);
    // Choose a random edge
    const edge = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    switch (edge) {
      case 0: // top
        x = randomBetween(0, width);
        y = -radius;
        break;
      case 1: // right
        x = width + radius;
        y = randomBetween(0, height);
        break;
      case 2: // bottom
        x = randomBetween(0, width);
        y = height + radius;
        break;
      case 3: // left
        x = -radius;
        y = randomBetween(0, height);
        break;
    }
    const angle = Math.atan2(height / 2 - y, width / 2 - x);
    const speed = randomBetween(asteroidConfig.minSpeed, asteroidConfig.maxSpeed);
    vx = Math.cos(angle) * speed;
    vy = Math.sin(angle) * speed;
    // generate irregular polygon vertices
    const points = [];
    const sides = Math.floor(randomBetween(6, 10));
    for (let i = 0; i < sides; i++) {
      const theta = (i / sides) * Math.PI * 2;
      const offset = randomBetween(0.7, 1.3);
      points.push({ x: Math.cos(theta) * radius * offset, y: Math.sin(theta) * radius * offset });
    }
    asteroids.push({ x, y, vx, vy, radius, angle: 0, points });
  }

  // Game state
  let lastTime = performance.now();
  let accumulator = 0;
  let gameOver = false;
  let score = 0;

  function update(dt) {
    if (gameOver) return;
    // Input
    if (keys['ArrowLeft']) ship.angle -= ship.rotateSpeed;
    if (keys['ArrowRight']) ship.angle += ship.rotateSpeed;
    if (keys['ArrowUp'] || keys['Space']) {
      ship.vx += Math.cos(ship.angle) * ship.thrust;
      ship.vy += Math.sin(ship.angle) * ship.thrust;
      ship.isThrusting = true;
      playThrust();
    } else {
      ship.isThrusting = false;
    }
    // Apply friction
    ship.vx *= 0.99;
    ship.vy *= 0.99;

    ship.update();

    // Update asteroids
    for (const a of asteroids) {
      a.x += a.vx;
      a.y += a.vy;
      // wrap
      if (a.x < -a.radius) a.x += width + a.radius * 2;
      if (a.x > width + a.radius) a.x -= width + a.radius * 2;
      if (a.y < -a.radius) a.y += height + a.radius * 2;
      if (a.y > height + a.radius) a.y -= height + a.radius * 2;
    }

    // Collision detection (circle vs ship point)
    for (const a of asteroids) {
      const dx = ship.x - a.x;
      const dy = ship.y - a.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.radius + ship.radius) {
        gameOver = true;
        break;
      }
    }

    // Score based on survival time
    score += dt / 1000;
  }

  // Pre-generate stars for background
const starCount = 100;
const stars = [];
for (let i = 0; i < starCount; i++) {
  stars.push({ x: Math.random() * width, y: Math.random() * height, radius: Math.random() * 1.5 + 0.5 });
}

function draw() {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = backgroundGrad;
    ctx.fillRect(0, 0, width, height);
    // Background stars
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // Draw ship
    ship.draw();
    // Draw asteroids as irregular polygons
    for (const a of asteroids) {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.angle);
      // Asteroid gradient fill
      const grad = ctx.createRadialGradient(0, 0, a.radius * 0.2, 0, 0, a.radius);
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      const pts = a.points;
      if (pts && pts.length > 0) {
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.arc(0, 0, a.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    accumulator += dt;
    while (accumulator >= 16) { // ~60fps fixed step
      update(16);
      accumulator -= 16;
    }
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Start spawning asteroids
  spawnAsteroid();
  setInterval(spawnAsteroid, asteroidConfig.spawnInterval);

  requestAnimationFrame(loop);
})();
