// Minimal Orbit Escape game with enhanced graphics
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const w = (canvas.width = canvas.offsetWidth);
  const h = (canvas.height = canvas.offsetHeight);
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  // Ensure audio starts after user interaction
  canvas.addEventListener('click', () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
  });  // create starfield
  const stars = Array.from({length: 80}, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    radius: Math.random() * 1.5 + 0.5,
    twinkle: Math.random() * 0.5 + 0.5
  }));

  // Ship state
  const ship = {
    x: w / 2,
    y: h / 2,
    angle: 0,
    speed: 2,
    radius: 6,
    trail: []
  };

  // Entity arrays
  const asteroids = [];
  const fuels = [];
  let score = 0;
  let gameOver = false;

  // Input handling
  const keys = { ArrowLeft: false, ArrowRight: false };
  window.addEventListener('keydown', e => {
    if (e.key in keys) keys[e.key] = true;
    if (audioCtx.state === 'suspended') audioCtx.resume();
  });
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  function spawnAsteroid() {
    const size = Math.random() * 20 + 10;
    const spawnAngle = Math.random() * Math.PI * 2;
    const distance = Math.max(w, h);
    const x = ship.x + Math.cos(spawnAngle) * distance;
    const y = ship.y + Math.sin(spawnAngle) * distance;
    const vx = (ship.x - x) / 200;
    const vy = (ship.y - y) / 200;
    const rot = Math.random() * Math.PI * 2;
    const rotSpeed = (Math.random() - 0.5) * 0.02;
    asteroids.push({ x, y, vx, vy, r: size, angle: rot, rotSpeed });
  }

  function spawnFuel() {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * Math.min(w, h) / 2;
    const x = ship.x + Math.cos(angle) * radius;
    const y = ship.y + Math.sin(angle) * radius;
    fuels.push({ x, y, r: 5, collected: false });
  }

  function update() {
    if (gameOver) return;
    // rotate ship
    if (keys.ArrowLeft) {
      ship.angle -= 0.07;
      playBeep(200, 0.03);
    }
    if (keys.ArrowRight) {
      ship.angle += 0.07;
      playBeep(200, 0.03);
    }
    // move forward
    ship.x += Math.cos(ship.angle) * ship.speed;
    ship.y += Math.sin(ship.angle) * ship.speed;

    // store trail point
    ship.trail.push({ x: ship.x, y: ship.y });
    if (ship.trail.length > 30) ship.trail.shift();

    // spawn entities
    if (Math.random() < 0.02) spawnAsteroid();
    if (Math.random() < 0.01) spawnFuel();

    // update asteroids
    asteroids.forEach(a => { a.x += a.vx; a.y += a.vy; });
    // check collisions
    for (const a of asteroids) {
      const dx = a.x - ship.x, dy = a.y - ship.y;
      if (Math.hypot(dx, dy) < a.r + ship.radius) { playBeep(100, 0.3); gameOver = true; break; }
    }
    for (const f of fuels) {
      if (f.collected) continue;
      const dx = f.x - ship.x, dy = f.y - ship.y;
      if (Math.hypot(dx, dy) < f.r + ship.radius) { f.collected = true; score += 10; }
    }
    // off‑screen check
    if (ship.x < 0 || ship.x > w || ship.y < 0 || ship.y > h) gameOver = true;
  }

  function draw() {
  // background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
  bgGrad.addColorStop(0, '#001d3a');
  bgGrad.addColorStop(1, '#000814');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);
  // starfield twinkle
  stars.forEach(s => {
    s.twinkle += (Math.random() - 0.5) * 0.05;
    if (s.twinkle < 0.3) s.twinkle = 0.3;
    if (s.twinkle > 1) s.twinkle = 1;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${s.twinkle})`;
    ctx.fill();
  });

    // ship with glow
    // draw ship trail
    if (ship.trail.length > 1) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const first = ship.trail[0];
      ctx.moveTo(first.x, first.y);
      for (let i = 1; i < ship.trail.length; i++) {
        const p = ship.trail[i];
        ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
      ctx.restore();
    }
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    // glow effect
    ctx.save();
    ctx.globalAlpha = 0.4;
    const shipGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, 12);
    shipGlow.addColorStop(0, 'rgba(255,255,255,0.6)');
    shipGlow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = shipGlow;
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // ship shape
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(-8, -6);
    ctx.lineTo(-8, 6);
    ctx.closePath();
    ctx.fillStyle = gameOver ? 'gray' : 'white';
    ctx.fill();
    ctx.restore();
    // asteroids
    ctx.fillStyle = '#8b4513'; // brownish asteroid color
    asteroids.forEach(a => {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.angle || 0);
      a.angle = (a.angle || 0) + a.rotSpeed;
      ctx.beginPath();
      ctx.arc(0, 0, a.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    // fuels
    ctx.fillStyle = 'lime';
    fuels.filter(f => !f.collected).forEach(f => { ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2); ctx.fill(); });
    // score
    ctx.fillStyle = 'white';
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '30px monospace';
      ctx.fillText('Game Over', w / 2 - 80, h / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
