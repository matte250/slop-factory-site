// Minimalist Cosmic Courier game
// Targets <canvas id="game"></canvas>
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;
  // generate static starfield
  const stars = [];
  const starCount = 200;
  for (let i = 0; i < starCount; i++) {
    stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height });
  }
  // simple sound manager using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // ensure context is resumed on first user interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  window.addEventListener('click', resumeAudio, { once: true });
  window.addEventListener('keydown', resumeAudio, { once: true });
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }

  // Game state
  const ship = { x: canvas.width / 2, y: canvas.height / 2, size: 20, vx: 0, vy: 0, speed: 0.3 };
  const crates = [];
  const asteroids = [];
  let score = 0;
  let timeLeft = 30; // seconds
  const crateSpawnRate = 2000; // ms
  const asteroidSpawnRate = 1500; // ms
  let lastTime = performance.now();
  let gameOver = false;

  // Input handling (arrow keys)
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; playTone(400,0.05); });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function spawnCrate() {
    crates.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: 12,
    });
  }

  function spawnAsteroid() {
    const size = 30 + Math.random() * 20;
    const side = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    // spawn outside canvas and move inward
    if (side === 0) { x = -size; y = Math.random() * canvas.height; vx = 1 + Math.random(); vy = (Math.random() - 0.5) * 0.5; }
    else if (side === 1) { x = canvas.width + size; y = Math.random() * canvas.height; vx = -1 - Math.random(); vy = (Math.random() - 0.5) * 0.5; }
    else if (side === 2) { x = Math.random() * canvas.width; y = -size; vx = (Math.random() - 0.5) * 0.5; vy = 1 + Math.random(); }
    else { x = Math.random() * canvas.width; y = canvas.height + size; vx = (Math.random() - 0.5) * 0.5; vy = -1 - Math.random(); }
    asteroids.push({ x, y, vx, vy, size });
  }

  function update(dt) {
    // ship movement
    if (keys.ArrowUp) ship.vy -= ship.speed;
    if (keys.ArrowDown) ship.vy += ship.speed;
    if (keys.ArrowLeft) ship.vx -= ship.speed;
    if (keys.ArrowRight) ship.vx += ship.speed;
    // apply velocity
    ship.x += ship.vx;
    ship.y += ship.vy;
    // friction
    ship.vx *= 0.98;
    ship.vy *= 0.98;
    // keep within bounds
    if (ship.x < 0) ship.x = canvas.width;
    if (ship.x > canvas.width) ship.x = 0;
    if (ship.y < 0) ship.y = canvas.height;
    if (ship.y > canvas.height) ship.y = 0;

    // crates collection
    for (let i = crates.length - 1; i >= 0; i--) {
      const c = crates[i];
      const dx = ship.x - c.x, dy = ship.y - c.y;
        if (Math.hypot(dx, dy) < ship.size / 2 + c.size / 2) {
          score += 10;
          timeLeft += 2; // bonus time
          crates.splice(i, 1);
          playTone(800, 0.1); // crate collection sound
        }
    }

    // asteroids movement & collision
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx;
      a.y += a.vy;
      // remove if far off screen
      if (a.x < -100 || a.x > canvas.width + 100 || a.y < -100 || a.y > canvas.height + 100) {
        asteroids.splice(i, 1);
        continue;
      }
      const dx = ship.x - a.x, dy = ship.y - a.y;
      if (Math.hypot(dx, dy) < ship.size / 2 + a.size / 2) {
        gameOver = true;
      }
    }

    // timer
    timeLeft -= dt / 1000;
    if (timeLeft <= 0) gameOver = true;
  }

  // Pre‑generated starfield background
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => { ctx.fillRect(s.x, s.y, 1, 1); });
    // ship with gradient and outline
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y - ship.size / 2, ship.x, ship.y + ship.size / 2);
    shipGrad.addColorStop(0, '#0ff');
    shipGrad.addColorStop(1, '#00a');
    ctx.fillStyle = shipGrad;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.size / 2);
    ctx.lineTo(ship.x - ship.size / 2, ship.y + ship.size / 2);
    ctx.lineTo(ship.x + ship.size / 2, ship.y + ship.size / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // crates – glowing yellow
    crates.forEach(c => {
      const grad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.size / 2);
      grad.addColorStop(0, '#ff0');
      grad.addColorStop(1, '#a60');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.size / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // asteroids – rocky gradient with shadow
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 4;
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, a.size / 2);
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#444');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.size / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0; // reset
    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Time: ${Math.max(0, timeLeft).toFixed(1)}`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
      ctx.font = '32px sans-serif';
      ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 30);
    }
  }

  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) {
      update(dt);
    }
    draw();
    if (!gameOver) {
      requestAnimationFrame(loop);
    }
  }

  // spawn intervals
  setInterval(spawnCrate, crateSpawnRate);
  setInterval(spawnAsteroid, asteroidSpawnRate);

  requestAnimationFrame(loop);
})();
