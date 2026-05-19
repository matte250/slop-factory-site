// Simple endless runner based on IDEA.md
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;

  // Game objects
  const ship = { x: width * 0.2, y: height / 2, w: 30, h: 20, speed: 4 };
  const asteroids = [];
  const fuelCells = [];
  const stars = [];
  let score = 0;
  let gameOver = false;

  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq, dur, type = 'sine', volume = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = type;
    gain.gain.value = volume;
    osc.connect(gain).connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    osc.start(now);
    osc.stop(now + dur);
  }
  function playCollision() { beep(200, 0.3, 'square', 0.2); }
  function playFuel() { beep(800, 0.1, 'triangle', 0.15); }
  function startBackground() {
    // Simple low‑frequency hum loop
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 60;
    osc.type = 'sine';
    gain.gain.value = 0.02;
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
  }

  // Input handling (arrow keys & mouse)
  const keys = {};
  window.addEventListener('keydown', e => keys[e.key] = true);
  window.addEventListener('keyup', e => keys[e.key] = false);
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    ship.y = e.clientY - rect.top;
  });

  // Initialize starfield with parallax depth
  function initStars(count = 200) {
    for (let i = 0; i < count; i++) {
      const depth = Math.random(); // 0 (far) to 1 (near)
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: depth * 2 + 0.5,
        speed: 0.2 + depth * 0.8,
        hue: Math.floor(Math.random() * 360)
      });
    }
  }

  function spawnAsteroid() {
    const size = Math.random() * 30 + 20;
    const rotation = Math.random() * Math.PI * 2;
    const rotSpeed = (Math.random() - 0.5) * 0.04;
    asteroids.push({ x: width, y: Math.random() * (height - size), w: size, h: size, speed: 2 + Math.random() * 3, rotation, rotSpeed });
  }

  function spawnFuel() {
    const size = 15;
    fuelCells.push({ x: width, y: Math.random() * (height - size), w: size, h: size, speed: 2, glow: 0 });
  }

  function update() {
    if (gameOver) return;
    // Ship movement
    if (keys['ArrowUp']) ship.y -= ship.speed;
    if (keys['ArrowDown']) ship.y += ship.speed;
    ship.y = Math.max(0, Math.min(height - ship.h, ship.y));

    // Update stars (parallax scrolling)
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.x -= s.speed;
      if (s.x < 0) {
        s.x = width;
        s.y = Math.random() * height;
      }
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed;
      a.rotation += a.rotSpeed;
      if (a.x + a.w < 0) asteroids.splice(i, 1);
      // Collision detection
      if (a.x < ship.x + ship.w && a.x + a.w > ship.x && a.y < ship.y + ship.h && a.y + a.h > ship.y) {
        gameOver = true;
        playCollision();
      }
    }

    // Update fuel cells (pulsating glow)
    for (let i = fuelCells.length - 1; i >= 0; i--) {
      const f = fuelCells[i];
      f.x -= f.speed;
      f.glow = (Math.sin(Date.now() / 200) + 1) * 0.5; // 0‑1 pulse
      if (f.x + f.w < 0) fuelCells.splice(i, 1);
      if (f.x < ship.x + ship.w && f.x + f.w > ship.x && f.y < ship.y + ship.h && f.y + f.h > ship.y) {
        score++;
        playFuel();
        fuelCells.splice(i, 1);
      }
    }

    // Random spawns
    if (Math.random() < 0.02) spawnAsteroid();
    if (Math.random() < 0.005) spawnFuel();
  }

  function drawStarfield() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    // Draw stars with subtle color variation
    stars.forEach(s => {
      ctx.fillStyle = `hsl(${s.hue}, 80%, 80%)`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function render() {
    drawStarfield();
    // Ship – simple triangle with gradient
    ctx.save();
    ctx.translate(ship.x + ship.w / 2, ship.y + ship.h / 2);
    const grad = ctx.createLinearGradient(-ship.w / 2, -ship.h / 2, ship.w / 2, ship.h / 2);
    grad.addColorStop(0, '#0f0');
    grad.addColorStop(1, '#00ff80');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(-ship.w / 2, -ship.h / 2);
    ctx.lineTo(ship.w / 2, 0);
    ctx.lineTo(-ship.w / 2, ship.h / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Asteroids – radial gradient circles with rotation
    asteroids.forEach(a => {
      ctx.save();
      ctx.translate(a.x + a.w / 2, a.y + a.h / 2);
      ctx.rotate(a.rotation);
      const grad = ctx.createRadialGradient(0, 0, a.w * 0.2, 0, 0, a.w / 2);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#444');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, a.w / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Fuel cells – glowing stars
    fuelCells.forEach(f => {
      ctx.save();
      ctx.globalAlpha = 0.6 + 0.4 * f.glow;
      ctx.fillStyle = '#ff0';
      ctx.beginPath();
      ctx.arc(f.x + f.w / 2, f.y + f.h / 2, f.w / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', width / 2 - 120, height / 2);
    }
  }

  function loop() {
    update();
    render();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Initialize everything and start
  initStars();
  startBackground();
  loop();
})();
