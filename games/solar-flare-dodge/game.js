// Simple Solar Flare Dodge game with enhanced graphics
// Canvas with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }

  // Player ship (triangle shape)
  const ship = {
    w: 40,
    h: 20,
    x: width / 2 - 20,
    y: height - 30,
    speed: 5,
    dx: 0,
    draw() {
      ctx.fillStyle = '#00ffff';
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + this.h);
      ctx.lineTo(this.x + this.w / 2, this.y);
      ctx.lineTo(this.x + this.w, this.y + this.h);
      ctx.closePath();
      ctx.fill();
    }
  };

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // Starfield background
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height, radius: Math.random() * 1.5 + 0.5 });
  }
  // Solar flares
  const flares = [];
  const flareSpawnInterval = 1000; // ms
  let lastSpawn = 0;
  function spawnFlare() {
    const radius = 15 + Math.random() * 10;
    const x = Math.random() * (width - radius * 2) + radius;
    const speedY = 1 + Math.random() * 2;
    const speedX = (Math.random() - 0.5) * 1; // slight angle
    flares.push({ x, y: -radius, r: radius, vx: speedX, vy: speedY });
    // Play subtle flare spawn sound
    playTone(200, 80);
  }

  // Collision detection (circle-rect)
  function collides(flare) {
    const cx = flare.x, cy = flare.y, r = flare.r;
    const rx = ship.x, ry = ship.y, rw = ship.w, rh = ship.h;
    // Find closest point on rect to circle center
    const closestX = Math.max(rx, Math.min(cx, rx + rw));
    const closestY = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - closestX, dy = cy - closestY;
    return dx * dx + dy * dy < r * r;
  }

  let score = 0;
  let gameOver = false;

  function update(dt) {
    if (gameOver) return;
    // Move ship
    if (keys['ArrowLeft'] || keys['a']) ship.dx = -ship.speed;
    else if (keys['ArrowRight'] || keys['d']) ship.dx = ship.speed;
    else ship.dx = 0;
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x + ship.dx));

    // Update stars (slow downward drift for parallax)
    for (const s of stars) {
      s.y += 0.2; // slow speed
      if (s.y > height) { s.y = 0; s.x = Math.random() * width; }
    }

    // Spawn flares
    if (performance.now() - lastSpawn > flareSpawnInterval) {
      spawnFlare();
      lastSpawn = performance.now();
    }

    // Update flares
    for (let i = flares.length - 1; i >= 0; i--) {
      const f = flares[i];
      f.x += f.vx;
      f.y += f.vy;
      if (collides(f)) { playTone(100, 200); gameOver = true; }
      if (f.y - f.r > height) { flares.splice(i, 1); score++; }
    }
  }

  function draw() {
    // Background gradient (space)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001020');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Draw stars
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw flares with radial gradient for glow
    for (const f of flares) {
      const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r);
      grad.addColorStop(0, 'rgba(255,150,0,0.8)');
      grad.addColorStop(1, 'rgba(255,50,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw ship (with slight stroke for contrast)
    ctx.save();
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 8;
    ship.draw();
    ctx.restore();

    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.font = '36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  let lastTime = 0;
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
