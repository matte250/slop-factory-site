// Simple Orbit Escape game – improved graphics
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.clientWidth || 800;
  const h = canvas.height = canvas.clientHeight || 600;
  const cx = w / 2, cy = h / 2;

  // Game parameters
  const ship = { angle: 0, radius: 120, speed: 0.02, fuel: 100 };
  const fuelCells = [];
  const asteroids = [];
  const maxFuel = 5, maxAst = 5;
  const stars = [];

  // Helper to spawn items
  const rand = (min, max) => Math.random() * (max - min) + min;
  // generate background stars
  for (let i = 0; i < 100; i++) {
    stars.push({ x: rand(0, w), y: rand(0, h), r: rand(0.5, 2) });
  }
  for (let i = 0; i < maxFuel; i++) {
    const a = rand(0, Math.PI * 2);
    const r = rand(80, 180);
    fuelCells.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, collected: false });
  }
  for (let i = 0; i < maxAst; i++) {
    const a = rand(0, Math.PI * 2);
    const r = rand(150, 250);
    const vx = rand(-0.5, 0.5);
    const vy = rand(-0.5, 0.5);
    // give each asteroid a simple polygon shape
    const points = [];
    const sides = Math.floor(rand(5, 9));
    const size = rand(8, 14);
    for (let s = 0; s < sides; s++) {
      const angle = (s / sides) * Math.PI * 2 + rand(-0.2, 0.2);
      points.push({ x: Math.cos(angle) * size, y: Math.sin(angle) * size });
    }
    asteroids.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, vx, vy, points });
  }

  function update() {
    // ship controls
    if (keys['ArrowLeft']) ship.angle -= ship.speed;
    if (keys['ArrowRight']) ship.angle += ship.speed;
    ship.fuel -= 0.02; // fuel consumption
    if (ship.fuel <= 0) gameOver('Out of fuel');

    // collect fuel
    const sx = cx + Math.cos(ship.angle) * ship.radius;
    const sy = cy + Math.sin(ship.angle) * ship.radius;
    fuelCells.forEach(fc => {
      if (!fc.collected && Math.hypot(fc.x - sx, fc.y - sy) < 15) {
        fc.collected = true;
        ship.fuel = Math.min(ship.fuel + 30, 100);
        // Play collect fuel tone
        playTone(660, 0.1);
      }
    });

    // move asteroids
    asteroids.forEach(a => {
      a.x += a.vx; a.y += a.vy;
      // bounce off bounds
      if (a.x < 0 || a.x > w) a.vx *= -1;
      if (a.y < 0 || a.y > h) a.vy *= -1;
      // collision with ship
      if (Math.hypot(a.x - sx, a.y - sy) < 12) gameOver('Hit an asteroid');
    });
  }

  function draw() {
    // background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    // stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // planet with gradient
    const grad = ctx.createRadialGradient(cx, cy, 30, cx, cy, 50);
    grad.addColorStop(0, '#557');
    grad.addColorStop(1, '#113');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(cx, cy, 50, 0, Math.PI * 2); ctx.fill();
    // ship as a triangle pointing forward
    const sx = cx + Math.cos(ship.angle) * ship.radius;
    const sy = cy + Math.sin(ship.angle) * ship.radius;
    const shipSize = 10;
    const tip = { x: sx + Math.cos(ship.angle) * shipSize, y: sy + Math.sin(ship.angle) * shipSize };
    const left = { x: sx + Math.cos(ship.angle + Math.PI * 0.75) * shipSize, y: sy + Math.sin(ship.angle + Math.PI * 0.75) * shipSize };
    const right = { x: sx + Math.cos(ship.angle - Math.PI * 0.75) * shipSize, y: sy + Math.sin(ship.angle - Math.PI * 0.75) * shipSize };
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(tip.x, tip.y);
    ctx.lineTo(left.x, left.y);
    ctx.lineTo(right.x, right.y);
    ctx.closePath();
    ctx.fill();
    // fuel cells
    ctx.fillStyle = '#ff0';
    fuelCells.forEach(fc => {
      if (!fc.collected) {
        ctx.beginPath(); ctx.arc(fc.x, fc.y, 5, 0, Math.PI * 2); ctx.fill();
      }
    });
    // asteroids as polygons
    ctx.fillStyle = '#a33';
    asteroids.forEach(a => {
      ctx.beginPath();
      a.points.forEach((p, i) => {
        const px = a.x + p.x;
        const py = a.y + p.y;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      });
      ctx.closePath();
      ctx.fill();
    });
    // fuel bar overlay
    ctx.fillStyle = '#555';
    ctx.fillRect(10, 10, 100, 10);
    ctx.fillStyle = '#0f0';
    ctx.fillRect(10, 10, ship.fuel, 10);
    ctx.strokeStyle = '#000';
    ctx.strokeRect(10, 10, 100, 10);
  }

  function loop() {
    update();
    draw();
    animId = requestAnimationFrame(loop);
  }

  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // Sound handling using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio context is resumed on user interaction (required by browsers)
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  window.addEventListener('click', resumeAudio);
  window.addEventListener('keydown', resumeAudio);

  function playTone(freq, duration = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  function gameOver(msg) {
    // Play crash sound
    playTone(150, 0.3);
    alert(msg);
    cancelAnimationFrame(animId);
  }

  let animId = requestAnimationFrame(loop);
})();
