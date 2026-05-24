// Minimal Asteroid Dodge game
// Canvas element with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // ensure audio context is resumed on user interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  window.addEventListener('keydown', resumeAudio);

  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // Ship state
  const ship = {
    x: width / 4,
    y: height / 2,
    angle: 0,
    vx: 0,
    vy: 0,
    radius: 10,
  };

  // Controls
  const keys = { left: false, right: false, up: false };
  window.addEventListener('keydown', e => {
    if (e.code === 'ArrowLeft') keys.left = true;
    if (e.code === 'ArrowRight') keys.right = true;
    if (e.code === 'ArrowUp') keys.up = true;
  });
  window.addEventListener('keyup', e => {
    if (e.code === 'ArrowLeft') keys.left = false;
    if (e.code === 'ArrowRight') keys.right = false;
    if (e.code === 'ArrowUp') keys.up = false;
  });

  // Asteroids and particles
  const asteroids = [];
  const particles = [];
  const particleLifetime = 800; // ms
  let lastSpawn = 0;
  const spawnInterval = 1500; // ms
  let score = 0;
  let gameOver = false;

  function spawnAsteroid() {
    const size = 15 + Math.random() * 25;
    asteroids.push({
      x: width + size,
      y: Math.random() * (height - size * 2) + size,
      r: size,
      vx: -(1 + Math.random() * 2),
    });
    // sound for asteroid appearance
    playTone(120, 0.05);
  }

  function update(dt) {
    const now = performance.now();
    if (gameOver) return;
    // ship rotation
    if (keys.left) ship.angle -= 0.07;
    if (keys.right) ship.angle += 0.07;
    // thrust
    if (keys.up) {
      const thrust = 0.1;
      ship.vx += Math.cos(ship.angle) * thrust;
      ship.vy += Math.sin(ship.angle) * thrust;
      // generate thrust particles
      for (let i = 0; i < 2; i++) {
        const angle = ship.angle + Math.PI + (Math.random() - 0.5) * 0.5;
        const speed = 0.5 + Math.random() * 0.5;
        particles.push({
          x: ship.x - Math.cos(ship.angle) * 12,
          y: ship.y - Math.sin(ship.angle) * 12,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 2 + Math.random() * 2,
          color: 'orange',
          alpha: 0.8,
          birth: now,
        });
      }
      // thrust sound
      playTone(400, 0.07);
    }
    // apply velocity & friction
    ship.x += ship.vx;
    ship.y += ship.vy;
    ship.vx *= 0.99;
    ship.vy *= 0.99;

    // update particles (thrust dust, explosion fragments)
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      const age = now - p.birth;
      p.alpha = Math.max(0, 1 - age / particleLifetime);
      if (age > particleLifetime) particles.splice(i, 1);
    }

    // bounds check (lose if outside)
    if (ship.x < 0 || ship.x > width || ship.y < 0 || ship.y > height) {
      // crash sound on leaving bounds
      playTone(150, 0.3);
      gameOver = true;
    }

    // asteroids movement
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx;
      if (a.x + a.r < 0) asteroids.splice(i, 1), score++;
    }

    // collisions
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.r + ship.radius) {
        gameOver = true;
        break;
      }
    }

    // spawn new asteroids
    if (performance.now() - lastSpawn > spawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }
  }

  function drawShip() {
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    // ship glow (soft light)
    ctx.globalCompositeOperation = 'lighter';
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 15);
    glow.addColorStop(0, 'rgba(255,255,255,0.4)');
    glow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    // ship body
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(-10, -7);
    ctx.lineTo(-10, 7);
    ctx.closePath();
    ctx.fillStyle = '#fff';
    ctx.fill();
    // optional thrust flame
    if (keys.up) {
      ctx.beginPath();
      ctx.moveTo(-10, -5);
      ctx.lineTo(-20, 0);
      ctx.lineTo(-10, 5);
      ctx.closePath();
      ctx.fillStyle = 'orange';
      ctx.fill();
    }
    ctx.restore();
  }

  function draw() {
    // starry background gradient
    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, '#001');
    bg.addColorStop(1, '#000');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // small twinkling stars (randomly based on frame)
    for (let i = 0; i < 30; i++) {
      const sx = Math.random() * width;
      const sy = Math.random() * height;
      ctx.fillStyle = 'rgba(255,255,255,' + (0.2 + Math.random() * 0.3) + ')';
      ctx.fillRect(sx, sy, 1, 1);
    }

    // asteroids with gradient shading and outline
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.3, a.x, a.y, a.r);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // ship (with thrust flame and glow)
    drawShip();
    // draw particles (explosions, thrust dust)
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
      ctx.globalAlpha = 1.0;
    }

    // score
    ctx.fillStyle = '#0f0';
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + score, 10, 20);

    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '24px monospace';
      ctx.fillText('Game Over', width / 2 - 60, height / 2);
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
