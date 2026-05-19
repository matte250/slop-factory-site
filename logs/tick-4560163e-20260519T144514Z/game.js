// Simple top‑down rescue game (Cosmic Rescue)
// Canvas with id="game" must exist in the page.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 600;
  // Game state will be defined after audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration=0.1) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  };
  const playCollision = () => playTone(150);
  const playRescue = () => playTone(440);
  // Re-initialize state after audio setup
  const state = {
    ship: { x: W / 2, y: H - 50, w: 30, h: 30, speed: 4 },
    asteroids: [],
    astronauts: [],
    score: 0,
    lives: 3,
    keys: {},
    over: false,
  };
    ship: { x: W / 2, y: H - 50, w: 30, h: 30, speed: 4 },
    asteroids: [],
    astronauts: [],
    score: 0,
    lives: 3,
    keys: {},
    over: false,
  };
  // Input handling
  window.addEventListener('keydown', e => (state.keys[e.key] = true));
  window.addEventListener('keyup', e => (state.keys[e.key] = false));
  // Helpers
  const rand = (min, max) => Math.random() * (max - min) + min;
  const addAsteroid = () => {
    const size = rand(20, 50);
    state.asteroids.push({ x: rand(0, W - size), y: -size, r: size / 2, speed: rand(1, 3) });
  };
  const addAstronaut = () => {
    const size = 15;
    state.astronauts.push({ x: rand(0, W - size), y: -size, r: size / 2, speed: rand(0.5, 1.5) });
  };
  // Collision utilities
  const circleRectCollision = (c, r) => {
    const cx = c.x, cy = c.y, cr = c.r;
    const rx = r.x, ry = r.y, rw = r.w, rh = r.h;
    const nearestX = Math.max(rx, Math.min(cx, rx + rw));
    const nearestY = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - nearestX, dy = cy - nearestY;
    return dx * dx + dy * dy < cr * cr;
  };
  const rectRectCollision = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  // Stars for background
  const stars = Array.from({length: 100}, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.5 }));

  // Game loop
  let frame = 0;
  const loop = () => {
    if (state.over) { drawGameOver(); return; }
    update();
    draw();
    requestAnimationFrame(loop);
  };
  const update = () => {
    // Move background stars
    stars.forEach(st => { st.y += 0.5; if (st.y > H) { st.y = 0; st.x = Math.random() * W; } });
    // Ship movement
    const s = state.ship;
    if (state.keys['ArrowLeft']) s.x -= s.speed;
    if (state.keys['ArrowRight']) s.x += s.speed;
    if (state.keys['ArrowUp']) s.y -= s.speed;
    if (state.keys['ArrowDown']) s.y += s.speed;
    s.x = Math.max(0, Math.min(W - s.w, s.x));
    s.y = Math.max(0, Math.min(H - s.h, s.y));
    // Spawn objects
    if (frame % 80 === 0) addAsteroid();
    if (frame % 150 === 0) addAstronaut();
    // Move asteroids
    state.asteroids.forEach(a => a.y += a.speed);
    state.asteroids = state.asteroids.filter(a => a.y - a.r < H);
    // Move astronauts
    state.astronauts.forEach(a => a.y += a.speed);
    state.astronauts = state.astronauts.filter(a => a.y - a.r < H);
    // Collisions: ship vs asteroids
    for (const a of state.asteroids) {
      if (circleRectCollision({x:a.x+a.r, y:a.y+a.r, r:a.r}, s)) {
        state.lives--;
        // remove asteroid
        state.asteroids = state.asteroids.filter(x => x !== a);
        if (state.lives <= 0) { state.over = true; }
      }
    }
    // Ship rescues astronauts (collision)
    for (const ast of state.astronauts) {
      if (circleRectCollision({x:ast.x+ast.r, y:ast.y+ast.r, r:ast.r}, s)) {
        state.score += 10;
        state.astronauts = state.astronauts.filter(x => x !== ast);
      }
    }
    frame++;
  };
  const draw = () => {
    // background
    ctx.fillStyle = '#000020';
    ctx.fillRect(0,0,W,H);
    // stars (twinkling)
    ctx.fillStyle = 'white';
    stars.forEach(st => {
      // random flicker effect
      const radius = st.r * (0.8 + Math.random() * 0.4);
      ctx.beginPath();
      ctx.arc(st.x, st.y, radius, 0, Math.PI * 2);
      ctx.fill();
    });
    // ship (gradient triangle)
    const s = state.ship;
    const shipGrad = ctx.createLinearGradient(s.x, s.y, s.x, s.y + s.h);
    shipGrad.addColorStop(0, '#00aaff');
    shipGrad.addColorStop(1, '#0044aa');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(s.x + s.w / 2, s.y);
    ctx.lineTo(s.x, s.y + s.h);
    ctx.lineTo(s.x + s.w, s.y + s.h);
    ctx.closePath();
    ctx.fill();
    // asteroids (gradient circles)
    for (const a of state.asteroids) {
      const grad = ctx.createRadialGradient(a.x + a.r, a.y + a.r, a.r * 0.3, a.x + a.r, a.y + a.r, a.r);
      grad.addColorStop(0, '#777777');
      grad.addColorStop(1, '#333333');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.r, a.y + a.r, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // astronauts (gradient circles)
    for (const a of state.astronauts) {
      const grad = ctx.createRadialGradient(a.x + a.r, a.y + a.r, a.r * 0.3, a.x + a.r, a.y + a.r, a.r);
      grad.addColorStop(0, '#aaffaa');
      grad.addColorStop(1, '#227722');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.r, a.y + a.r, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // HUD
    ctx.fillStyle = 'black';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${state.score}`, 10, 20);
    ctx.fillText(`Lives: ${state.lives}`, 10, 40);
  };
  const drawGameOver = () => {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.font = '32px sans-serif';
    ctx.fillText('Game Over', W/2, H/2 - 20);
    ctx.font = '24px sans-serif';
    ctx.fillText(`Score: ${state.score}`, W/2, H/2 + 20);
  };
  // start loop
  requestAnimationFrame(loop);
})();
