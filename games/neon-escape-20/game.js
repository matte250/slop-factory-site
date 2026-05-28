// game.js – simple Neon Escape prototype
// Canvas with id="game" expected in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Sound manager using Web Audio API
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  let boostOsc = null;
  function beep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function startBoostSound() {
    if (boostOsc) return;
    boostOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    boostOsc.frequency.value = 200;
    boostOsc.type = 'square';
    boostOsc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    boostOsc.start();
  }
  function stopBoostSound() {
    if (!boostOsc) return;
    boostOsc.stop();
    boostOsc.disconnect();
    boostOsc = null;
  }
  const W = (canvas.width = canvas.clientWidth || 800);
  const H = (canvas.height = canvas.clientHeight || 600);

  // Player ship
  const ship = {
    // Trail of recent positions for motion blur
    trail: [],
    x: W / 2,
    y: H - 80,
    angle: -Math.PI / 2,
    speed: 0,
    maxSpeed: 4,
    turnSpeed: 0.04,
    boost: 0.1,
    fuel: 100,
    radius: 12,
  };

  // Obstacles, orbs, and starfield
  const obstacles = [];
  const orbs = [];
  // Starfield background
  const stars = [];
  const STAR_COUNT = 80;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      radius: Math.random() * 1.5 + 0.5,
      speed: 0.3 + Math.random() * 0.7,
    });
  }
  const OBSTACLE_FREQ = 120; // frames
  const ORB_FREQ = 200; // frames
  let frame = 0;
  let alive = true;

  function addObstacle() {
    const size = 30 + Math.random() * 40;
    const x = Math.random() * W;
    const y = -size;
    const speed = 1 + Math.random() * 2;
    const rot = (Math.random() - 0.5) * 0.02;
    obstacles.push({ x, y, size, speed, rot, angle: 0 });
  }

  function addOrb() {
    const r = 6;
    const x = Math.random() * W;
    const y = -r;
    const speed = 1.5;
    orbs.push({ x, y, r, speed });
  }

  function update() {
    if (!alive) return;
    // Controls
    if (keys['ArrowLeft']) ship.angle -= ship.turnSpeed;
    if (keys['ArrowRight']) ship.angle += ship.turnSpeed;
    if (keys['Space']) { // boost
      ship.speed = Math.min(ship.maxSpeed, ship.speed + ship.boost);
    } else {
      ship.speed *= 0.98; // drag
    }
    // Fuel consumption
    ship.fuel -= 0.05 + ship.speed * 0.01;
    if (ship.fuel <= 0) { beep(200,0.3); endGame(); }

    // Move ship
    ship.x += Math.cos(ship.angle) * ship.speed;
    ship.y += Math.sin(ship.angle) * ship.speed;
    // Keep within bounds
    ship.x = Math.max(ship.radius, Math.min(W - ship.radius, ship.x));
    ship.y = Math.max(ship.radius, Math.min(H - ship.radius, ship.y));

    // Record trail for motion blur
    ship.trail.push({ x: ship.x, y: ship.y });
    if (ship.trail.length > 12) ship.trail.shift();

    // Update starfield
    stars.forEach(s => {
      s.y += s.speed;
      if (s.y > H) {
        s.y = 0;
        s.x = Math.random() * W;
      }
    });

    // Obstacles
    obstacles.forEach(o => {
      o.y += o.speed;
      o.angle += o.rot;
    });
    // Remove off‑screen
    while (obstacles.length && obstacles[0].y - obstacles[0].size > H) obstacles.shift();

    // Orbs
    orbs.forEach(o => { o.y += o.speed; });
    while (orbs.length && orbs[0].y - orbs[0].r > H) orbs.shift();

    // Collisions
    obstacles.forEach(o => {
      const dx = ship.x - o.x;
      const dy = ship.y - o.y;
      const dist = Math.hypot(dx, dy);
      if (dist < ship.radius + o.size / 2) { beep(100,0.4); endGame(); }
    });
    for (let i = orbs.length - 1; i >= 0; i--) {
      const o = orbs[i];
      const dx = ship.x - o.x;
      const dy = ship.y - o.y;
      if (Math.hypot(dx, dy) < ship.radius + o.r) {
        ship.fuel = Math.min(100, ship.fuel + 20);
        orbs.splice(i, 1);
      }
    }

    if (frame++ % OBSTACLE_FREQ === 0) addObstacle();
    if (frame % ORB_FREQ === 0) addOrb();
  }

  function draw() {
    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#001');
    bg.addColorStop(1, '#004');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Starfield
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 0.8;
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Motion blur trail
    ctx.save();
    ctx.globalAlpha = 0.6;
    ship.trail.forEach((p, i) => {
      const alpha = (i + 1) / ship.trail.length * 0.6;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#0ff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, ship.radius * 0.4, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
    // Ship with neon glow
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#0ff';
    ctx.fillStyle = '#0ff';
    ctx.beginPath();
    ctx.moveTo(-ship.radius, ship.radius);
    ctx.lineTo(ship.radius, ship.radius);
    ctx.lineTo(0, -ship.radius);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.shadowBlur = 0;

    // Obstacles with neon glow
    obstacles.forEach(o => {
      ctx.save();
      ctx.translate(o.x, o.y);
      ctx.rotate(o.angle);
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#f0f';
      ctx.fillStyle = '#f0f';
      ctx.fillRect(-o.size / 2, -o.size / 2, o.size, o.size);
      ctx.restore();
    });
    ctx.shadowBlur = 0;

    // Orbs with subtle glow
    ctx.shadowBlur = 6;
    ctx.shadowColor = '#ff0';
    ctx.fillStyle = '#ff0';
    orbs.forEach(o => {
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;

    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Fuel: ${Math.floor(ship.fuel)}`, 10, 20);
  }

  function loop() {
    update();
    draw();
    if (alive) requestAnimationFrame(loop);
  }

  function endGame() {
    alive = false;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#f88';
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', W / 2, H / 2);
  }

  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    // Resume audio on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (e.key === 'Space') startBoostSound();
  });
  window.addEventListener('keyup', e => {
    keys[e.key] = false;
    if (e.key === 'Space') stopBoostSound();
  });

  // Start
  loop();
})();
