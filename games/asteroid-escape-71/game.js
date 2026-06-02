// Asteroid Escape game
// Canvas with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 600;

  const ship = { w: 40, h: 20, x: W / 2, y: H - 30, speed: 6 };
  const asteroids = [];
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playCollision(){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
  }
  function playSpawn(){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
  }
  let lastSpawn = 0;
  let spawnInterval = 1500; // ms
  let startTime = performance.now();
  let gameOver = false;
  let score = 0;

  // Input handling (arrow keys and mouse)
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    ship.x = e.clientX - rect.left;
    ship.x = Math.max(ship.w / 2, Math.min(W - ship.w / 2, ship.x));
  });

  function spawnAsteroid() {
    playSpawn();
    const radius = 15 + Math.random() * 10;
    const x = Math.random() * (W - 2 * radius) + radius;
    const speed = 2 + Math.random() * 2 + (score / 10000);
    asteroids.push({ x, y: -radius, r: radius, speed });
  }

  function update(dt) {
    // Ship movement (arrow keys fallback)
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    ship.x = Math.max(ship.w / 2, Math.min(W - ship.w / 2, ship.x));

    // Spawn asteroids
    if (performance.now() - lastSpawn > spawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
      // Gradually increase difficulty
      spawnInterval = Math.max(300, spawnInterval - 20);
    }

    // Move asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // Remove off‑screen
      if (a.y - a.r > H) asteroids.splice(i, 1);
    }

    // Collision detection (circle‑rect approximation)
    for (const a of asteroids) {
      const dx = Math.abs(a.x - ship.x);
      const dy = Math.abs(a.y - (ship.y));
      if (dx < ship.w / 2 + a.r && dy < ship.h / 2 + a.r) {
        gameOver = true;
        break;
      }
    }

    // Score based on time survived
    score = Math.floor((performance.now() - startTime) / 10);
  }

function draw() {
  // Background gradient (space sky)
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, '#001');
  bgGrad.addColorStop(1, '#000');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Optional star field (static, generated once)
  if (!window._stars) {
    const starCount = 100;
    window._stars = [];
    for (let i = 0; i < starCount; i++) {
      window._stars.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.5 + 0.5 });
    }
  }
  ctx.fillStyle = '#fff';
  window._stars.forEach(s => {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  });

  // Draw ship as a triangle (more futuristic)
  ctx.fillStyle = '#0ff';
  ctx.beginPath();
  ctx.moveTo(ship.x, ship.y - ship.h / 2);
  ctx.lineTo(ship.x - ship.w / 2, ship.y + ship.h / 2);
  ctx.lineTo(ship.x + ship.w / 2, ship.y + ship.h / 2);
  ctx.closePath();
  ctx.fill();

  // Draw asteroids with radial gradient for depth
  for (const a of asteroids) {
    const radGrad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
    radGrad.addColorStop(0, '#bbb');
    radGrad.addColorStop(1, '#555');
    ctx.fillStyle = radGrad;
    ctx.beginPath();
    ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw score
  ctx.fillStyle = '#0f0';
  ctx.font = '16px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Score: ' + score, 10, 20);

  // Game‑over overlay
  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#f44';
    ctx.textAlign = 'center';
    ctx.font = '48px sans-serif';
    ctx.fillText('Game Over', W / 2, H / 2);
    ctx.font = '24px sans-serif';
    ctx.fillText('Score: ' + score, W / 2, H / 2 + 40);
  }
}

  function loop(timestamp) {
    if (!gameOver) {
      const dt = timestamp - (lastRender ?? timestamp);
      update(dt);
    }
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  let lastRender;
  requestAnimationFrame(loop);
})();
