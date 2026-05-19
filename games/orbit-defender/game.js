// Simple Orbit Defender game
// Canvas with id="game" must exist in the page.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const W = (canvas.width = canvas.clientWidth || 800);
  const H = (canvas.height = canvas.clientHeight || 600);
  const cx = W / 2,
    cy = H / 2;
  const planetR = 30;
  const shipR = 10;
  const ship = { angle: 0, radius: planetR + 30, speed: 0.04 };
  const bullets = [];
  const asteroids = [];
  const stars = [];
  const particles = [];
  // init starfield
  for (let i = 0; i < 100; i++) {
    stars.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 2 });
  }
  let score = 0;
  let lastAsteroid = 0;
  let gameOver = false;
  // audio
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function unlockAudio() {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }
  function playBeep(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    unlockAudio();
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnAsteroid() {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.max(W, H) / 2 + 40;
    const x = cx + Math.cos(angle) * distance;
    const y = cy + Math.sin(angle) * distance;
    const speed = 1 + Math.random() * 1.5;
    const dx = (cx - x) / distance * speed;
    const dy = (cy - y) / distance * speed;
    asteroids.push({ x, y, dx, dy, r: 12 + Math.random() * 8 });
  }

  function update(dt) {
    if (gameOver) return;
    // rotate ship
    if (keys.ArrowLeft) ship.angle -= ship.speed * dt;
    if (keys.ArrowRight) ship.angle += ship.speed * dt;
    // fire
    if (keys[' '] && bullets.length < 5) {
      const sx = cx + Math.cos(ship.angle) * ship.radius;
      const sy = cy + Math.sin(ship.angle) * ship.radius;
      const vx = Math.cos(ship.angle) * 6;
      const vy = Math.sin(ship.angle) * 6;
      bullets.push({ x: sx, y: sy, vx, vy, r: 3 });
        // play shooting sound
        playBeep(600, 0.04);
    }
    // update bullets
    bullets.forEach(b => {
      b.x += b.vx;
      b.y += b.vy;
    });
    // update particles (sparkles)
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    // remove off‑screen bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      if (b.x < 0 || b.x > W || b.y < 0 || b.y > H) bullets.splice(i, 1);
    }
    // update asteroids
    asteroids.forEach(a => {
      a.x += a.dx;
      a.y += a.dy;
    });
    // collision bullet‑asteroid
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      for (let j = bullets.length - 1; j >= 0; j--) {
        const b = bullets[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < a.r + b.r) {
          // create explosion particles
          for (let k = 0; k < 8; k++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 2;
            particles.push({
              x: a.x,
              y: a.y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              r: 1 + Math.random() * 2,
              life: 0.5 + Math.random() * 0.5
            });
          }
          asteroids.splice(i, 1);
          bullets.splice(j, 1);
          // explosion sound
          playBeep(300, 0.2);
          score++;
          break;
        }
      }
    }
    // collision asteroid‑planet / ship
    for (const a of asteroids) {
      const dPlanet = Math.hypot(a.x - cx, a.y - cy);
      if (dPlanet < planetR + a.r) {
        gameOver = true;
        break;
      }
      const sx = cx + Math.cos(ship.angle) * ship.radius;
      const sy = cy + Math.sin(ship.angle) * ship.radius;
      const dShip = Math.hypot(a.x - sx, a.y - sy);
      if (dShip < shipR + a.r) {
        gameOver = true;
        break;
      }
    }
    // spawn new asteroids every ~2 seconds
    if (Date.now() - lastAsteroid > 2000) {
      spawnAsteroid();
      lastAsteroid = Date.now();
    }
  }

  function draw() {
    // fill background with dark space
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    // stars background (twinkling limited to static)
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // planet with radial gradient
    const planetGrad = ctx.createRadialGradient(cx, cy, planetR * 0.2, cx, cy, planetR);
    planetGrad.addColorStop(0, '#666');
    planetGrad.addColorStop(1, '#111');
    ctx.fillStyle = planetGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, planetR, 0, Math.PI * 2);
    ctx.fill();
    // ship (green with stroke)
    const sx = cx + Math.cos(ship.angle) * ship.radius;
    const sy = cy + Math.sin(ship.angle) * ship.radius;
    ctx.fillStyle = '#0f0';
    ctx.strokeStyle = '#050';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx + Math.cos(ship.angle) * shipR, sy + Math.sin(ship.angle) * shipR);
    ctx.lineTo(
      sx + Math.cos(ship.angle + Math.PI * 0.7) * shipR,
      sy + Math.sin(ship.angle + Math.PI * 0.7) * shipR
    );
    ctx.lineTo(
      sx + Math.cos(ship.angle - Math.PI * 0.7) * shipR,
      sy + Math.sin(ship.angle - Math.PI * 0.7) * shipR
    );
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // bullets (glowing)
    ctx.save();
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#ff0';
    ctx.fillStyle = '#ff0';
    bullets.forEach(b => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
    // particles (explosion sparkles with fade)
    particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    // asteroids (rocky texture with gradient)
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#c88');
      grad.addColorStop(1, '#822');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    // game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', W / 2, H / 2);
      ctx.font = '24px sans-serif';
      ctx.fillText('Click to restart', W / 2, H / 2 + 40);
    }
  }

  function loop(timestamp) {
    const dt = 0.016; // fixed step for simplicity
    if (!gameOver) update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  // restart on click after game over
  canvas.addEventListener('click', () => {
    if (!gameOver) return;
    // reset state
    asteroids.length = 0;
    bullets.length = 0;
    score = 0;
    ship.angle = 0;
    gameOver = false;
    lastAsteroid = Date.now();
  });

  // start loop
  requestAnimationFrame(loop);
})();
