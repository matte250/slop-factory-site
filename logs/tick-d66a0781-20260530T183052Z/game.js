// Asteroid Escape – enhanced graphics targeting <canvas id="game">

(() => {
  const canvas = document.getElementById('game');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  const ctx = canvas.getContext('2d');
  const W = (canvas.width = 800);
  const H = (canvas.height = 400);

  // Game state
  let score = 0;
  let fuel = 100; // percent
  let gameOver = false;
  const ship = { x: 80, y: H / 2, w: 30, h: 20, speedY: 0 };
  const asteroids = [];
  const stars = [];
  // Initialize starfield
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      speed: 0.5 + Math.random() * 1.0,
      alpha: 0.5 + Math.random() * 0.5,
    });
  }
  const fuels = [];

  // Input handling
  const keys = {};
  addEventListener('keydown', e => {
    // Unlock audio on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.key] = true;
    if (e.key === 'ArrowUp') playSound(300, 0.05);
  });
  addEventListener('keyup', e => (keys[e.key] = false));

  function spawnAsteroid() {
  // Each asteroid gets a random rotation and speed
  const rotation = Math.random() * Math.PI * 2;
  const rotSpeed = (Math.random() - 0.5) * 0.02; // radians per frame
  const size = 20 + Math.random() * 30;
  asteroids.push({ x: W + size, y: Math.random() * (H - size), r: size, vx: -3 - Math.random() * 2, angle: rotation, rotSpeed });
}
    const size = 20 + Math.random() * 30;
    asteroids.push({ x: W + size, y: Math.random() * (H - size), r: size, vx: -3 - Math.random() * 2 });
  }
  function spawnFuel() {
    const r = 10;
    fuels.push({ x: W + r, y: Math.random() * (H - r), r, vx: -3 });
  }

  // Simple collision (circle–rectangle for ship)
  function rectCircleCollide(rect, cx, cy, cr) {
    const dx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
    const dy = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
    const dist = Math.hypot(dx - cx, dy - cy);
    return dist < cr;
  }

  function update() {
    if (gameOver) return;
    // Ship vertical control
    if (keys['ArrowUp']) ship.speedY = -4;
    else if (keys['ArrowDown']) ship.speedY = 4;
    else ship.speedY = 0;
    ship.y = Math.max(0, Math.min(H - ship.h, ship.y + ship.speedY));

    // Move asteroids & fuels
    asteroids.forEach(a => (a.x += a.vx));
    fuels.forEach(f => (f.x += f.vx));
    // Move stars for scrolling background
    stars.forEach(s => {
      s.x -= s.speed;
      if (s.x < 0) {
        s.x = W;
        s.y = Math.random() * H;
        s.speed = 0.5 + Math.random() * 1.0;
        s.alpha = 0.5 + Math.random() * 0.5;
      }
    });
    // Remove off‑screen objects
    while (asteroids.length && asteroids[0].x + asteroids[0].r < 0) asteroids.shift();
    while (fuels.length && fuels[0].x + fuels[0].r < 0) fuels.shift();

    // Collision detection
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      if (rectCircleCollide(ship, a.x, a.y, a.r)) {
          gameOver = true;
          playSound(150, 0.4); // collision sound
          break;
        }
    }
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
if (rectCircleCollide(ship, f.x, f.y, f.r)) {
          fuel = Math.min(100, fuel + 20);
          score += 10;
          fuels.splice(i, 1);
          playSound(600, 0.1); // fuel collect sound
        }
    }

    // Consume fuel over time
    fuel -= 0.05;
    if (fuel <= 0) gameOver = true;
    score += 0.1;
  }

  function drawBackground() {
    // Fill black background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    // Draw starfield
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.globalAlpha = s.alpha;
      ctx.fillRect(s.x, s.y, 2, 2);
    });
    ctx.globalAlpha = 1;
  }

function draw() {
    // Draw background first
    drawBackground();
    // Ship – gradient triangle with thrust
    const shipGradient = ctx.createLinearGradient(ship.x, ship.y, ship.x + ship.w, ship.y + ship.h);
    shipGradient.addColorStop(0, '#0f0');
    shipGradient.addColorStop(1, '#060');
    ctx.fillStyle = shipGradient;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h / 2);
    ctx.closePath();
    ctx.fill();
    // Thrust flame when moving up
    if (keys['ArrowUp']) {
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.moveTo(ship.x, ship.y + ship.h / 2);
      ctx.lineTo(ship.x - 10, ship.y + ship.h / 2 - 5);
      ctx.lineTo(ship.x - 10, ship.y + ship.h / 2 + 5);
      ctx.closePath();
      ctx.fill();
    }
    // Asteroids – radial gradient
asteroids.forEach(a => {
        // Update rotation
        a.angle += a.rotSpeed;
        // Draw rotated asteroid with gradient
        ctx.save();
        ctx.translate(a.x, a.y);
        ctx.rotate(a.angle);
        const grad = ctx.createRadialGradient(0, 0, a.r * 0.3, 0, 0, a.r);
        grad.addColorStop(0, '#777');
        grad.addColorStop(1, '#222');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, a.r, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
      });
    // Fuel cells – glowing
    fuels.forEach(f => {
      ctx.fillStyle = '#ff0';
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, 2 * Math.PI);
      ctx.fill();
      // subtle outer glow
      ctx.strokeStyle = 'rgba(255,255,0,0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
    // HUD – semi‑transparent background
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillRect(0, 0, 120, 60);
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${Math.floor(score)}`, 10, 20);
    ctx.fillText(`Fuel: ${Math.floor(fuel)}%`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Spawn timers
  setInterval(spawnAsteroid, 1500);
  setInterval(spawnFuel, 4000);

  // Start
  loop();
})();
