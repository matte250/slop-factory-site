// Simple Celestial Drift game – enhanced graphics
// Canvas with id="game" expected in HTML
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let thrustOsc = null;
  function startThrustSound() {
    if (thrustOsc) return;
    thrustOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    thrustOsc.frequency.value = 120;
    gain.gain.value = 0.02;
    thrustOsc.connect(gain).connect(audioCtx.destination);
    thrustOsc.start();
  }
  function stopThrustSound() {
    if (thrustOsc) {
      thrustOsc.stop();
      thrustOsc.disconnect();
      thrustOsc = null;
    }
  }
  function playBeep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 600;
  // Starfield background
  const stars = [];
  const STAR_COUNT = 100;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.5,
      a: Math.random() * 0.5 + 0.5,
    });
  }

  // Ship state
  const ship = {
    x: W / 2,
    y: H / 2,
    angle: 0,
    vx: 0,
    vy: 0,
    radius: 10,
    thrust: 0.1,
    rotateSpeed: 0.07,
    damping: 0.99,
  };

  // Input handling
  const keys = { ArrowLeft: false, ArrowRight: false, Space: false };
  window.addEventListener('keydown', e => {
    if (e.code in keys) keys[e.code] = true;
    // resume audio context on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (e.code === 'Space') startThrustSound();
  });
  window.addEventListener('keyup', e => {
    if (e.code in keys) keys[e.code] = false;
    if (e.code === 'Space') stopThrustSound();
  });
  // also mouse/tap as thrust
  canvas.addEventListener('mousedown', () => { keys.Space = true; startThrustSound(); });
  canvas.addEventListener('mouseup', () => { keys.Space = false; stopThrustSound(); });
  canvas.addEventListener('touchstart', e => { e.preventDefault(); keys.Space = true; }, { passive: false });
  canvas.addEventListener('touchend', e => { e.preventDefault(); keys.Space = false; }, { passive: false });

  // Asteroids and orbs
  const asteroids = [];
  const orbs = [];
  const maxAsteroids = 8;
  const maxOrbs = 3;

  function rand(min, max) { return Math.random() * (max - min) + min; }

  function spawnAsteroid() {
    const angle = rand(0, Math.PI * 2);
    const speed = rand(0.5, 2);
    const r = rand(15, 30);
    const side = Math.floor(rand(0, 4)); // 0 top,1 right,2 bottom,3 left
    let x, y;
    if (side === 0) { x = rand(0, W); y = -r; }
    else if (side === 1) { x = W + r; y = rand(0, H); }
    else if (side === 2) { x = rand(0, W); y = H + r; }
    else { x = -r; y = rand(0, H); }
    asteroids.push({x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, r});
  }

  function spawnOrb() {
    const r = 6;
    const x = rand(r, W - r);
    const y = rand(r, H - r);
    orbs.push({x, y, r, collected: false});
  }

  // Initialize some objects
  for (let i = 0; i < maxAsteroids; i++) spawnAsteroid();
  for (let i = 0; i < maxOrbs; i++) spawnOrb();

  let score = 0;
  let gameOver = false;

  function update() {
    if (gameOver) return;
    // Ship controls
    if (keys.ArrowLeft) ship.angle -= ship.rotateSpeed;
    if (keys.ArrowRight) ship.angle += ship.rotateSpeed;
    if (keys.Space) {
      ship.vx += Math.cos(ship.angle) * ship.thrust;
      ship.vy += Math.sin(ship.angle) * ship.thrust;
    }
    // Apply damping (drift)
    ship.vx *= ship.damping;
    ship.vy *= ship.damping;
    ship.x += ship.vx;
    ship.y += ship.vy;

    // Keep ship within bounds (wrap around) – also lose condition if leaves visible area
    if (ship.x < -ship.radius || ship.x > W + ship.radius || ship.y < -ship.radius || ship.y > H + ship.radius) {
      gameOver = true;
    }

    // Update asteroids
    for (const a of asteroids) {
      a.x += a.vx;
      a.y += a.vy;
      // bounce off edges
      if (a.x < -a.r) a.x = W + a.r;
      if (a.x > W + a.r) a.x = -a.r;
      if (a.y < -a.r) a.y = H + a.r;
      if (a.y > H + a.r) a.y = -a.r;
    }

    // Collision ship-asteroid
    for (const a of asteroids) {
      const dx = ship.x - a.x, dy = ship.y - a.y;
      const dist = Math.hypot(dx, dy);
      if (dist < ship.radius + a.r) { gameOver = true; playBeep(200, 0.3); break; }
    }

    // Collect orbs
    for (const o of orbs) {
      if (o.collected) continue;
      const dx = ship.x - o.x, dy = ship.y - o.y;
if (Math.hypot(dx, dy) < ship.radius + o.r) {
          o.collected = true;
          score++;
          playBeep(600, 0.1);
          // spawn a new orb later
          setTimeout(() => {
            const idx = orbs.indexOf(o);
            if (idx !== -1) orbs.splice(idx, 1);
            spawnOrb();
          }, 0);
        }
    }
  }

  function draw() {
    // Background – dark space with stars
    ctx.fillStyle = '#020024';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    for (const s of stars) {
      ctx.globalAlpha = s.a;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Draw ship thrust flame when accelerating
    if (keys.Space) {
      ctx.save();
      ctx.translate(ship.x, ship.y);
      ctx.rotate(ship.angle);
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 15);
      grad.addColorStop(0, 'rgba(255,165,0,0.9)');
      grad.addColorStop(1, 'rgba(255,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(-12, 0);
      ctx.lineTo(-20, -6);
      ctx.lineTo(-20, 6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Draw ship
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.fillStyle = '#0ff';
    ctx.strokeStyle = '#00aaff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-8, -6);
    ctx.lineTo(-8, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Draw asteroids – irregular polygons for a rockier look
    ctx.fillStyle = '#555';
    for (const a of asteroids) {
      const points = 8;
      const variance = 0.4;
      ctx.beginPath();
      for (let i = 0; i < points; i++) {
        const theta = (i / points) * Math.PI * 2;
        const radius = a.r * (1 - variance / 2 + Math.random() * variance);
        const x = a.x + Math.cos(theta) * radius;
        const y = a.y + Math.sin(theta) * radius;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
    }

    // Draw orbs with glow
    for (const o of orbs) {
      if (o.collected) continue;
      const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r * 3);
      grad.addColorStop(0, 'rgba(0,255,255,0.8)');
      grad.addColorStop(1, 'rgba(0,255,255,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // UI – score and game over overlay
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#f00';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Start game
  requestAnimationFrame(loop);
})();
