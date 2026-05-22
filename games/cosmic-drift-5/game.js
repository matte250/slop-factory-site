// Simple canvas game based on IDEA.md – Cosmic Drift
// Canvas element with id "game" must exist in the page.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playLaserSound(){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 800;
    osc.type = 'square';
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  }
  function playHitSound(){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 200;
    osc.type = 'triangle';
    gain.gain.setValueAtTime(0.07, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
  }
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  // starfield background
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 2 + 0.5,
      speed: Math.random() * 0.5 + 0.2,
    });
  }

  const ship = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    angle: 0,
    radius: 12,
    speedX: 0,
    speedY: 0,
    thrust: 0.1,
    rotateSpeed: 0.07,
    health: 100,
    laserCooldown: 0,
  };

  const asteroids = [];
  const lasers = [];
  const keys = {};

  // Input handling
  window.addEventListener('keydown', e => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => {
    keys[e.key] = false;
  });

  function spawnAsteroid() {
    const size = Math.random() * 20 + 10;
    const side = Math.random() < 0.5 ? 'top' : 'left';
    let x, y, vx, vy;
    if (side === 'top') {
      x = Math.random() * canvas.width;
      y = -size;
      vx = (Math.random() - 0.5) * 0.5;
      vy = Math.random() * 1 + 0.5;
    } else {
      x = -size;
      y = Math.random() * canvas.height;
      vx = Math.random() * 1 + 0.5;
      vy = (Math.random() - 0.5) * 0.5;
    }
    asteroids.push({x, y, vx, vy, size, angle: Math.random()*Math.PI*2, rotSpeed: (Math.random()-0.5)*0.02});
  }

  setInterval(spawnAsteroid, 1000);

  function fireLaser() {
    if (ship.laserCooldown > 0) return;
    const speed = 5;
    lasers.push({
      x: ship.x + Math.cos(ship.angle) * ship.radius,
      y: ship.y + Math.sin(ship.angle) * ship.radius,
      vx: Math.cos(ship.angle) * speed,
      vy: Math.sin(ship.angle) * speed,
      ttl: 60,
    });
    playLaserSound();
    ship.laserCooldown = 15; // frames
  }

  function update() {
  // move background stars
  for (let i = stars.length - 1; i >= 0; i--) {
    const s = stars[i];
    s.y += s.speed;
    if (s.y > canvas.height) {
      s.y = 0;
      s.x = Math.random() * canvas.width;
    }
  }
    // Ship controls
    if (keys['ArrowLeft']) ship.angle -= ship.rotateSpeed;
    if (keys['ArrowRight']) ship.angle += ship.rotateSpeed;
    if (keys['ArrowUp']) {
      ship.speedX += Math.cos(ship.angle) * ship.thrust;
      ship.speedY += Math.sin(ship.angle) * ship.thrust;
    }
    if (keys[' ']) fireLaser(); // space bar

    // Apply friction
    ship.speedX *= 0.99;
    ship.speedY *= 0.99;
    ship.x += ship.speedX;
    ship.y += ship.speedY;

    // Keep ship within bounds (wrap)
    if (ship.x < 0) ship.x += canvas.width;
    if (ship.x > canvas.width) ship.x -= canvas.width;
    if (ship.y < 0) ship.y += canvas.height;
    if (ship.y > canvas.height) ship.y -= canvas.height;

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx;
      a.y += a.vy;
      // rotate asteroid
      a.angle += a.rotSpeed;
      // remove off‑screen
      if (a.x < -a.size || a.x > canvas.width + a.size || a.y < -a.size || a.y > canvas.height + a.size) {
        asteroids.splice(i, 1);
        continue;
      }
      // ship‑asteroid collision
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
        if (Math.hypot(dx, dy) < a.size + ship.radius) {
          ship.health -= 10;
          playHitSound();
          asteroids.splice(i, 1);
          if (ship.health <= 0) {
            alert('Game Over');
            document.location.reload();
            return;
          }
          continue;
        }
    }

    // Update lasers
    for (let i = lasers.length - 1; i >= 0; i--) {
      const l = lasers[i];
      l.x += l.vx;
      l.y += l.vy;
      l.ttl--;
      // remove expired
      if (l.ttl <= 0) { lasers.splice(i, 1); continue; }
      // laser‑asteroid collision
      for (let j = asteroids.length - 1; j >= 0; j--) {
        const a = asteroids[j];
        const dx = a.x - l.x;
        const dy = a.y - l.y;
          if (Math.hypot(dx, dy) < a.size) {
            playHitSound();
            asteroids.splice(j, 1);
            lasers.splice(i, 1);
            break;
          }
      }
    }

    if (ship.laserCooldown > 0) ship.laserCooldown--;

    draw();
    requestAnimationFrame(update);
  }

  function draw() {
    // space background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // draw starfield
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    // ship with gradient and trail
    // draw trail
    if (!ship.trail) ship.trail = [];
    ship.trail.push({x: ship.x, y: ship.y, alpha: 1});
    if (ship.trail.length > 20) ship.trail.shift();
    ship.trail.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.alpha * 0.3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, ship.radius * 0.8, 0, Math.PI * 2);
      ctx.fillStyle = '#0ff';
      ctx.fill();
      ctx.restore();
      p.alpha *= 0.95;
    });
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    const grad = ctx.createLinearGradient(-ship.radius, 0, ship.radius, 0);
    grad.addColorStop(0, '#00f');
    grad.addColorStop(1, '#0ff');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(ship.radius, 0);
    ctx.lineTo(-ship.radius, ship.radius / 2);
    ctx.lineTo(-ship.radius, -ship.radius / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // asteroids
    asteroids.forEach(a => {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.angle);
      ctx.fillStyle = '#888';
      ctx.beginPath();
      // draw a rough polygon to simulate asteroid shape
      const points = 7;
      for (let i = 0; i < points; i++) {
        const theta = (i / points) * Math.PI * 2;
        const r = a.size * (0.7 + Math.random() * 0.6);
        ctx.lineTo(Math.cos(theta) * r, Math.sin(theta) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });

    // lasers
    ctx.strokeStyle = '#f00';
    ctx.lineWidth = 2;
    lasers.forEach(l => {
      ctx.beginPath();
      ctx.moveTo(l.x, l.y);
      ctx.lineTo(l.x - l.vx * 2, l.y - l.vy * 2);
      ctx.stroke();
    });

    // health bar
    const barWidth = 100;
    const barHeight = 8;
    ctx.fillStyle = '#000';
    ctx.fillRect(10, 10, barWidth, barHeight);
    ctx.fillStyle = '#0f0';
    ctx.fillRect(10, 10, (ship.health / 100) * barWidth, barHeight);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(10, 10, barWidth, barHeight);
  }

  requestAnimationFrame(update);
})();
