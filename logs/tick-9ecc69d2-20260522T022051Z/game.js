// Simple asteroid dodge game targeting canvas with id="game" with enhanced graphics

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // canvas not found
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;
  // create star field for background
  for (let i = 0; i < 100; i++) {
    stars.push({ x: rand(0, width), y: rand(0, height), radius: rand(0.5, 2) });
  }
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let thrustOsc = null;
  function startThrustSound() {
    if (thrustOsc) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 200;
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.07, audioCtx.currentTime + 0.02);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    thrustOsc = { osc, gain };
  }
  function stopThrustSound() {
    if (!thrustOsc) return;
    const { osc, gain } = thrustOsc;
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    setTimeout(() => {
      osc.stop();
    }, 120);
    thrustOsc = null;
  }
  function playExplosionSound() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 80;
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  }


  // ----- Game State -----
  const ship = {
    x: width / 2,
    y: height / 2,
    angle: 0, // radians, 0 points up
    velX: 0,
    velY: 0,
    radius: 10,
  };
  const keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false };
  const asteroids = [];
  const stars = [];
  let gameOver = false;
  let spawnTimer = 0;


  // ----- Input -----
  window.addEventListener('keydown', e => {
    if (keys.hasOwnProperty(e.key)) {
+      // Resume audio context on first interaction
+      if (audioCtx.state === 'suspended') audioCtx.resume();
+      // start thrust sound when thrust begins
+      if (e.key === 'ArrowUp' && !keys.ArrowUp) startThrustSound();
+      keys[e.key] = true;
+    }
+  });
+  window.addEventListener('keyup', e => {
+    if (keys.hasOwnProperty(e.key)) {
+      // stop thrust sound when key released
+      if (e.key === 'ArrowUp' && keys.ArrowUp) stopThrustSound();
+      keys[e.key] = false;
+    }
+  });

  // ----- Helpers -----
  function rand(min, max) { return Math.random() * (max - min) + min; }
  function distance(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }
  // small particles for explosion effects
  const particles = [];
  function createExplosion(x, y) {
    const count = 20;
    for (let i = 0; i < count; i++) {
      particles.push({
        x,
        y,
        vx: rand(-2, 2),
        vy: rand(-2, 2),
        alpha: 1,
        size: rand(2, 4),
      });
    }
  }

  function spawnAsteroid() {
    // spawn on random edge
    const edge = Math.floor(rand(0, 4));
    let x, y, vx, vy;
    const speed = rand(1, 3);
    if (edge === 0) { // top
      x = rand(0, width); y = -20; vx = rand(-1, 1); vy = speed;
    } else if (edge === 1) { // right
      x = width + 20; y = rand(0, height); vx = -speed; vy = rand(-1, 1);
    } else if (edge === 2) { // bottom
      x = rand(0, width); y = height + 20; vx = rand(-1, 1); vy = -speed;
    } else { // left
      x = -20; y = rand(0, height); vx = speed; vy = rand(-1, 1);
    }
    const radius = rand(8, 20);
    asteroids.push({ x, y, vx, vy, radius });
  }

  function update(dt) {
    if (gameOver) return;
    // ship controls
    if (keys.ArrowLeft) ship.angle -= 0.07;
    if (keys.ArrowRight) ship.angle += 0.07;
    const thrusting = keys.ArrowUp;
    if (thrusting) {
      const thrust = 0.1;
      ship.velX += Math.sin(ship.angle) * thrust;
      ship.velY -= Math.cos(ship.angle) * thrust;
    }
    // apply friction
    ship.velX *= 0.99; ship.velY *= 0.99;
    // move ship
    ship.x += ship.velX;
    ship.y += ship.velY;
    // wrap around edges
    if (ship.x < 0) ship.x += width;
    if (ship.x > width) ship.x -= width;
    if (ship.y < 0) ship.y += height;
    if (ship.y > height) ship.y -= height;

    // spawn asteroids
    spawnTimer -= dt;
    if (spawnTimer <= 0) { spawnAsteroid(); spawnTimer = rand(0.5, 1.5); }

    // move asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx; a.y += a.vy;
      // remove if far off-screen
      if (a.x < -50 || a.x > width + 50 || a.y < -50 || a.y > height + 50) {
        asteroids.splice(i, 1);
        continue;
      }
      // collision with ship
      if (distance(a.x, a.y, ship.x, ship.y) < a.radius + ship.radius) {
        createExplosion(ship.x, ship.y);
        playExplosionSound();
        gameOver = true;
      }
    }

    // update particles (explosion)
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= dt * 2;
      if (p.alpha <= 0) {
        particles.splice(i, 1);
      }
    }

    // twinkle stars (slight radius jitter)
    for (const s of stars) {
      s.radius += (Math.random() - 0.5) * 0.02;
      if (s.radius < 0.3) s.radius = 0.3;
      if (s.radius > 2) s.radius = 2;
    }
  }

  function drawShip() {
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    // ship body with gradient
    const grad = ctx.createLinearGradient(0, -ship.radius, 0, ship.radius);
    grad.addColorStop(0, '#0f0');
    grad.addColorStop(1, '#070');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, -ship.radius);
    ctx.lineTo(ship.radius, ship.radius);
    ctx.lineTo(-ship.radius, ship.radius);
    ctx.closePath();
    ctx.fill();
    // thrust flame
    if (keys.ArrowUp) {
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.moveTo(0, ship.radius);
      ctx.lineTo(ship.radius * 0.5, ship.radius + 10);
      ctx.lineTo(-ship.radius * 0.5, ship.radius + 10);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function draw() {
    // Space background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, '#001');
    bgGradient.addColorStop(1, '#000');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Stars (twinkling)
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Asteroids with radial gradient shading
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Particles (explosion)
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      ctx.fillStyle = `rgba(255,165,0,${p.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ship
    drawShip();

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  let last = performance.now();
  function loop(now) {
    const dt = (now - last) / 1000; // seconds
    last = now;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
