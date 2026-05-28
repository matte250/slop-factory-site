// Minimal Canvas Constellation Chase game
// Canvas with id "game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.start(now);
    osc.stop(now + duration);
  }
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;
  // Additional graphics settings
  const STAR_COUNT = 120;
  const stars = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5 + 0.5,
    });
  }

  // ------- Game constants -------
  const SHIP_SIZE = 20;
  const SHIP_SPEED = 4;
  const TOKEN_COUNT = 5;
  const CLOUD_COUNT = 3;
  const CONSTELLATION_DENSITY = 0.02; // probability per pixel per frame
  const FRAME_RATE = 60;
  const GAME_TIME = 45; // seconds

  // ------- Game state -------
  let ship = { x: width / 2, y: height - 50, dx: 0, dy: 0 };
  let tokens = [];
  let clouds = [];
  let constellations = [];
  let collected = 0;
  let timeLeft = GAME_TIME;
  let running = true;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    // resume audio context on first interaction
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnToken() {
    const x = Math.random() * width;
    const y = Math.random() * height * 0.5; // top half
    tokens.push({ x, y, r: 8 });
  }

  function spawnCloud() {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const r = 30 + Math.random() * 20;
    const vx = -1 - Math.random() * 2;
    const vy = (Math.random() - 0.5) * 0.5;
    clouds.push({ x, y, r, vx, vy });
  }

  function addConstellation() {
    // create a cluster of points
    const points = [];
    const count = 5 + Math.floor(Math.random() * 5);
    const baseX = Math.random() * width;
    const baseY = Math.random() * height;
    for (let i = 0; i < count; i++) {
      points.push({
        x: baseX + (Math.random() - 0.5) * 80,
        y: baseY + (Math.random() - 0.5) * 80,
      });
    }
    constellations.push({ points, vx: -0.5 - Math.random() * 1 });
  }

  // Initialize tokens and clouds
  for (let i = 0; i < TOKEN_COUNT; i++) spawnToken();
  for (let i = 0; i < CLOUD_COUNT; i++) spawnCloud();
  for (let i = 0; i < 8; i++) addConstellation();

  // Helper utils
  function rectCircleCollision(cx, cy, r, rx, ry, rw, rh) {
    const distX = Math.abs(cx - rx - rw / 2);
    const distY = Math.abs(cy - ry - rh / 2);
    if (distX > rw / 2 + r) return false;
    if (distY > rh / 2 + r) return false;
    if (distX <= rw / 2) return true;
    if (distY <= rh / 2) return true;
    const dx = distX - rw / 2;
    const dy = distY - rh / 2;
    return dx * dx + dy * dy <= r * r;
  }

  function update(dt) {
    if (!running) return;
    // ship movement
    ship.dx = 0; ship.dy = 0;
    if (keys['ArrowLeft'] || keys['a']) ship.dx = -SHIP_SPEED;
    if (keys['ArrowRight'] || keys['d']) ship.dx = SHIP_SPEED;
    if (keys['ArrowUp'] || keys['w']) ship.dy = -SHIP_SPEED;
    if (keys['ArrowDown'] || keys['s']) ship.dy = SHIP_SPEED;
    ship.x = Math.max(0, Math.min(width, ship.x + ship.dx));
    ship.y = Math.max(0, Math.min(height, ship.y + ship.dy));

    // clouds movement and collision
    for (let i = clouds.length - 1; i >= 0; i--) {
      const c = clouds[i];
      c.x += c.vx; c.y += c.vy;
      if (c.x + c.r < 0) clouds.splice(i, 1), spawnCloud();
      // ship-cloud collision
if (rectCircleCollision(ship.x, ship.y, SHIP_SIZE / 2, c.x - c.r, c.y - c.r, c.r * 2, c.r * 2)) {
          running = false; // lose
          playTone(100, 0.5);
          alert('You were hit by a nebula cloud! Game over.');
        }
    }

    // token collection
    for (let i = tokens.length - 1; i >= 0; i--) {
      const t = tokens[i];
      const dx = ship.x - t.x;
      const dy = ship.y - t.y;
      if (Math.hypot(dx, dy) < SHIP_SIZE / 2 + t.r) {
        tokens.splice(i, 1);
        collected++;
        if (collected >= TOKEN_COUNT) {
          running = false;
          alert('All tokens collected – you win!');
        } else {
          spawnToken();
        }
      }
    }

    // constellations scroll left
    constellations.forEach(c => c.points.forEach(p => p.x += c.vx));
    // remove off‑screen constellations and add new ones
    if (Math.random() < 0.02) addConstellation();

    // timer
    timeLeft -= dt;
    if (timeLeft <= 0) {
      running = false;
      alert('Time is up! Game over.');
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // draw space gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#001020');
    bgGrad.addColorStop(1, '#000010');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // draw stars
    ctx.fillStyle = 'white';
    ctx.shadowColor = 'white';
    ctx.shadowBlur = 2;
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0; // reset
    // draw constellations
// draw constellations with subtle glow
      ctx.strokeStyle = 'rgba(100,150,255,0.6)';
      ctx.lineWidth = 1.2;
      ctx.shadowColor = 'rgba(100,150,255,0.8)';
      ctx.shadowBlur = 4;
      constellations.forEach(c => {
        const pts = c.points;
        // draw lines between each pair
        for (let i = 0; i < pts.length; i++) {
          for (let j = i + 1; j < pts.length; j++) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.stroke();
          }
          // draw point with glow
          ctx.fillStyle = '#aaf';
          ctx.beginPath();
          ctx.arc(pts[i].x, pts[i].y, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      ctx.shadowBlur = 0; // reset shadow
    // draw tokens
    // draw tokens with radial glow
    const tokenGrad = ctx.createRadialGradient(0,0,0,0,0,10);
    tokenGrad.addColorStop(0, 'rgba(255,215,0,0.9)');
    tokenGrad.addColorStop(1, 'rgba(255,165,0,0.2)');
    ctx.fillStyle = tokenGrad;
    tokens.forEach(t => {
      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.beginPath();
      ctx.arc(0,0,t.r+4,0,Math.PI*2);
      ctx.fill();
      ctx.restore();
    });
    // draw clouds
    ctx.fillStyle = 'rgba(150,0,150,0.5)';
    clouds.forEach(c => {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // draw ship
    ctx.save();
    ctx.translate(ship.x, ship.y);
    // ship with glowing gradient
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, SHIP_SIZE);
    grad.addColorStop(0, 'rgba(0,255,150,0.9)');
    grad.addColorStop(1, 'rgba(0,100,80,0.3)');
    ctx.fillStyle = grad;
    ctx.shadowColor = 'rgba(0,255,150,0.7)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(0, -SHIP_SIZE / 2);
    ctx.lineTo(SHIP_SIZE / 2, SHIP_SIZE / 2);
    ctx.lineTo(-SHIP_SIZE / 2, SHIP_SIZE / 2);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
    // UI: timer and score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Time: ${Math.ceil(timeLeft)}`, 10, 20);
    ctx.fillText(`Tokens: ${collected}/${TOKEN_COUNT}`, 10, 40);
  }

  let last = performance.now();
  function loop(now) {
    const dt = (now - last) / 1000; // seconds
    last = now;
    update(dt);
    draw();
    if (running) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
