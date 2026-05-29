// Simple endless‑space ship game with improved graphics
// Canvas id="game" – assumes full‑size canvas in HTML

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // Resize to fill parent
  const resize = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  };
  window.addEventListener('resize', resize);
  resize();

  // Ship state
  const ship = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    angle: 0, // radians
    vx: 0,
    vy: 0,
    radius: 10,
  };

  const keys = { left: false, right: false, up: false };
  document.addEventListener('keydown', e => {
    if (e.code === 'ArrowLeft') keys.left = true;
    if (e.code === 'ArrowRight') keys.right = true;
    if (e.code === 'ArrowUp') { keys.up = true; playThrust(); }
  });
  document.addEventListener('keyup', e => {
    if (e.code === 'ArrowLeft') keys.left = false;
    if (e.code === 'ArrowRight') keys.right = false;
    if (e.code === 'ArrowUp') { keys.up = false; stopThrust(); }
  });

  const obstacles = [];
  const fuels = [];
  const stars = [];
  const particles = [];
  // sound context and helpers
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let thrustOsc = null;
  const playThrust = () => {
    if (thrustOsc) return;
    thrustOsc = audioCtx.createOscillator();
    thrustOsc.frequency.setValueAtTime(150, audioCtx.currentTime);
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
    thrustOsc.connect(gain).connect(audioCtx.destination);
    thrustOsc.start();
  };
  const stopThrust = () => {
    if (thrustOsc) {
      thrustOsc.stop();
      thrustOsc.disconnect();
      thrustOsc = null;
    }
  };
  const playCollision = () => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.setValueAtTime(80, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  };
  const playFuel = () => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.setValueAtTime(440, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
  };
  let obstacleTimer = 0;
  let fuelTimer = 0;
  let starTimer = 0;
  let score = 0;
  let gameOver = false;

  const spawnObstacle = () => {
    // obstacles with gradient fill
    const side = Math.random() < 0.5 ? 'top' : 'left';
    const radius = 15 + Math.random() * 20;
    const obj = {
      x: side === 'top' ? Math.random() * canvas.width : -radius,
      y: side === 'top' ? -radius : Math.random() * canvas.height,
      vx: 1 + Math.random() * 1.5,
      vy: 1 + Math.random() * 1.5,
      radius,
      // random hue for obstacle color
      color: `hsl(${Math.random() * 360},70%,60%)`,
    };
    // move towards bottom‑right (ship forward direction)
    obj.vx *= Math.cos(ship.angle);
    obj.vy *= Math.sin(ship.angle);
    obstacles.push(obj);
  };
    const side = Math.random() < 0.5 ? 'top' : 'left';
    const radius = 15 + Math.random() * 20;
    const obj = {
      x: side === 'top' ? Math.random() * canvas.width : -radius,
      y: side === 'top' ? -radius : Math.random() * canvas.height,
      vx: 1 + Math.random() * 1.5,
      vy: 1 + Math.random() * 1.5,
      radius,
    };
    // move towards bottom‑right (ship forward direction)
    obj.vx *= Math.cos(ship.angle);
    obj.vy *= Math.sin(ship.angle);
    obstacles.push(obj);
  };

  const spawnFuel = () => {
    const obj = {
      x: Math.random() * canvas.width,
      y: -20,
      vx: 0,
      vy: 1.5,
      radius: 8,
    };
    fuels.push(obj);
  };

  const spawnStar = () => {
    const s = {
      x: Math.random() * canvas.width,
      y: -2,
      vx: (Math.random() - 0.5) * 0.3,
      speed: 0.5 + Math.random() * 0.5,
      radius: 1 + Math.random() * 1,
    };
    stars.push(s);
  };

  const createParticles = (x, y, count = 8) => {
    for (let i = 0; i < count; i++) {
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        life: 30 + Math.random() * 20,
        decay: 1,
        radius: 2 + Math.random() * 2,
        color: `hsl(${Math.random() * 360},80%,60%)`,
      });
    }
  };

  const update = dt => {
    if (gameOver) return;
    // ship controls
    if (keys.left) ship.angle -= 0.04;
    if (keys.right) ship.angle += 0.04;
    if (keys.up) {
      ship.vx += Math.cos(ship.angle) * 0.1;
      ship.vy += Math.sin(ship.angle) * 0.1;
    }
    // drag
    ship.vx *= 0.99;
    ship.vy *= 0.99;
    ship.x += ship.vx;
    ship.y += ship.vy;
    // wrap around edges
    if (ship.x < 0) ship.x += canvas.width;
    if (ship.x > canvas.width) ship.x -= canvas.width;
    if (ship.y < 0) ship.y += canvas.height;
    if (ship.y > canvas.height) ship.y -= canvas.height;

    // spawn obstacles/fuel/stars
    obstacleTimer += dt;
    fuelTimer += dt;
    starTimer += dt;
    if (obstacleTimer > 1500) { spawnObstacle(); obstacleTimer = 0; }
    if (fuelTimer > 3000) { spawnFuel(); fuelTimer = 0; }
    if (starTimer > 100) { spawnStar(); starTimer = 0; }

    // move obstacles and fuels
    obstacles.forEach(o => { o.x += o.vx; o.y += o.vy; });
    fuels.forEach(f => { f.x += f.vx; f.y += f.vy; });
    // move stars for background
    stars.forEach(s => { s.y += s.speed; s.x += s.vx; });
    // move particles
    particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.life -= p.decay; });
    // remove off‑screen and dead
    const off = arr => arr.filter(o => o.x < canvas.width && o.y < canvas.height && o.x > -50 && o.y > -50);
    obstacles.splice(0, obstacles.length, ...off(obstacles));
    fuels.splice(0, fuels.length, ...off(fuels));
    stars.splice(0, stars.length, ...stars.filter(s => s.y < canvas.height && s.x > -5 && s.x < canvas.width + 5));
    particles.splice(0, particles.length, ...particles.filter(p => p.life > 0));

    // collisions
    for (const o of obstacles) {
      const dx = o.x - ship.x, dy = o.y - ship.y;
      if (Math.hypot(dx, dy) < o.radius + ship.radius) {
        gameOver = true;
        createParticles(ship.x, ship.y, 30);
        playCollision();
        break;
      }
    }
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
      if (Math.hypot(f.x - ship.x, f.y - ship.y) < f.radius + ship.radius) {
        score += 10;
        createParticles(f.x, f.y, 12);
        playFuel();
        fuels.splice(i, 1);
      }
    }
    score += dt * 0.01; // survival score
  };

  const draw = () => {
    // background gradient (space dark)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // stars (tiny points)
    ctx.fillStyle = '#aaa';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // ship with gradient fill
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    const grad = ctx.createLinearGradient(-15, 0, 15, 0);
    grad.addColorStop(0, '#0ff');
    grad.addColorStop(1, '#005');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(-10, -7);
    ctx.lineTo(-10, 7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // obstacles with individual colors
    obstacles.forEach(o => {
      ctx.fillStyle = o.color;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // fuel cells
    ctx.fillStyle = '#ff0';
    fuels.forEach(f => {
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // particles (explosions, fading)
    particles.forEach(p => {
      ctx.globalAlpha = Math.max(p.life / 50, 0);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f44';
      ctx.textAlign = 'center';
      ctx.font = '32px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  };

  let last = performance.now();
  const loop = now => {
    const dt = now - last;
    last = now;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
