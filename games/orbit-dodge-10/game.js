// Orbit Dodge game
// Canvas with id="game"

window.addEventListener('load', () => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, length) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + length);
    osc.start();
    osc.stop(audioCtx.currentTime + length);
  }
  function playThrust() { playTone(300, 0.1); }
  function playExplosion() { playTone(80, 0.5); }

  const W = canvas.width = window.innerWidth;
  const H = canvas.height = window.innerHeight;

  // --- Game state ---
  const ship = { x: W / 2, y: H / 2 - 150, r: 10, angle: 0, vx: 0, vy: 0 };
  const core = { x: W / 2, y: H / 2, r: 30 };
  const asteroids = [];
  const AST_COUNT = 6;
  // starfield background
  const STAR_COUNT = 200;
  const stars = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({ x: Math.random() * W, y: Math.random() * H, size: Math.random() * 2 + 0.5, speed: Math.random() * 0.2 + 0.05 });
  }
  // ship trail cache
  const trail = [];
  const TRAIL_MAX = 20;

  for (let i = 0; i < AST_COUNT; i++) {
    const radius = 20 + Math.random() * 15;
    const dist = 80 + i * 40;
    const speed = 0.001 + Math.random() * 0.0015;
    asteroids.push({ radius, dist, angle: Math.random() * Math.PI * 2, speed });
  }
  let score = 0;
  let exploded = false;
  let gameOver = false;

  // --- Input handling ---
  const keys = {};
  window.addEventListener('keydown', e => {
    // Unlock audio on first user interaction
    if (audioCtx.state !== 'running') audioCtx.resume();
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function update(dt) {
    // update starfield (vertical drift)
    stars.forEach(s => {
      s.y += s.speed * dt * 100;
      if (s.y > H) { s.y = 0; s.x = Math.random() * W; }
    });
    // ship trail update
    trail.push({ x: ship.x, y: ship.y });
    if (trail.length > TRAIL_MAX) trail.shift();
    if (gameOver) return;
    // ship rotation
    if (keys['ArrowLeft']) ship.angle -= 3 * dt;
    if (keys['ArrowRight']) ship.angle += 3 * dt;
    // thrust
    if (keys['ArrowUp']) {
      const thrust = 200;
      ship.vx += Math.cos(ship.angle) * thrust * dt;
      ship.vy += Math.sin(ship.angle) * thrust * dt;
      playThrust();
    }
    // apply velocity
    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;
    // simple drag
    ship.vx *= 0.99;
    ship.vy *= 0.99;

    // keep ship within bounds (wrap)
    if (ship.x < 0) ship.x += W;
    if (ship.x > W) ship.x -= W;
    if (ship.y < 0) ship.y += H;
    if (ship.y > H) ship.y -= H;

    // update asteroids orbiting the core
    asteroids.forEach(a => {
      a.angle += a.speed * dt * 1000; // speed per ms
    });

    // collision detection
    const distToCore = Math.hypot(ship.x - core.x, ship.y - core.y);
    if (distToCore < ship.r + core.r) {
      gameOver = true;
      if (!exploded) { playExplosion(); exploded = true; }
    }
    for (const a of asteroids) {
      const ax = core.x + Math.cos(a.angle) * a.dist;
      const ay = core.y + Math.sin(a.angle) * a.dist;
      if (Math.hypot(ship.x - ax, ship.y - ay) < ship.r + a.radius) { gameOver = true; break; }
    }

    if (!gameOver) score += dt; // seconds survived
  }

function draw() {
  // clear background
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  // ★ starfield background
  ctx.fillStyle = '#fff';
  stars.forEach(s => {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
  });

  // ✦ ship thrust trail (fading circles)
  for (let i = 0; i < trail.length; i++) {
    const p = trail[i];
    const alpha = i / trail.length;
    ctx.fillStyle = `rgba(0,255,0,${alpha * 0.4})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, ship.r * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }

  // core with subtle radial gradient
  const coreGrad = ctx.createRadialGradient(core.x, core.y, core.r * 0.2, core.x, core.y, core.r);
  coreGrad.addColorStop(0, '#444');
  coreGrad.addColorStop(1, '#111');
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(core.x, core.y, core.r, 0, Math.PI * 2);
  ctx.fill();

  // asteroids with slight shading
  asteroids.forEach(a => {
    const ax = core.x + Math.cos(a.angle) * a.dist;
    const ay = core.y + Math.sin(a.angle) * a.dist;
    const grad = ctx.createRadialGradient(ax, ay, a.radius * 0.2, ax, ay, a.radius);
    grad.addColorStop(0, '#bbb');
    grad.addColorStop(1, '#555');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(ax, ay, a.radius, 0, Math.PI * 2);
    ctx.fill();
  });

  // ship (sharp triangle)
  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(ship.angle);
  ctx.fillStyle = '#0f0';
  ctx.strokeStyle = '#0c0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(ship.r, 0);
  ctx.lineTo(-ship.r, ship.r / 2);
  ctx.lineTo(-ship.r, -ship.r / 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // score display
  ctx.fillStyle = '#fff';
  ctx.font = '20px sans-serif';
  ctx.fillText('Score: ' + Math.floor(score), 10, 30);

  // game over overlay
  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#f00';
    ctx.textAlign = 'center';
    ctx.font = '48px sans-serif';
    ctx.fillText('Game Over', W / 2, H / 2);
  }
}

  let last = performance.now();
  function loop(ts) {
    const dt = (ts - last) / 1000; // seconds
    last = ts;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
});
