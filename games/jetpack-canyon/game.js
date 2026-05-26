// Simple endless‑runner based on IDEA.md
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 400;

  // Game state
  const player = { x: 80, y: height / 2, radius: 15, vy: 0 };
  const gravity = 0.4;
  const thrust = -8;
  const obstacles = [];
  const fuels = [];
  const stars = [];
  let fuel = 100; // fuel units
  let distance = 0;
  let lastObstacle = 0;
  let lastFuel = 0;
  let gameOver = false;

  // generate simple star field
  for (let i = 0; i < 100; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height, r: Math.random() * 1.5 + 0.5 });
  }

  // Input handling (arrow up / mouse click)
  const input = { up: false };
  document.addEventListener('keydown', e => { if (e.code === 'ArrowUp') input.up = true; });
  document.addEventListener('keyup', e => { if (e.code === 'ArrowUp') input.up = false; });
  canvas.addEventListener('mousedown', () => input.up = true);
  canvas.addEventListener('mouseup', () => input.up = false);

  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };
  const playThrust = () => playTone(200, 0.1);
  const playFuel = () => playTone(600, 0.15);
  const playCollision = () => playTone(100, 0.3);
  const playGameOver = () => playTone(50, 0.5);
  let prevUp = false; // track thrust start

  function spawnObstacle() {
    const size = 20 + Math.random() * 30;
    obstacles.push({ x: width + size, y: Math.random() * (height - size), size });
  }

  function spawnFuel() {
    const r = 8;
    fuels.push({ x: width + r, y: Math.random() * (height - r * 2), r });
  }

  function update() {
    if (gameOver) return;
    // player physics
    if (input.up && fuel > 0) {
      player.vy = thrust;
      fuel -= 0.3; // consume fuel
      if (!prevUp) { playThrust(); prevUp = true; }
    } else {
      player.vy += gravity;
      prevUp = false;
    }
    player.y += player.vy;
    // keep within canvas
    if (player.y < player.radius) player.y = player.radius, player.vy = 0;
    if (player.y > height - player.radius) player.y = height - player.radius, player.vy = 0;

    // move obstacles and check collision
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= 5;
      // collision (circle vs square approximation)
      const dx = Math.abs(player.x - o.x);
      const dy = Math.abs(player.y - o.y);
      if (dx < player.radius + o.size / 2 && dy < player.radius + o.size / 2) {
        gameOver = true;
        playCollision();
      }
      if (o.x + o.size < 0) obstacles.splice(i, 1);
    }

    // move fuels and collect
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
      f.x -= 5;
      const dx = player.x - f.x;
      const dy = player.y - f.y;
      if (dx * dx + dy * dy < (player.radius + f.r) ** 2) {
        fuel = Math.min(100, fuel + 30);
        fuels.splice(i, 1);
        playFuel();
      } else if (f.x + f.r < 0) {
        fuels.splice(i, 1);
      }
    }

    // spawn new obstacles/fuel periodically
    distance += 5;
    if (distance - lastObstacle > 150) { spawnObstacle(); lastObstacle = distance; }
    if (distance - lastFuel > 300) { spawnFuel(); lastFuel = distance; }

    // lose condition when fuel exhausted
    if (fuel <= 0 && player.vy >= 0) {
      if (!gameOver) { playGameOver(); }
      gameOver = true;
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // background gradient (dark night to deeper)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // star field (twinkling)
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.globalAlpha = Math.random() * 0.5 + 0.5;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // player (jetpack) with flame when thrusting
    // body
    ctx.fillStyle = '#0ff';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    // flame
    if (input.up && fuel > 0) {
      const flameGrad = ctx.createRadialGradient(player.x, player.y + player.radius, 0, player.x, player.y + player.radius, player.radius * 2);
      flameGrad.addColorStop(0, 'rgba(255,150,0,0.8)');
      flameGrad.addColorStop(1, 'rgba(255,0,0,0)');
      ctx.fillStyle = flameGrad;
      ctx.beginPath();
      ctx.arc(player.x, player.y + player.radius, player.radius * 2, Math.PI, 2 * Math.PI);
      ctx.fill();
    }

    // obstacles (spiky triangles)
    ctx.fillStyle = '#f44';
    obstacles.forEach(o => {
      ctx.beginPath();
      const half = o.size / 2;
      ctx.moveTo(o.x, o.y - half);
      ctx.lineTo(o.x - half, o.y + half);
      ctx.lineTo(o.x + half, o.y + half);
      ctx.closePath();
      ctx.fill();
    });

    // fuels (glowing pods)
    fuels.forEach(f => {
      const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r);
      grad.addColorStop(0, 'rgba(255,255,0,0.9)');
      grad.addColorStop(1, 'rgba(255,200,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Fuel: ${Math.floor(fuel)}`, 10, 20);
    ctx.fillText(`Dist: ${Math.floor(distance / 10)}`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2 - 10);
      ctx.font = '16px sans-serif';
      ctx.fillText('Refresh to play again', width / 2, height / 2 + 20);
    }
  }

  function loop() {
    if (!gameOver) update();
    draw();
    requestAnimationFrame(loop);
  }

  loop();
})();
