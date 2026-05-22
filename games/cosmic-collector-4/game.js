// Cosmic Collector – simple canvas game
// HTML expected: <canvas id="game" width="800" height="600"></canvas>

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  function playCollectSound() { playTone(800, 0.1); }
  function playCrashSound() { playTone(150, 0.5); }
  // optional background hum
  setInterval(() => playTone(60, 0.2), 4000);


  // Game state
  const player = { x: width / 2, y: height / 2, size: 20, speed: 4 };
  const orbs = [];
  const asteroids = [];
  let score = 0;
  let timeLeft = 60; // seconds
  let lastTime = performance.now();
  let spawnOrbTimer = 0;
  let spawnAstTimer = 0;
  let keys = {};

  // Input handling
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnOrb() {
    const radius = 8;
    const orb = {
      x: Math.random() * (width - 2 * radius) + radius,
      y: Math.random() * (height - 2 * radius) + radius,
      radius,
    };
    orbs.push(orb);
  }

  function spawnAsteroid() {
    const size = Math.random() * 30 + 20;
    const asteroid = {
      x: Math.random() * (width - size),
      y: -size,
      size,
      speed: Math.random() * 2 + 1,
    };
    asteroids.push(asteroid);
  }

  function update(dt) {
    // player movement
    if (keys['ArrowUp'] || keys['w']) player.y -= player.speed;
    if (keys['ArrowDown'] || keys['s']) player.y += player.speed;
    if (keys['ArrowLeft'] || keys['a']) player.x -= player.speed;
    if (keys['ArrowRight'] || keys['d']) player.x += player.speed;
    // keep inside bounds
    player.x = Math.max(player.size, Math.min(width - player.size, player.x));
    player.y = Math.max(player.size, Math.min(height - player.size, player.y));

    // spawn orbs every 2 seconds
    spawnOrbTimer += dt;
    if (spawnOrbTimer > 2000) { spawnOrb(); spawnOrbTimer = 0; }

    // spawn asteroids every 3 seconds
    spawnAstTimer += dt;
    if (spawnAstTimer > 3000) { spawnAsteroid(); spawnAstTimer = 0; }

    // move asteroids downwards
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      if (a.y > height) asteroids.splice(i, 1);
    }

    // check orb collection
    for (let i = orbs.length - 1; i >= 0; i--) {
      const o = orbs[i];
      const dx = player.x - o.x;
      const dy = player.y - o.y;
      if (Math.hypot(dx, dy) < player.size + o.radius) {
        score++;
        playCollectSound();
        orbs.splice(i, 1);
      }
    }

    // check collisions with asteroids (lose condition)
    for (const a of asteroids) {
      const dx = player.x - (a.x + a.size / 2);
      const dy = player.y - (a.y + a.size / 2);
      const dist = Math.hypot(dx, dy);
      if (dist < player.size + a.size / 2) {
        playCrashSound();
        endGame();
        return;
      }
    }

    // timer countdown
    timeLeft -= dt / 1000;
    if (timeLeft <= 0) { endGame(); }
  }

  // Pre‑generate a small star field
const stars = Array.from({length: 100}, () => ({
  x: Math.random() * width,
  y: Math.random() * height,
  radius: Math.random() * 1.5 + 0.5,
}));

function draw() {
  // Space background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#000020');
  bgGrad.addColorStop(1, '#000000');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // stars
  ctx.fillStyle = '#fff';
  for (const s of stars) {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // player ship (triangle with neon outline)
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.beginPath();
  ctx.moveTo(0, -player.size);
  ctx.lineTo(player.size / 1.5, player.size);
  ctx.lineTo(-player.size / 1.5, player.size);
  ctx.closePath();
  ctx.fillStyle = '#00ffff';
  ctx.fill();
  ctx.strokeStyle = '#00ffff80';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  // orbs with glow
  for (const o of orbs) {
    const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.radius * 2);
    grad.addColorStop(0, 'rgba(255,255,0,0.9)');
    grad.addColorStop(1, 'rgba(255,255,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(o.x, o.y, o.radius * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // asteroids as shaded circles
  for (const a of asteroids) {
    const radGrad = ctx.createRadialGradient(
      a.x + a.size / 2,
      a.y + a.size / 2,
      a.size * 0.2,
      a.x + a.size / 2,
      a.y + a.size / 2,
      a.size / 2
    );
    radGrad.addColorStop(0, '#777');
    radGrad.addColorStop(1, '#222');
    ctx.fillStyle = radGrad;
    ctx.beginPath();
    ctx.arc(a.x + a.size / 2, a.y + a.size / 2, a.size / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // UI
  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  ctx.fillText(`Score: ${score}`, 10, 20);
  ctx.fillText(`Time: ${Math.max(0, Math.ceil(timeLeft))}`, 10, 40);
}

  let animationId;
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    animationId = requestAnimationFrame(loop);
  }

  function endGame() {
    cancelAnimationFrame(animationId);
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', width / 2, height / 2 - 20);
    ctx.font = '24px sans-serif';
    ctx.fillText(`Score: ${score}`, width / 2, height / 2 + 20);
  }

  // start the loop
  requestAnimationFrame(loop);
})();
