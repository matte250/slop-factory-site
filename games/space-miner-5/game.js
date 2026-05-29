// Simple Space Miner game
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;
  // Audio context for sound effects (created on first user interaction)
  let audioCtx;
  function getAudioCtx(){
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
  }
  function beep(freq, duration){
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }
  function playLaser(){ beep(800, 0.07); }
  function playHit(){ beep(200, 0.2); }
  function playGameOver(){ beep(100, 0.5); }
  // Ensure audio context is resumed on first interaction
  window.addEventListener('keydown', () => { if (audioCtx) audioCtx.resume(); }, { once: true });

  // ---- Game objects ----
  const ship = {
    x: width / 2,
    y: height / 2,
    vx: 0,
    vy: 0,
    angle: 0,
    radius: 12,
    shield: 100,
  };

  const asteroids = [];
  const lasers = [];
  const stars = [];
  const ASTEROID_COUNT = 8;
  // generate starfield background
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 2 + 0.5,
    });
  }
  // helper to create irregular asteroid shape
  function createAsteroid(x, y, r) {
    const points = [];
    const vertexCount = 8 + Math.floor(Math.random() * 5);
    for (let i = 0; i < vertexCount; i++) {
      const angle = (Math.PI * 2 / vertexCount) * i;
      const offset = (Math.random() * 0.4 + 0.8) * r;
      points.push({
        x: Math.cos(angle) * offset,
        y: Math.sin(angle) * offset,
      });
    }
    return { x, y, vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2, r, points };
  }
  for (let i = 0; i < ASTEROID_COUNT; i++) {
    const r = 20 + Math.random() * 30;
    asteroids.push(createAsteroid(Math.random() * width, Math.random() * height, r));
  }

  const keys = {};
  window.addEventListener('keydown', e => keys[e.key] = true);
  window.addEventListener('keyup', e => keys[e.key] = false);

  function thrust() {
    const force = 0.1;
    // reset thrust flag
    ship.thrusting = false;
    if (keys['ArrowUp'] || keys['w']) {
      ship.vx += Math.cos(ship.angle) * force;
      ship.vy += Math.sin(ship.angle) * force;
      ship.thrusting = true;
    }
    if (keys['ArrowLeft'] || keys['a']) ship.angle -= 0.05;
    if (keys['ArrowRight'] || keys['d']) ship.angle += 0.05;
  }

  function fireLaser() {
    // create a laser projectile
    lasers.push({
      x: ship.x,
      y: ship.y,
      angle: ship.angle,
      life: 30, // frames remaining
    });
  }

  let lastFire = 0;
  function handleInput(dt) {
    thrust();
    if ((keys[' '] || keys['Space']) && performance.now() - lastFire > 200) {
      fireLaser();
      lastFire = performance.now();
    }
  }

  function update(dt) {
    // move ship
    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;
    // screen wrap
    if (ship.x < 0) ship.x += width; else if (ship.x > width) ship.x -= width;
    if (ship.y < 0) ship.y += height; else if (ship.y > height) ship.y -= height;
    // friction
    ship.vx *= 0.99; ship.vy *= 0.99;

    // move asteroids
    asteroids.forEach(a => {
      a.x += a.vx * dt; a.y += a.vy * dt;
      if (a.x < 0) a.x += width; else if (a.x > width) a.x -= width;
      if (a.y < 0) a.y += height; else if (a.y > height) a.y -= height;
    });

    // move lasers, handle lifetime, and asteroid collisions
    lasers.forEach((l, li) => {
      const speed = 6;
      l.x += Math.cos(l.angle) * speed * dt;
      l.y += Math.sin(l.angle) * speed * dt;
      l.life -= 1;
      // check collision with asteroids
      for (let ai = asteroids.length - 1; ai >= 0; ai--) {
        const a = asteroids[ai];
        const dx = a.x - l.x;
        const dy = a.y - l.y;
        const dist = Math.hypot(dx, dy);
        if (dist < a.r) {
          // destroy asteroid and laser
          asteroids.splice(ai, 1);
          l.life = 0;
          break;
        }
      }
      if (l.life <= 0 || l.x < 0 || l.x > width || l.y < 0 || l.y > height) {
        lasers.splice(li, 1);
      }
    });

    // collision detection
    asteroids.forEach(a => {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.r + ship.radius) {
        ship.shield -= 20;
        // push ship out slightly
        const angle = Math.atan2(dy, dx);
        ship.x -= Math.cos(angle) * 5; ship.y -= Math.sin(angle) * 5;
      }
    });
  }

  function drawShip() {
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    // ship hull
    ctx.beginPath();
    ctx.moveTo(ship.radius, 0);
    ctx.lineTo(-ship.radius, ship.radius / 2);
    ctx.lineTo(-ship.radius, -ship.radius / 2);
    ctx.closePath();
    ctx.fillStyle = '#0af';
    ctx.fill();
    // thrust flame
    if (ship.thrusting) {
      ctx.beginPath();
      ctx.moveTo(-ship.radius, 0);
      ctx.lineTo(-ship.radius - 6, ship.radius / 2);
      ctx.lineTo(-ship.radius - 4, 0);
      ctx.lineTo(-ship.radius - 6, -ship.radius / 2);
      ctx.closePath();
      ctx.fillStyle = 'orange';
      ctx.fill();
    }
    ctx.restore();
  }

  function draw() {
    // dark space background with subtle gradient
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#001020');
    grad.addColorStop(1, '#000010');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    // starfield – small white circles with slight flicker
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.globalAlpha = Math.random() * 0.5 + 0.5;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    // asteroids – draw irregular polygons
    ctx.strokeStyle = '#777';
    ctx.fillStyle = '#555';
    asteroids.forEach(a => {
      ctx.beginPath();
      a.points.forEach((p, i) => {
        const px = a.x + p.x;
        const py = a.y + p.y;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });
    // lasers – bright orange lines with fade
    ctx.strokeStyle = 'rgba(255,140,0,0.9)';
    ctx.lineWidth = 2;
    lasers.forEach(l => {
      ctx.beginPath();
      ctx.moveTo(l.x, l.y);
      const len = 15;
      const endX = l.x + Math.cos(l.angle) * len;
      const endY = l.y + Math.sin(l.angle) * len;
      ctx.lineTo(endX, endY);
      ctx.stroke();
    });
    ctx.lineWidth = 1;
    // ship
    drawShip();
    // shield bar
    ctx.fillStyle = '#0f0';
    ctx.fillRect(10, 10, ship.shield, 8);
    ctx.strokeStyle = '#555';
    ctx.strokeRect(10, 10, 100, 8);
  }

  let last = performance.now();
  function loop() {
    const now = performance.now();
    const dt = (now - last) / 16; // normalized to ~60fps steps
    last = now;
    handleInput(dt);
    update(dt);
    draw();
    if (ship.shield > 0) requestAnimationFrame(loop);
    else {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', width / 2 - 80, height / 2);
    }
  }
  requestAnimationFrame(loop);
})();
