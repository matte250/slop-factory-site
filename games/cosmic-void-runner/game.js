// Cosmic Void Runner – simple canvas game
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const resize = () => { canvas.width = canvas.clientWidth; canvas.height = canvas.clientHeight; };
  resize();
  window.addEventListener('resize', resize);

  const state = {
    player: { x: 80, y: 200, r: 12, vy: 0 },
    gravity: 0.4,
    thrust: -8,
    asteroids: [],
    orbs: [],
    spawn: 0,
    score: 0,
    alive: true,
    thrusting: false,
  };

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playSound = (freq, type = 'sine', duration = 0.1) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };
  const applyThrust = () => {
    state.player.vy = state.thrust;
    state.thrusting = true;
    playSound(300, 'square', 0.05);
  };
  window.addEventListener('keydown', e => { if (e.code === 'Space') applyThrust(); });
  window.addEventListener('mousedown', applyThrust);

  const rand = (a, b) => Math.random() * (b - a) + a;

  const update = dt => {
    if (!state.alive) return;
    const p = state.player;
    p.vy += state.gravity; p.y += p.vy;
    if (p.y > canvas.height - p.r) { p.y = canvas.height - p.r; p.vy = 0; }
    if (p.y < p.r) { p.y = p.r; p.vy = 0; }

    state.spawn -= dt;
    if (state.spawn <= 0) {
      if (Math.random() < 0.2) {
        state.orbs.push({ x: canvas.width + 20, y: rand(30, canvas.height - 30), r: 8, vx: -3 });
      } else {
        const size = rand(15, 35);
        state.asteroids.push({ x: canvas.width + size, y: rand(size, canvas.height - size), r: size, vx: -4 - Math.random() * 2 });
      }
      state.spawn = rand(500, 1200);
    }

    state.asteroids = state.asteroids.filter(a => {
      a.x += a.vx;
      const dx = a.x - p.x, dy = a.y - p.y;
      if (dx * dx + dy * dy < (a.r + p.r) ** 2) { state.alive = false; playSound(150, 'triangle', 0.3); }
      return a.x + a.r > 0;
    });

    state.orbs = state.orbs.filter(o => {
      o.x += o.vx;
      const dx = o.x - p.x, dy = o.y - p.y;
      if (dx * dx + dy * dy < (o.r + p.r) ** 2) { state.score += 10; return false; }
      return o.x + o.r > 0;
    });
    state.score += dt * 0.01;
  };

  const drawStars = () => {
    // Gradient background for depth
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#0b0c2b');
    grad.addColorStop(1, '#1b1d3c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Twinkling stars with varying size and opacity
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 80; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const radius = Math.random() * 1.5 + 0.5;
      const alpha = Math.random() * 0.6 + 0.4;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  const render = () => {
    drawStars();
    const p = state.player;
    // Ship with rotation based on vertical velocity
    const angle = Math.atan2(p.vy, 2); // tilt slightly with speed
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(angle);
    // Ship hull gradient
    const shipGrad = ctx.createLinearGradient(0, -10, 0, 10);
    shipGrad.addColorStop(0, '#2f8');
    shipGrad.addColorStop(1, '#0f0');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-15, 10);
    ctx.lineTo(-15, -10);
    ctx.closePath();
    ctx.fill();
    // Thrust flame when thrusting
    if (state.thrusting) {
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.moveTo(-15, -5);
      ctx.lineTo(-25, 0);
      ctx.lineTo(-15, 5);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    // Reset thrust flag after rendering flame
    state.thrusting = false;
    // Asteroids with radial gradient
    state.asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.3, a.x, a.y, a.r);
      grad.addColorStop(0, '#c44');
      grad.addColorStop(1, '#600');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // Orbs with glow effect
    state.orbs.forEach(o => {
      ctx.save();
      ctx.shadowColor = '#ff0';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#ff0';
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(state.score), 10, 20);
    if (!state.alive) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f88';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2 - 60, canvas.height / 2);
    }
  };

  let last = performance.now();
  const loop = () => {
    const now = performance.now();
    const dt = now - last; last = now;
    update(dt);
    render();
    if (state.alive) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
