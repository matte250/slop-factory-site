// Simple top‑down pixel pilot game
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth;
  const height = canvas.height = canvas.offsetHeight;

  // ---- audio setup ----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let audioInitialized = false;
  function ensureAudio() {
    if (!audioInitialized && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    audioInitialized = true;
  }
  function playTone(freq, dur) {
    ensureAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  function playThrust() { playTone(300, 0.08); }
  function playCrash() { playTone(100, 0.5); }

  // ---- visual extras ----
  // generate starfield background
  const stars = Array.from({length: 100}, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 1.5 + 0.5,
  }));

  // thrust particles
  const particles = [];

  // ---- player ----
  const ship = {
    x: width / 2,
    y: height / 2,
    angle: 0,
    vx: 0,
    vy: 0,
    radius: 5,
    thrust: 0.1,
    drag: 0.99,
  };

  // ---- input ----
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // ---- obstacles ----
  const obstacles = [];
  let obstacleTimer = 0;
  const obstacleInterval = 90; // frames
  const obstacleSpeed = 2;

  // ---- game state ----
  let score = 0;
  let alive = true;
  let crashPlayed = false;

  function spawnObstacle() {
    // Random side (top, bottom, left, right)
    const side = Math.floor(Math.random() * 4);
    const size = 10 + Math.random() * 20;
    let x, y, vx, vy;
    switch (side) {
      case 0: // top
        x = Math.random() * width; y = -size; vx = 0; vy = obstacleSpeed; break;
      case 1: // bottom
        x = Math.random() * width; y = height + size; vx = 0; vy = -obstacleSpeed; break;
      case 2: // left
        x = -size; y = Math.random() * height; vx = obstacleSpeed; vy = 0; break;
      case 3: // right
        x = width + size; y = Math.random() * height; vx = -obstacleSpeed; vy = 0; break;
    }
    obstacles.push({x, y, vx, vy, size});
  }

  function update() {
    if (!alive) return;

    // Player controls
    if (keys['ArrowLeft']) ship.angle -= 0.07;
    if (keys['ArrowRight']) ship.angle += 0.07;
    if (keys['ArrowUp']) {
      ship.vx += Math.cos(ship.angle) * ship.thrust;
      ship.vy += Math.sin(ship.angle) * ship.thrust;
      // thrust particles and sound
      particles.push({
        x: ship.x,
        y: ship.y,
        vx: Math.cos(ship.angle + Math.PI) * (Math.random() * 1 + 0.5),
        vy: Math.sin(ship.angle + Math.PI) * (Math.random() * 1 + 0.5),
        life: 30,
        radius: Math.random() * 2 + 1,
      });
      playThrust();
    }
    // Apply drag & move
    ship.vx *= ship.drag; ship.vy *= ship.drag;
    ship.x += ship.vx; ship.y += ship.vy;

    // Keep within bounds (lose if off‑screen)
    if (ship.x < -ship.radius || ship.x > width + ship.radius ||
        ship.y < -ship.radius || ship.y > height + ship.radius) {
      if (!crashPlayed) { playCrash(); crashPlayed = true; }
      alive = false;
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy;
      p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }

    // Obstacles
    obstacleTimer++;
    if (obstacleTimer >= obstacleInterval) {
      obstacleTimer = 0;
      spawnObstacle();
    }
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x += o.vx; o.y += o.vy;
      // Remove when passed screen
      if (o.x < -o.size || o.x > width + o.size || o.y < -o.size || o.y > height + o.size) {
        obstacles.splice(i, 1);
        continue;
      }
      // Collision detection (circle vs square approximated)
      const dx = o.x - ship.x;
      const dy = o.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < o.size + ship.radius) {
        alive = false;
      }
    }

    // Score based on frames survived
    score++;
  }

  function draw() {
    // Clear with dark space background
    ctx.fillStyle = '#000010';
    ctx.fillRect(0, 0, width, height);

    // Starfield (twinkling)
    ctx.fillStyle = 'white';
    stars.forEach(star => {
      // small flicker
      const bright = Math.random() * 0.5 + 0.5;
      ctx.globalAlpha = bright;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // Particles (thrust)
    particles.forEach(p => {
      const fade = p.life / 30;
      ctx.fillStyle = `rgba(255,200,0,${fade})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Ship
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    // body with gradient
    const grad = ctx.createLinearGradient(-5, 0, 8, 0);
    grad.addColorStop(0, '#00ffff');
    grad.addColorStop(1, '#0066ff');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(-5, -4);
    ctx.lineTo(-5, 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Obstacles (asteroids)
    obstacles.forEach(o => {
      const ox = o.x, oy = o.y, os = o.size;
      ctx.fillStyle = '#aa5500';
      ctx.strokeStyle = '#552200';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ox, oy, os, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    // Score
    ctx.fillStyle = 'white';
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + Math.floor(score / 60), 10, 20);

    if (!alive) {
      ctx.fillStyle = 'red';
      ctx.font = '30px monospace';
      ctx.fillText('Game Over', width / 2 - 80, height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (alive) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
