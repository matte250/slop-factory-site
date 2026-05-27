// Simple endless‑runner space game
// Canvas with id="game" defined in the HTML

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Audio setup – simple tones using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration = 0.1) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  };
  const W = canvas.width = canvas.offsetWidth || 800;
  const H = canvas.height = canvas.offsetHeight || 600;

  // ---- Game state -------------------------------------------------------
  const player = { x: W / 2, y: H - 80, w: 40, h: 40, speed: 4 };
  const keys = {};
  const asteroids = [];
  const crates = [];
  let fuel = 100; // percent, depletes over time
  let score = 0;
  let lastAsteroid = 0;
  let lastCrate = 0;
  const FPS = 60;
  const asteroidInterval = 1500; // ms
  const crateInterval = 2000; // ms

  // ---- Input -----------------------------------------------------------
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    // resume audio on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // ---- Helpers ----------------------------------------------------------
  const rectCollide = (a, b) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  const rand = (min, max) => Math.random() * (max - min) + min;

  // ---- Game loop --------------------------------------------------------
  function update(dt) {
    // player movement
    if (keys.ArrowLeft || keys.a) player.x -= player.speed;
    if (keys.ArrowRight || keys.d) player.x += player.speed;
    if (keys.ArrowUp || keys.w) player.y -= player.speed;
    if (keys.ArrowDown || keys.s) player.y += player.speed;
    // keep inside canvas
    player.x = Math.max(0, Math.min(W - player.w, player.x));
    player.y = Math.max(0, Math.min(H - player.h, player.y));

    // fuel consumption
    fuel -= dt * 0.01; // 1% per second
    if (fuel <= 0) endGame('out of fuel');

    // spawn asteroids
    if (Date.now() - lastAsteroid > asteroidInterval) {
      asteroids.push({ x: rand(0, W - 30), y: -30, w: 30, h: 30, speed: rand(2, 5) });
      lastAsteroid = Date.now();
    }
    // spawn crates
    if (Date.now() - lastCrate > crateInterval) {
      crates.push({ x: rand(0, W - 20), y: -20, w: 20, h: 20, speed: rand(1, 3) });
      lastCrate = Date.now();
    }

    // update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      if (a.y > H) asteroids.splice(i, 1);
      else if (rectCollide(player, a)) { playTone(150); endGame('collision'); }
    }
    // update crates
    for (let i = crates.length - 1; i >= 0; i--) {
      const c = crates[i];
      c.y += c.speed;
      if (c.y > H) crates.splice(i, 1);
      else if (rectCollide(player, c)) {
        score += 10;
        fuel = Math.min(100, fuel + 5); // small fuel boost
        crates.splice(i, 1);
      }
    }
  }

  function draw() {
  // helper: draw asteroid as gradient circle
  const drawAsteroid = (a) => {
    const grad = ctx.createRadialGradient(
      a.x + a.w / 2,
      a.y + a.h / 2,
      a.w / 4,
      a.x + a.w / 2,
      a.y + a.h / 2,
      a.w / 2
    );
    grad.addColorStop(0, '#aaa');
    grad.addColorStop(1, '#555');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(a.x + a.w / 2, a.y + a.h / 2, a.w / 2, 0, Math.PI * 2);
    ctx.fill();
  };
  // helper: draw crate as orange gradient square
  const drawCrate = (c) => {
    const grad = ctx.createLinearGradient(c.x, c.y, c.x + c.w, c.y + c.h);
    grad.addColorStop(0, '#ff8');
    grad.addColorStop(1, '#c60');
    ctx.fillStyle = grad;
    ctx.fillRect(c.x, c.y, c.w, c.h);
  };

    // clear
    ctx.clearRect(0, 0, W, H);
// Parallax star background – three layers for depth
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);
  // layer 1 – dim, many tiny stars
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  for (let i = 0; i < 70; i++) {
    const sx = rand(0, W);
    const sy = rand(0, H);
    ctx.fillRect(sx, sy, 1, 1);
  }
  // layer 2 – brighter, fewer stars with slight motion
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  for (let i = 0; i < 40; i++) {
    const sx = (rand(0, W) + performance.now() * 0.02) % W;
    const sy = rand(0, H);
    ctx.fillRect(sx, sy, 2, 2);
  }
// player ship – simple triangular ship
  ctx.fillStyle = '#0f0';
  ctx.beginPath();
  ctx.moveTo(player.x + player.w / 2, player.y);
  ctx.lineTo(player.x, player.y + player.h);
  ctx.lineTo(player.x + player.w, player.y + player.h);
  ctx.closePath();
  ctx.fill();
    // asteroids – draw with gradient circles
    asteroids.forEach(drawAsteroid);
    // crates – draw with gradient squares
    crates.forEach(drawCrate);
    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Fuel: ${fuel.toFixed(0)}%`, 10, 40);
  }

  let last = performance.now();
  let running = true;
  function loop(now) {
    if (!running) return;
    const dt = now - last;
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  function endGame(reason) {
    // play a tone based on reason
    if (reason === 'collision') {
      // already played before call, keep silent
    } else if (reason === 'out of fuel') {
      playTone(80);
    } else {
      playTone(120);
    }
    running = false;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#f00';
    ctx.font = '32px sans-serif';
    ctx.fillText('Game Over', W / 2 - 80, H / 2);
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Reason: ${reason}`, W / 2 - 80, H / 2 + 30);
    ctx.fillText(`Final Score: ${score}`, W / 2 - 80, H / 2 + 60);
  }

  requestAnimationFrame(loop);
})();
