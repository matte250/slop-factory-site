// Nebula Escape – minimalist endless runner
// Canvas with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;

  // ----- Game state -----
  const keys = new Set();
  const player = { x: 80, y: height / 2, r: 12, speed: 3 };
  const asteroids = [];
  const fuels = [];
  let fuel = 100; // percent
  let score = 0;
  let gameOver = false;
  let frame = 0;

  // ----- Input -----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };
  const playCollision = () => playTone(150, 0.3);
  const playFuel = () => playTone(800, 0.1);
  const resumeAudio = () => { if (audioCtx.state !== 'running') audioCtx.resume(); };
  window.addEventListener('keydown', e => { keys.add(e.key); resumeAudio(); });
  window.addEventListener('keyup', e => keys.delete(e.key));

  // ----- Helpers -----
  const rnd = (min, max) => Math.random() * (max - min) + min;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  // ----- Game logic -----
  const update = () => {
    if (gameOver) return;
    // player movement
    if (keys.has('ArrowUp')) player.y -= player.speed;
    if (keys.has('ArrowDown')) player.y += player.speed;
    if (keys.has('ArrowLeft')) player.x -= player.speed;
    if (keys.has('ArrowRight')) player.x += player.speed;
    // keep inside canvas
    player.y = Math.max(player.r, Math.min(height - player.r, player.y));
    player.x = Math.max(player.r, Math.min(width - player.r, player.x));

    // spawn asteroids
    if (frame % 60 === 0) {
      const size = rnd(8, 20);
      asteroids.push({ x: width + size, y: rnd(size, height - size), r: size, vx: rnd(-4, -2), angle: Math.random() * Math.PI * 2, av: 0.02 });
    }
    // spawn fuel cells
    if (frame % 300 === 0) {
      const size = 8;
      fuels.push({ x: width + size, y: rnd(size, height - size), r: size, vx: -3 });
    }

    // move obstacles
    asteroids.forEach(a => {
      a.x += a.vx;
      a.angle = (a.angle || 0) + (a.av || 0);
    });
    fuels.forEach(f => f.x += f.vx);
    // remove off‑screen
    while (asteroids.length && asteroids[0].x < -asteroids[0].r) asteroids.shift();
    while (fuels.length && fuels[0].x < -fuels[0].r) fuels.shift();

    // collision detection
    for (const a of asteroids) {
      if (dist(a, player) < a.r + player.r) {
        playCollision();
        gameOver = true;
      }
    }
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
      if (dist(f, player) < f.r + player.r) {
        fuel = Math.min(100, fuel + 20);
        playFuel();
        fuels.splice(i, 1);
      }
    }

    // fuel consumption
    fuel -= 0.05;
    if (fuel <= 0) gameOver = true;

    score++;
    frame++;
  };

  // ----- Rendering -----
  // Pre‑generated star field for depth
  const stars = Array.from({length: 80}, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    r: Math.random() * 1.5 + 0.5,
  }));

  const draw = () => {
    // background gradient (space nebula)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#020');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // player (triangle ship) with gradient
    const shipGrad = ctx.createLinearGradient(player.x - player.r, player.y, player.x + player.r, player.y);
    shipGrad.addColorStop(0, '#0ff');
    shipGrad.addColorStop(1, '#00a');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(player.x + player.r, player.y);
    ctx.lineTo(player.x - player.r, player.y - player.r);
    ctx.lineTo(player.x - player.r, player.y + player.r);
    ctx.closePath();
    ctx.fill();
    // asteroids with rotation
    ctx.fillStyle = '#666';
    asteroids.forEach(a => {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.angle || 0);
      ctx.beginPath();
      ctx.arc(0, 0, a.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    // fuel cells with radial glow
    fuels.forEach(f => {
      const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r);
      grad.addColorStop(0, '#ff0');
      grad.addColorStop(1, '#880');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '14px monospace';
    ctx.fillText(`Fuel: ${fuel.toFixed(0)}%  Score: ${score}` , 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f44';
      ctx.textAlign = 'center';
      ctx.font = '30px monospace';
      ctx.fillText('GAME OVER', width / 2, height / 2 - 10);
      ctx.font = '20px monospace';
      ctx.fillText(`Score: ${score}` , width / 2, height / 2 + 20);
    }
  };

  const loop = () => {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  };

  // start
  requestAnimationFrame(loop);
})();
