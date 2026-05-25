// Minimal Cosmic Drift game
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;

  // Ship state
  const ship = {
    x: width / 2,
    y: height / 2,
    angle: 0,
    vx: 0,
    vy: 0,
    radius: 10,
  };

  // Game objects
  const asteroids = [];
  const orbs = [];
  let score = 0;
  let gameOver = false;

  // Settings
  const ASTEROID_COUNT = 8;
  const ORB_SPAWN_INTERVAL = 5000; // ms
  const THRUST = 0.1;
  const ROT_SPEED = 0.07;
  const MAX_SPEED = 5;

  // Star field
  const STAR_COUNT = 100;
  const stars = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: rand(0, width),
      y: rand(0, height),
      alpha: Math.random() * 0.5 + 0.5,
    });
  }

  // Helpers
  const rand = (min, max) => Math.random() * (max - min) + min;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  // Initialize asteroids
  for (let i = 0; i < ASTEROID_COUNT; i++) {
    asteroids.push({
      x: rand(0, width),
      y: rand(0, height),
      vx: rand(-1, 1),
      vy: rand(-1, 1),
      radius: rand(15, 30),
    });
  }

  // Input handling
  const keys = {};
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Simple sound factory
  function playTone(freq, duration = 0.1, type = 'sine') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function thrustSound() { playTone(300, 0.08, 'triangle'); }
  function collectSound() { playTone(600, 0.07, 'sawtooth'); }
  function crashSound() { playTone(150, 0.4, 'square'); }

  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (e.key === 'ArrowUp') {
      // resume context on first interaction
      if (audioCtx.state === 'suspended') audioCtx.resume();
      thrustSound();
    }
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // Orb spawning
  function spawnOrb() {
    orbs.push({
      x: rand(0, width),
      y: rand(0, height),
      radius: 6,
    });
  }
  setInterval(spawnOrb, ORB_SPAWN_INTERVAL);

  function update() {
    if (gameOver) return;
    // Ship controls
    if (keys.ArrowLeft) ship.angle -= ROT_SPEED;
    if (keys.ArrowRight) ship.angle += ROT_SPEED;
    if (keys.ArrowUp) {
      ship.vx += Math.cos(ship.angle) * THRUST;
      ship.vy += Math.sin(ship.angle) * THRUST;
    }
    // Clamp speed
    const speed = Math.hypot(ship.vx, ship.vy);
    if (speed > MAX_SPEED) {
      ship.vx *= MAX_SPEED / speed;
      ship.vy *= MAX_SPEED / speed;
    }
    // Move ship
    ship.x = (ship.x + ship.vx + width) % width;
    ship.y = (ship.y + ship.vy + height) % height;

    // Move asteroids
    for (const a of asteroids) {
      a.x = (a.x + a.vx + width) % width;
      a.y = (a.y + a.vy + height) % height;
    }

    // Twinkle stars
    for (const s of stars) {
      s.alpha += (Math.random() - 0.5) * 0.02;
      if (s.alpha < 0.2) s.alpha = 0.2;
      if (s.alpha > 1) s.alpha = 1;
    }

    // Collision ship‑asteroid
    for (const a of asteroids) {
      if (dist(ship, a) < ship.radius + a.radius) {
        crashSound();
        gameOver = true;
        break;
      }
    }

    // Collision ship‑orb
    for (let i = orbs.length - 1; i >= 0; i--) {
      if (dist(ship, orbs[i]) < ship.radius + orbs[i].radius) {
        collectSound();
        score++;
        orbs.splice(i, 1);
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // Stars background with parallax
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    // draw stars
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.globalAlpha = s.alpha;
      ctx.fillRect(s.x, s.y, 2, 2);
    }
    ctx.globalAlpha = 1;

    // Draw ship with gradient
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    const grd = ctx.createLinearGradient(-12, 0, 12, 0);
    grd.addColorStop(0, '#0f0');
    grd.addColorStop(1, '#060');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-8, -6);
    ctx.lineTo(-8, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-8, -6);
    ctx.lineTo(-8, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Draw asteroids with irregular shapes
    for (const a of asteroids) {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(Math.random() * Math.PI * 2);
      ctx.fillStyle = '#555';
      ctx.beginPath();
      const sides = Math.floor(rand(5,9));
      for (let i=0;i<sides;i++){
        const angle = (i/sides)*Math.PI*2;
        const r = a.radius * (0.6 + Math.random()*0.4);
        ctx.lineTo(Math.cos(angle)*r, Math.sin(angle)*r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Draw orbs
    ctx.fillStyle = '#ff0';
    for (const o of orbs) {
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
