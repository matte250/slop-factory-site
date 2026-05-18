// Simple Cosmic Courier game
// Canvas with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;
  // Simple audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + dur);
  }
  function playBoost(){ beep(440, 0.07); }
  function playCollect(){ beep(660, 0.12); }
  function playCollision(){ beep(200, 0.3); }
  function playGameOver(){ beep(150, 0.5); }

  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    // resume AudioContext on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  const player = {
    x: canvas.width / 2,
    y: canvas.height - 50,
    r: 12,
    speed: 2,
    boostSpeed: 5,
    fuel: 100,
    boost: false,
    prevBoost: false,
  };

  const stars = [];
  const asteroids = [];
  const packages = [];
  let gameOver = false;
  const soundFlags = { gameOver: false };
  let score = 0;
  // background star spawn
  function spawnStar(){
    stars.push({x: rand(0, canvas.width), y: -2, size: rand(0.5,2), vy: rand(0.5,1.5)});
  }

  function rand(min, max) { return Math.random() * (max - min) + min; }
  function spawnAsteroid() {
    const size = rand(10, 30);
    asteroids.push({
      x: rand(0, canvas.width),
      y: -size,
      r: size,
      vy: rand(1, 3),
    });
  }
  function spawnPackage() {
    const size = 8;
    packages.push({
      x: rand(0, canvas.width),
      y: -size,
      r: size,
      vy: rand(1, 2),
    });
  }

  function update() {
    if (gameOver) return;
    // Player movement
    const moving = {x: 0, y: 0};
    if (keys['ArrowLeft']) moving.x -= 1;
    if (keys['ArrowRight']) moving.x += 1;
    if (keys['ArrowUp']) moving.y -= 1;
    if (keys['ArrowDown']) moving.y += 1;
    const norm = Math.hypot(moving.x, moving.y) || 1;
    const spd = (keys[' '] && player.fuel > 0) ? player.boostSpeed : player.speed;
    player.boost = keys[' '] && player.fuel > 0;
    // Boost sound on transition
    if (player.boost && !player.prevBoost) playBoost();
    player.prevBoost = player.boost;
    if (player.boost) player.fuel = Math.max(0, player.fuel - 0.3);
    player.x += (moving.x / norm) * spd;
    player.y += (moving.y / norm) * spd;
    // Keep inside canvas
    player.x = Math.max(player.r, Math.min(canvas.width - player.r, player.x));
    player.y = Math.max(player.r, Math.min(canvas.height - player.r, player.y));

    // Spawn entities
    if (Math.random() < 0.02) spawnAsteroid();
    if (Math.random() < 0.01) spawnPackage();
    if (Math.random() < 0.05) spawnStar(); // background stars

    // Move entities
    asteroids.forEach(a => a.y += a.vy);
    packages.forEach(p => p.y += p.vy);
    stars.forEach(s => s.y += s.vy);
    // Remove off‑screen
    while (asteroids.length && asteroids[0].y - asteroids[0].r > canvas.height) asteroids.shift();
    while (packages.length && packages[0].y - packages[0].r > canvas.height) packages.shift();
    while (stars.length && stars[0].y > canvas.height) stars.shift();

    // Collision detection
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      const dx = a.x - player.x, dy = a.y - player.y;
      if (Math.hypot(dx, dy) < a.r + player.r) {
        if (!soundFlags.gameOver) { playCollision(); soundFlags.gameOver = true; }
        gameOver = true; break;
      }
    }
    for (let i = packages.length - 1; i >= 0; i--) {
      const p = packages[i];
      const dx = p.x - player.x, dy = p.y - player.y;
      if (Math.hypot(dx, dy) < p.r + player.r) { score++; packages.splice(i, 1); playCollect(); }
    }
    if (player.fuel <= 0) {
      if (!soundFlags.gameOver) { playGameOver(); soundFlags.gameOver = true; }
      gameOver = true;
    }
  }

function draw() {
    // Background gradient (deep space)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Stars (tiny white points)
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.fillRect(s.x, s.y, s.size, s.size);
    });

    // Player ship (triangle with gradient)
    const shipGrad = ctx.createLinearGradient(0, player.y - player.r, 0, player.y + player.r);
    shipGrad.addColorStop(0, '#0ff');
    shipGrad.addColorStop(1, '#005');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y - player.r);
    ctx.lineTo(player.x - player.r, player.y + player.r);
    ctx.lineTo(player.x + player.r, player.y + player.r);
    ctx.closePath();
    ctx.fill();
    // Asteroids (rocky gradient)
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.3, a.x, a.y, a.r);
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Packages (small glowing squares)
    packages.forEach(p => {
      const grad = ctx.createRadialGradient(p.x, p.y, p.r * 0.2, p.x, p.y, p.r);
      grad.addColorStop(0, '#ff0');
      grad.addColorStop(1, '#aa0');
      ctx.fillStyle = grad;
      ctx.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
    });

    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Fuel: ${Math.floor(player.fuel)}`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = '32px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  loop();
})();
