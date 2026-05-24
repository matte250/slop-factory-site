// Simple Asteroid Dodge game with improved graphics and sound
// Canvas with id="game" assumed in HTML
(() => {
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, dur = 0.1, type = 'sine') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }

  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;
  // starfield for background
  const starCount = 100;
  const stars = Array.from({length: starCount}, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 2 + 1
  }));
  // ship trail positions
  const trail = [];
  const maxTrail = 10;

  const ship = { x: canvas.width / 2, y: canvas.height / 2, size: 15, speed: 3 };
  const dirs = { left: false, right: false, up: false, down: false };
  const asteroids = [];
  let lastSpawn = 0;
  const spawnInterval = 2000; // ms
  let startTime = performance.now();
  let running = true;

  // Input handling
  window.addEventListener('keydown', e => {
    // ensure audio context is running after user interaction
    if (audioCtx.state !== 'running') audioCtx.resume();
    if (e.key === 'ArrowLeft') dirs.left = true;
    if (e.key === 'ArrowRight') dirs.right = true;
    if (e.key === 'ArrowUp') dirs.up = true;
    if (e.key === 'ArrowDown') dirs.down = true;
    // subtle thrust sound on movement
    playBeep(800, 0.03, 'triangle');
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') dirs.left = false;
    if (e.key === 'ArrowRight') dirs.right = false;
    if (e.key === 'ArrowUp') dirs.up = false;
    if (e.key === 'ArrowDown') dirs.down = false;
  });

  function spawnAsteroid() {
    // sound for asteroid spawn
    playBeep(400, 0.05, 'square');
    const edge = Math.floor(Math.random() * 4);
    const size = Math.random() * 20 + 10;
    let x, y, vx, vy;
    const speed = Math.random() * 1.5 + 0.5;
    if (edge === 0) { // top
      x = Math.random() * canvas.width;
      y = -size;
    } else if (edge === 1) { // bottom
      x = Math.random() * canvas.width;
      y = canvas.height + size;
    } else if (edge === 2) { // left
      x = -size;
      y = Math.random() * canvas.height;
    } else { // right
      x = canvas.width + size;
      y = Math.random() * canvas.height;
    }
    // direction toward ship
    const dx = ship.x - x;
    const dy = ship.y - y;
    const len = Math.hypot(dx, dy);
    vx = (dx / len) * speed;
    vy = (dy / len) * speed;
    asteroids.push({ x, y, vx, vy, size });
  }

  function update(dt) {
    // move ship
    if (dirs.left) ship.x -= ship.speed;
    if (dirs.right) ship.x += ship.speed;
    if (dirs.up) ship.y -= ship.speed;
    if (dirs.down) ship.y += ship.speed;
    // keep within bounds
    ship.x = Math.max(0, Math.min(canvas.width, ship.x));
    ship.y = Math.max(0, Math.min(canvas.height, ship.y));

    // record ship position for trail
    trail.unshift({ x: ship.x, y: ship.y });
    if (trail.length > maxTrail) trail.pop();

    // spawn
    if (performance.now() - lastSpawn > spawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }

    // update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx;
      a.y += a.vy;
      // remove if off-screen
      if (a.x < -a.size || a.x > canvas.width + a.size || a.y < -a.size || a.y > canvas.height + a.size) {
        asteroids.splice(i, 1);
        continue;
      }
      // collision
      const dist = Math.hypot(a.x - ship.x, a.y - ship.y);
      if (dist < a.size + ship.size) {
        running = false;
        // sound for collision
        playBeep(150, 0.3, 'sawtooth');
      }
    }
  }

  function draw() {
    // black background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // starfield
    ctx.fillStyle = 'white';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });
    // ship trail (fading circles)
    trail.forEach((p, i) => {
      const alpha = (i + 1) / trail.length * 0.5;
      ctx.fillStyle = `rgba(0,255,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, ship.size * 0.5, 0, Math.PI * 2);
      ctx.fill();
    });
    // draw ship (triangle with gradient)
    const grad = ctx.createLinearGradient(ship.x, ship.y - ship.size, ship.x, ship.y + ship.size);
    grad.addColorStop(0, 'white');
    grad.addColorStop(1, 'cyan');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.size);
    ctx.lineTo(ship.x - ship.size, ship.y + ship.size);
    ctx.lineTo(ship.x + ship.size, ship.y + ship.size);
    ctx.closePath();
    ctx.fill();
    // draw asteroids with gradient shading
    asteroids.forEach(a => {
      const aGrad = ctx.createRadialGradient(a.x, a.y, a.size * 0.2, a.x, a.y, a.size);
      aGrad.addColorStop(0, '#777');
      aGrad.addColorStop(1, '#333');
      ctx.fillStyle = aGrad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.size, 0, Math.PI * 2);
      ctx.fill();
    });
    // score
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
    ctx.fillStyle = 'yellow';
    ctx.font = '16px monospace';
    ctx.fillText(`Time: ${elapsed}s`, 10, 20);
    if (!running) {
      ctx.fillStyle = 'red';
      ctx.font = '30px monospace';
      ctx.fillText('Game Over', canvas.width / 2 - 80, canvas.height / 2);
    }
  }

  function loop(timestamp) {
    if (running) {
      const dt = timestamp - (lastFrame || timestamp);
      update(dt);
    }
    draw();
    lastFrame = timestamp;
    if (running) requestAnimationFrame(loop);
  }
  let lastFrame = 0;
  requestAnimationFrame(loop);
})();
