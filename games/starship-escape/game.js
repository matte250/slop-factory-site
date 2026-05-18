// Simple Starship Escape game
// Canvas element with id="game" must exist in the HTML.
(() => {
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  let lastThrust = 0;
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  const ship = {
    w: 30,
    h: 20,
    x: 50,
    y: canvas.height / 2,
    speed: 4,
  };

  const keys = { left: false, right: false };
  document.addEventListener('keydown', (e) => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
    // play thrust sound
    const now = performance.now();
    if (now - lastThrust > 100) {
      playBeep(400, 0.05);
      lastThrust = now;
    }
  });
  document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
  });

  const asteroids = [];
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 1,
      speed: Math.random() * 0.5 + 0.2,
    });
  }
  let lastSpawn = 0;
  const spawnInterval = 1000; // ms
  let gameOver = false;
  let startTime = performance.now();

  function spawnAsteroid() {
    const size = Math.random() * 30 + 10;
    const speed = Math.random() * 2 + 1;
    asteroids.push({
      x: canvas.width + size,
      y: Math.random() * (canvas.height - size),
      r: size,
      speed,
    });
  }

  function update(dt) {
    if (gameOver) return;
    // ship movement
    if (keys.left) ship.y = Math.max(ship.h / 2, ship.y - ship.speed);
    if (keys.right) ship.y = Math.min(canvas.height - ship.h / 2, ship.y + ship.speed);
    // spawn asteroids
    if (performance.now() - lastSpawn > spawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }
    // update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed;
      // collision (simple circle-rect)
      const dx = Math.max(ship.x - a.r, Math.min(a.x, ship.x + ship.w));
      const dy = Math.max(ship.y - ship.h / 2, Math.min(a.y, ship.y + ship.h / 2));
      if ((dx - a.x) ** 2 + (dy - a.y) ** 2 < a.r ** 2) {
        playBeep(200, 0.3);
        gameOver = true;
      }
      if (a.x + a.r < 0) asteroids.splice(i, 1);
    }
  }

  function draw() {
  // dark gradient background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#001');
  bgGrad.addColorStop(1, '#000');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // background stars with twinkle
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  stars.forEach(s => {
    ctx.globalAlpha = 0.5 + Math.random() * 0.5;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
    s.x -= s.speed;
    if (s.x < 0) s.x = canvas.width + s.r;
  });
    // draw ship (triangle with optional thrust flame)
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y);
    ctx.lineTo(ship.x - ship.w, ship.y - ship.h / 2);
    ctx.lineTo(ship.x - ship.w, ship.y + ship.h / 2);
    ctx.closePath();
    ctx.fill();
    // thrust flame when moving left or right
    if (keys.left || keys.right) {
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.moveTo(ship.x - ship.w, ship.y);
      ctx.lineTo(ship.x - ship.w - 10, ship.y - 5);
      ctx.lineTo(ship.x - ship.w - 10, ship.y + 5);
      ctx.closePath();
      ctx.fill();
    }
    // draw asteroids
    ctx.fillStyle = '#888';
    asteroids.forEach((a) => {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // draw timer / score
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Time: ${elapsed}s`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  let last = performance.now();
  function loop() {
    const now = performance.now();
    const dt = now - last;
    last = now;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
