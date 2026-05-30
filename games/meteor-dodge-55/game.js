// Meteor Dodge Game – enhanced graphics
// Assumes an HTML <canvas id="game"></canvas> present.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playExplosionSound() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
  }

  // Starfield background – generate once
  const stars = [];
  for (let i = 0; i < 150; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5 + 0.5,
    });
  }

  // Player ship (triangle)
  const ship = {
    w: 40,
    h: 30,
    x: width / 2 - 20,
    y: height - 40,
    speed: 0.4, // per ms, scaled by dt
    shield: 3,
  };

  // Input handling (arrow keys or A/D)
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // Meteors and particles
  const meteors = [];
  const particles = [];
  const meteorSpawnInterval = 900; // ms
  let lastSpawn = 0;

  function spawnMeteor() {
    const radius = Math.random() * 12 + 8;
    const x = Math.random() * (width - radius * 2) + radius;
    const speed = Math.random() * 0.2 + 0.1; // per ms
    meteors.push({ x, y: -radius, radius, speed });
  }

  function spawnExplosion(x, y) {
    for (let i = 0; i < 12; i++) {
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: Math.random() * 2 + 1,
        life: 500,
        age: 0,
      });
    }
  }

  function update(dt) {
    // Move ship (dt in ms)
    if (keys.ArrowLeft || keys.a) ship.x -= ship.speed * dt;
    if (keys.ArrowRight || keys.d) ship.x += ship.speed * dt;
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));

    // Spawn meteors
    if (Date.now() - lastSpawn > meteorSpawnInterval) {
      spawnMeteor();
      lastSpawn = Date.now();
    }

    // Update meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.y += m.speed * dt;
      if (m.y - m.radius > height) {
        meteors.splice(i, 1);
      }
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.age += dt;
      if (p.age >= p.life) particles.splice(i, 1);
    }

    // Collision detection
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      const shipRect = { x: ship.x, y: ship.y, w: ship.w, h: ship.h };
      const dx = Math.max(shipRect.x - (m.x + m.radius), 0, m.x - (shipRect.x + shipRect.w));
      const dy = Math.max(shipRect.y - (m.y + m.radius), 0, m.y - (shipRect.y + shipRect.h));
      if (dx * dx + dy * dy < m.radius * m.radius) {
        meteors.splice(i, 1);
        spawnExplosion(m.x, m.y);
        playExplosionSound();
        ship.shield--;
        if (ship.shield <= 0) {
          cancelAnimationFrame(animId);
          // Dark overlay and game over text
          ctx.fillStyle = 'rgba(0,0,0,0.8)';
          ctx.fillRect(0, 0, width, height);
          ctx.fillStyle = 'white';
          ctx.textAlign = 'center';
          ctx.font = '48px sans-serif';
          ctx.fillText('Game Over', width / 2, height / 2);
          return;
        }
      }
    }
  }

  function drawBackground() {
    // Space gradient
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#01010a');
    grad.addColorStop(1, '#02041b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    // Stars
    ctx.fillStyle = 'white';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawShip() {
    ctx.fillStyle = 'cyan';
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
  }

  function drawMeteors() {
    meteors.forEach(m => {
      const gradient = ctx.createRadialGradient(m.x, m.y, m.radius * 0.2, m.x, m.y, m.radius);
      gradient.addColorStop(0, '#ff9c33');
      gradient.addColorStop(1, '#ff3000');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawParticles() {
    particles.forEach(p => {
      const alpha = 1 - p.age / p.life;
      ctx.fillStyle = `rgba(255,200,50,${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawHUD() {
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText('Shield: ' + ship.shield, 10, 20);
  }

  function draw() {
    drawBackground();
    drawMeteors();
    drawShip();
    drawParticles();
    drawHUD();
  }

  let lastTime = 0;
  let animId;
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    animId = requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
