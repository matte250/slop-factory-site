// Asteroid Dodge game
// Canvas element with id="game"
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    setTimeout(() => {
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.01);
      osc.stop(audioCtx.currentTime + 0.02);
    }, duration);
  };

  const ship = { x: width / 2, y: height / 2, r: 12, speed: 4 };
  const stars = [];
  const particles = [];
  // Initialize star field
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5 + 0.5,
      a: Math.random()
    });
  }
  const keys = {};
  const asteroids = [];
  let lastSpawn = 0;
  let gameOver = false;

  // Input handling
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  const spawnAsteroid = () => {
    const edge = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    const r = 15 + Math.random() * 15;
    const speed = 1 + Math.random() * 2;
    switch (edge) {
      case 0: // top
        x = Math.random() * width;
        y = -r;
        vx = (Math.random() - 0.5) * speed;
        vy = speed;
        break;
      case 1: // bottom
        x = Math.random() * width;
        y = height + r;
        vx = (Math.random() - 0.5) * speed;
        vy = -speed;
        break;
      case 2: // left
        x = -r;
        y = Math.random() * height;
        vx = speed;
        vy = (Math.random() - 0.5) * speed;
        break;
      default: // right
        x = width + r;
        y = Math.random() * height;
        vx = -speed;
        vy = (Math.random() - 0.5) * speed;
        break;
    }
    asteroids.push({ x, y, r, vx, vy });
    // Sound for asteroid spawn
    playTone(120, 80);
  };

  const update = (dt) => {
    // Move ship (if not game over)
    if (!gameOver) {
      const moving = keys.ArrowUp || keys.w || keys.ArrowDown || keys.s || keys.ArrowLeft || keys.a || keys.ArrowRight || keys.d;
      if (keys.ArrowUp || keys.w) ship.y -= ship.speed;
      if (keys.ArrowDown || keys.s) ship.y += ship.speed;
      if (keys.ArrowLeft || keys.a) ship.x -= ship.speed;
      if (keys.ArrowRight || keys.d) ship.x += ship.speed;
      ship.x = Math.max(ship.r, Math.min(width - ship.r, ship.x));
      ship.y = Math.max(ship.r, Math.min(height - ship.r, ship.y));
      if (moving) playTone(440, 50); // ship thrust sound
    }
    // Update asteroids
    asteroids.forEach(a => { a.x += a.vx; a.y += a.vy; });
    // Remove off‑screen asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      if (a.x < -a.r || a.x > width + a.r || a.y < -a.r || a.y > height + a.r) {
        asteroids.splice(i, 1);
      }
    }
    // Collision detection
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.r + ship.r) {
        // create explosion particles
        for (let i = 0; i < 30; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 3 + 1;
          particles.push({
            x: ship.x,
            y: ship.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: Math.random() * 30 + 30,
            r: Math.random() * 2 + 1,
            color: `hsl(${Math.random() * 60},100%,50%)`
          });
        }
        gameOver = true;
        break;
      }
    }
    // Update particles
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
    });
    // Remove dead particles
    for (let i = particles.length - 1; i >= 0; i--) {
      if (particles[i].life <= 0) particles.splice(i, 1);
    }
    // Spawn new asteroid
    if (performance.now() - lastSpawn > 1500) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }
  };

  const draw = () => {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#004');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // Stars field
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.globalAlpha = s.a;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    // Ship (triangle pointing up)
    ctx.save();
    ctx.translate(ship.x, ship.y);
    const dx = (keys.ArrowRight || keys.d ? 1 : 0) - (keys.ArrowLeft || keys.a ? 1 : 0);
    const dy = (keys.ArrowDown || keys.s ? 1 : 0) - (keys.ArrowUp || keys.w ? 1 : 0);
    const angle = Math.atan2(dy, dx);
    ctx.rotate(isNaN(angle) ? 0 : angle);
    const shipGrad = ctx.createRadialGradient(0, 0, ship.r * 0.2, 0, 0, ship.r);
    shipGrad.addColorStop(0, '#0f0');
    shipGrad.addColorStop(1, '#060');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(0, -ship.r);
    ctx.lineTo(ship.r * 0.8, ship.r);
    ctx.lineTo(-ship.r * 0.8, ship.r);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // Asteroids with radial shading
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // Particles (explosion)
    particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(p.life / 60, 0);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  };

  let last = performance.now();
  const loop = () => {
    const now = performance.now();
    const dt = now - last;
    last = now;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  };

  // Start the game
  requestAnimationFrame(loop);
})();
