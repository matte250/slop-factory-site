// Simple "Pixel Escape" game – draws on <canvas id="game"></canvas>
// Core: player moves with arrow keys, random moving blocks (obstacles),
// random glowing orbs (energy), arena slowly shrinks, collision ends game.

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // Audio setup – simple tone generator
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.frequency.value = freq;
    oscillator.type = 'sine';
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    oscillator.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    oscillator.stop(audioCtx.currentTime + duration);
  }
  function resumeAudio() {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }
  // start size – will shrink over time
  let arena = { w: canvas.width = 400, h: canvas.height = 400 };

  // ----- Player -----
  const player = {
    size: 10,
    x: arena.w / 2 - 5,
    y: arena.h / 2 - 5,
    speed: 2,
    dx: 0,
    dy: 0,
    color: '#0ff',
  };

  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; resumeAudio(); });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // ----- Obstacles -----
  const obstacles = [];
  const obstacleSpawnInterval = 1500; // ms
  const obstacleSize = { min: 15, max: 40 };
  let lastObstacle = 0;

  // ----- Energy orbs -----
  const orbs = [];
  const orbSpawnInterval = 3000;
  let lastOrb = 0;

  // ----- Game state -----
  let score = 0;
  let startTime = performance.now();
  let gameOver = false;

  function spawnObstacle() {
    const w = Math.random() * (obstacleSize.max - obstacleSize.min) + obstacleSize.min;
    const h = Math.random() * (obstacleSize.max - obstacleSize.min) + obstacleSize.min;
    const x = Math.random() * (arena.w - w);
    const y = Math.random() * (arena.h - h);
    const speedX = (Math.random() - 0.5) * 1.5;
    const speedY = (Math.random() - 0.5) * 1.5;
    obstacles.push({ x, y, w, h, speedX, speedY, color: '#f44' });
  }

  function spawnOrb() {
    const size = 8;
    const x = Math.random() * (arena.w - size);
    const y = Math.random() * (arena.h - size);
    orbs.push({ x, y, size, color: '#ff0', collected: false });
  }

  function update(delta) {
    if (gameOver) return;
    // player movement
    player.dx = player.dy = 0;
    if (keys.ArrowUp) player.dy = -player.speed;
    if (keys.ArrowDown) player.dy = player.speed;
    if (keys.ArrowLeft) player.dx = -player.speed;
    if (keys.ArrowRight) player.dx = player.speed;
    player.x = Math.max(0, Math.min(arena.w - player.size, player.x + player.dx));
    player.y = Math.max(0, Math.min(arena.h - player.size, player.y + player.dy));

    // obstacles move and bounce inside arena
    obstacles.forEach(o => {
      o.x += o.speedX;
      o.y += o.speedY;
      if (o.x < 0 || o.x + o.w > arena.w) o.speedX *= -1;
      if (o.y < 0 || o.y + o.h > arena.h) o.speedY *= -1;
    });

    // check collisions player‑obstacle
    for (const o of obstacles) {
      if (rectCollide(player, o)) { gameOver = true; playTone(150, 0.3); break; }
    }

    // check player‑orb collection
    for (const orb of orbs) {
        if (!orb.collected && rectCollide(player, { x: orb.x, y: orb.y, w: orb.size, h: orb.size })) {
          orb.collected = true;
          score++;
          playTone(300, 0.15);
        }
    }

    // shrink arena slowly (0.02px per frame)
    arena.w = Math.max(100, arena.w - 0.02 * delta);
    arena.h = Math.max(100, arena.h - 0.02 * delta);
    canvas.width = arena.w; // resize retains clearing
    canvas.height = arena.h;

    // spawn new obstacles / orbs
    const now = performance.now();
    if (now - lastObstacle > obstacleSpawnInterval) { spawnObstacle(); lastObstacle = now; }
    if (now - lastOrb > orbSpawnInterval) { spawnOrb(); lastOrb = now; }
  }

  function draw() {
    // background – radial dark gradient
    const bgGrad = ctx.createRadialGradient(
      arena.w / 2,
      arena.h / 2,
      arena.w / 4,
      arena.w / 2,
      arena.h / 2,
      arena.w / 2
    );
    bgGrad.addColorStop(0, '#111');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, arena.w, arena.h);
    // clear any leftover (not needed but keep for safety)
    // ctx.clearRect(0, 0, arena.w, arena.h);

    // player – draw as a glowing circle
    const grad = ctx.createRadialGradient(
      player.x + player.size / 2,
      player.y + player.size / 2,
      player.size / 4,
      player.x + player.size / 2,
      player.y + player.size / 2,
      player.size / 2
    );
    grad.addColorStop(0, '#0ff');
    grad.addColorStop(1, '#005');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(player.x + player.size / 2, player.y + player.size / 2, player.size / 2, 0, Math.PI * 2);
    ctx.fill();
    // obstacles – draw with vertical gradient
    obstacles.forEach(o => {
      const grad = ctx.createLinearGradient(o.x, o.y, o.x, o.y + o.h);
      grad.addColorStop(0, o.color);
      grad.addColorStop(1, '#800');
      ctx.fillStyle = grad;
      ctx.fillRect(o.x, o.y, o.w, o.h);
    });
    // orbs – draw glowing circles
    orbs.forEach(orb => {
      if (!orb.collected) {
        const grad = ctx.createRadialGradient(
          orb.x + orb.size / 2,
          orb.y + orb.size / 2,
          orb.size / 4,
          orb.x + orb.size / 2,
          orb.y + orb.size / 2,
          orb.size / 2
        );
        grad.addColorStop(0, '#ff0');
        grad.addColorStop(1, '#550');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(orb.x + orb.size / 2, orb.y + orb.size / 2, orb.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '12px sans-serif';
    ctx.fillText(`Score: ${score}`, 5, 12);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, arena.w, arena.h);
      ctx.fillStyle = '#f88';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', arena.w / 2 - 60, arena.h / 2);
    }
  }

  function loop(ts) {
    const delta = ts - (lastRender || ts);
    lastRender = ts;
    update(delta);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  let lastRender = null;
  requestAnimationFrame(loop);

  function rectCollide(a, b) {
    return a.x < b.x + b.w && a.x + a.size > b.x && a.y < b.y + b.h && a.y + a.size > b.y;
  }
})();
