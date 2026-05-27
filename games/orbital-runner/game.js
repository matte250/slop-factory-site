// Orbital Runner – concise canvas game
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // safety
  const ctx = canvas.getContext('2d');
  const W = canvas.width = 800;
  const H = canvas.height = 400;
  // generate static starfield
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.5 + 0.5 });
  }

  // ship
  const ship = { x: 80, y: H / 2, w: 20, h: 12, vy: 0 };
  const SPEED = 0.4;

  // obstacles & collectibles
  const asteroids = [];
  const orbs = [];
  const SPAWN_RATE = 90; // frames
  let frame = 0;
  let score = 0;
  let timeLeft = 30; // seconds
  const start = Date.now();

  // input and sound
  const keys = {};
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playThrust() { beep(300, 0.05); }
  function playCollect() { beep(600, 0.07); }
  function playHit() { beep(100, 0.2); }
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    // resume audio context on first user interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'ArrowDown' || e.key === 's') playThrust();
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawn() {
    // asteroid
    const r = 15 + Math.random() * 10;
    asteroids.push({ x: W + r, y: Math.random() * (H - 2 * r), r, vx: -2 - Math.random() * 1.5 });
    // orb (half chance)
    if (Math.random() < 0.5) {
      const size = 6;
      orbs.push({ x: W + size, y: Math.random() * (H - size * 2), size, vx: -2.5 });
    }
  }

  function update(dt) {
    // ship control
    if (keys['ArrowUp'] || keys['w']) ship.vy = -SPEED;
    else if (keys['ArrowDown'] || keys['s']) ship.vy = SPEED;
    else ship.vy = 0;
    ship.y = Math.max(0, Math.min(H - ship.h, ship.y + ship.vy * dt));

    // move asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx * dt;
      // collision with ship (simple circle‑rect)
      const cx = Math.max(a.x, Math.min(ship.x, a.x + a.r));
      const cy = Math.max(a.y, Math.min(ship.y, a.y + a.r));
      const dist = Math.hypot(a.x + a.r - cx, a.y + a.r - cy);
      if (dist < a.r) { playHit(); endGame(); }
      if (a.x + a.r < 0) asteroids.splice(i, 1);
    }
    // move orbs
    for (let i = orbs.length - 1; i >= 0; i--) {
      const o = orbs[i];
      o.x += o.vx * dt;
if (Math.hypot(o.x - ship.x, o.y - ship.y) < o.size + ship.w / 2) {
          playCollect();
          score++;
          orbs.splice(i, 1);
        } else if (o.x + o.size < 0) orbs.splice(i, 1);
    }

    // timer
    const elapsed = (Date.now() - start) / 1000;
    timeLeft = Math.max(0, 30 - elapsed);
    if (timeLeft <= 0) endGame();
  }

  let gameOver = false;
  function endGame() {
    if (!gameOver) {
      gameOver = true;
      cancelAnimationFrame(raf);
      draw(); // final render
    }
  }

  function draw() {
    // background
    ctx.fillStyle = '#000020';
    ctx.fillRect(0, 0, W, H);
    // stars
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // ship with gradient
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x + ship.w, ship.y + ship.h);
    shipGrad.addColorStop(0, '#0f0');
    shipGrad.addColorStop(1, '#060');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h / 2);
    ctx.closePath();
    ctx.fill();

    // asteroids with radial gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#222');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // glowing orbs
    orbs.forEach(o => {
      const orbGrad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.size);
      orbGrad.addColorStop(0, 'rgba(255,255,0,0.9)');
      orbGrad.addColorStop(1, 'rgba(255,255,0,0.2)');
      ctx.fillStyle = orbGrad;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Time: ${timeLeft.toFixed(1)}`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', W / 2, H / 2 - 10);
      ctx.font = '20px sans-serif';
      ctx.fillText(`Final Score: ${score}`, W / 2, H / 2 + 20);
    }
  }

  let last = performance.now();
  let raf;
  function loop(now) {
    const dt = now - last;
    last = now;
    if (!gameOver) {
      if (frame++ % SPAWN_RATE === 0) spawn();
      update(dt);
      draw();
      raf = requestAnimationFrame(loop);
    } else {
      draw();
    }
  }
  raf = requestAnimationFrame(loop);
})();
