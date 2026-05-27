// Simple side‑scrolling asteroid runner with enhanced graphics
// Canvas with id="game" must exist in the HTML.

(() => {
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    setTimeout(() => {
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
      osc.stop(audioCtx.currentTime + 0.2);
    }, dur);
  }
  function playCollision() { playTone(150, 200); }
  function playFuel() { playTone(600, 100); }
  // Thrust sound management
  let thrustOsc = null;
  function startThrust() {
    if (thrustOsc) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 300;
    osc.type = 'square';
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.05, audioCtx.currentTime + 0.01);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    thrustOsc = { osc, gain };
  }
  function stopThrust() {
    if (!thrustOsc) return;
    const { osc, gain } = thrustOsc;
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    setTimeout(() => osc.stop(), 150);
    thrustOsc = null;
  }

  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Game state
  const ship = { x: 50, y: height / 2, w: 30, h: 20, dy: 0 };
  // star field
  const starCount = 100;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.5,
      speed: 0.5 + Math.random() * 0.5,
    });
  }
  let asteroids = [];
  let fuels = [];
  let fuel = 100; // percent
  let lastTime = 0;
  let gameOver = false;

  // Input
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (audioCtx.state === 'suspended') audioCtx.resume();
  });
  window.addEventListener('keyup', e => (keys[e.code] = false));

  function spawnAsteroid() {
    const size = 20 + Math.random() * 20;
    asteroids.push({ x: width + size, y: Math.random() * (height - size), r: size, speed: 2 + Math.random() * 3 });
  }

  function spawnFuel() {
    const size = 10;
    fuels.push({ x: width + size, y: Math.random() * (height - size), w: size, h: size, speed: 2 });
  }

  function update(dt) {
    // Ship movement (up/down)
    if (keys['ArrowUp']) ship.dy = -4;
    else if (keys['ArrowDown']) ship.dy = 4;
    else ship.dy = 0;
    ship.y = Math.max(0, Math.min(height - ship.h, ship.y + ship.dy));
    // Thrust sound based on movement
    if (ship.dy !== 0) startThrust(); else stopThrust();

    // Fuel consumption
    fuel -= dt * 0.02; // consume over time
    if (fuel <= 0) gameOver = true;

    // Spawn obstacles
    if (Math.random() < 0.02) spawnAsteroid();
    if (Math.random() < 0.005) spawnFuel();

    // Move asteroids
    asteroids.forEach(a => a.x -= a.speed);
    asteroids = asteroids.filter(a => a.x + a.r > 0);

    // Move fuels
    fuels.forEach(f => f.x -= f.speed);
    fuels = fuels.filter(f => f.x + f.w > 0);

    // Move stars (parallax background)
    stars.forEach(s => {
      s.x -= s.speed;
      if (s.x < 0) {
        s.x = width;
        s.y = Math.random() * height;
      }
    });

    // Collision detection
    for (const a of asteroids) {
      const dx = (ship.x + ship.w / 2) - a.x;
      const dy = (ship.y + ship.h / 2) - a.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.r + Math.min(ship.w, ship.h) / 2) {
        playCollision();
        gameOver = true;
        break;
      }
    }
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
if (ship.x < f.x + f.w && ship.x + ship.w > f.x && ship.y < f.y + f.h && ship.y + ship.h > f.y) {
          playFuel();
          fuel = Math.min(100, fuel + 20);
          fuels.splice(i, 1);
        }
    }
  }

  function draw() {
    // Draw background stars
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });
    // background already cleared by fillRect
    // Ship - draw as triangle
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h / 2);
    ctx.lineTo(ship.x + ship.w, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // Asteroids with radial gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#ccc');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // Fuel cells
    ctx.fillStyle = '#ff0';
    fuels.forEach(f => ctx.fillRect(f.x, f.y, f.w, f.h));
    // Fuel bar
    ctx.fillStyle = '#555';
    ctx.fillRect(5, 5, 100, 10);
    ctx.fillStyle = '#0ff';
    ctx.fillRect(5, 5, fuel, 10);
    // Game over text
    if (gameOver) {
      ctx.fillStyle = '#f00';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', width / 2 - 80, height / 2);
    }
  }

  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
