// Minimal Orbit Escape game for canvas#game
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Audio context for simple tones
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = freq;
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    oscillator.start();
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + duration);
  }
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 600;
  const CENTER = { x: W / 2, y: H / 2 };
  const PLANET_R = 40;

  // Ship state
  const ship = {
    x: CENTER.x,
    y: CENTER.y - PLANET_R - 30,
    vx: 0,
    vy: 0,
    angle: -Math.PI / 2,
    thrust: 0.2,
    size: 12
  };

  // Simple gravity toward planet centre
  const G = 0.05;

  // Asteroids drift outward
  const asteroids = [];
  const AST_COUNT = 8;
  for (let i = 0; i < AST_COUNT; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = PLANET_R + 80 + Math.random() * 120;
    asteroids.push({
      x: CENTER.x + Math.cos(angle) * radius,
      y: CENTER.y + Math.sin(angle) * radius,
      vx: Math.cos(angle) * 0.5,
      vy: Math.sin(angle) * 0.5,
      r: 10 + Math.random() * 5
    });
  }
  // Stars background
  const stars = [];
  const STAR_COUNT = 100;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.5
    });
  }

  // Input handling
  const keys = {};
  let audioStarted = false;
  const ensureAudio = () => {
    if (!audioStarted) {
      audioCtx.resume();
      audioStarted = true;
    }
  };
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    ensureAudio();
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function update() {
    // Apply thrust
    if (keys.ArrowUp) {
      ship.vx += Math.cos(ship.angle) * ship.thrust;
      ship.vy += Math.sin(ship.angle) * ship.thrust;
      playTone(500, 0.05);
    }
    if (keys.ArrowLeft) ship.angle -= 0.04;
    if (keys.ArrowRight) ship.angle += 0.04;

    // Gravity
    const dx = CENTER.x - ship.x;
    const dy = CENTER.y - ship.y;
    const dist = Math.hypot(dx, dy);
    const gax = (dx / dist) * G;
    const gay = (dy / dist) * G;
    ship.vx += gax;
    ship.vy += gay;

    ship.x += ship.vx;
    ship.y += ship.vy;

    // Update asteroids
    for (const a of asteroids) {
      a.x += a.vx;
      a.y += a.vy;
    }
  }

  function draw() {
    // Background
    ctx.fillStyle = '#000011';
    ctx.fillRect(0, 0, W, H);
    // Stars
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Planet with gradient
    const grad = ctx.createRadialGradient(CENTER.x, CENTER.y, PLANET_R * 0.2, CENTER.x, CENTER.y, PLANET_R);
    grad.addColorStop(0, '#777');
    grad.addColorStop(1, '#111');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(CENTER.x, CENTER.y, PLANET_R, 0, Math.PI * 2);
    ctx.fill();
    // Ship (triangle) with outline
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.beginPath();
    ctx.moveTo(ship.size, 0);
    ctx.lineTo(-ship.size / 2, ship.size / 2);
    ctx.lineTo(-ship.size / 2, -ship.size / 2);
    ctx.closePath();
    ctx.fillStyle = '#0f0';
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#fff';
    ctx.stroke();
    ctx.restore();
    // Asteroids with subtle shading
    for (const a of asteroids) {
      const gradA = ctx.createRadialGradient(a.x, a.y, a.r * 0.3, a.x, a.y, a.r);
      gradA.addColorStop(0, '#c96');
      gradA.addColorStop(1, '#633');
      ctx.fillStyle = gradA;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function checkCollisions() {
    // Ship vs planet
    const dPlanet = Math.hypot(ship.x - CENTER.x, ship.y - CENTER.y);
    if (dPlanet <= PLANET_R + ship.size) {
      playTone(200, 0.3); // collision tone
      return true;
    }
    // Ship vs asteroids
    for (const a of asteroids) {
      const d = Math.hypot(ship.x - a.x, ship.y - a.y);
      if (d <= a.r + ship.size) {
        playTone(200, 0.3);
        return true;
      }
    }
    return false;
  }

  function loop() {
    update();
    if (checkCollisions()) {
      alert('Game Over');
      return; // stop animation
    }
    draw();
    requestAnimationFrame(loop);
  }

  // Start game
  requestAnimationFrame(loop);
})();
