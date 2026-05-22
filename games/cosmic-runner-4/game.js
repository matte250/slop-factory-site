// Cosmic Runner – simple endless runner on <canvas id="game"></canvas>
// Arrow keys / WASD move the ship. Avoid rotating asteroids and collect fuel orbs.
// Collision ends the game; fuel depletes over time.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // ----- Audio setup -----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let audioStarted = false;
  const startAudio = () => { if (!audioStarted) { audioCtx.resume(); audioStarted = true; } };
  const playBeep = (freq, dur) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.stop(audioCtx.currentTime + dur);
  };
  const playFuelSound = () => playBeep(800, 0.1);
  const playCollisionSound = () => playBeep(120, 0.5);
  // optional background hum
  const bgOsc = audioCtx.createOscillator();
  const bgGain = audioCtx.createGain();
  bgOsc.frequency.value = 60;
  bgOsc.type = 'sine';
  bgOsc.connect(bgGain);
  bgGain.connect(audioCtx.destination);
  bgGain.gain.setValueAtTime(0.001, audioCtx.currentTime);
  bgOsc.start();
  // increase volume after first interaction
  const increaseBg = () => { bgGain.gain.exponentialRampToValueAtTime(0.05, audioCtx.currentTime + 2); };

  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // ----- Game state -----
  const ship = { x: width / 2, y: height * 0.8, size: 15, speed: 4 };
  const keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false, w: false, a: false, s: false, d: false };
  const asteroids = [];
  const stars = [];
  const STAR_COUNT = 100;
  // Initialize starfield
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 1,
      speed: Math.random() * 0.5 + 0.2,
    });
  }
  const fuels = [];
  let fuel = 100; // percent
  let score = 0;
  let lastTime = performance.now();
  let gameOver = false;

  // ----- Input -----
  window.addEventListener('keydown', e => { if (e.key in keys) keys[e.key] = true; startAudio(); increaseBg(); });
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  // ----- Helpers -----
  const rand = (min, max) => Math.random() * (max - min) + min;
  const degToRad = deg => (deg * Math.PI) / 180;

  const spawnAsteroid = () => {
    const size = rand(20, 50);
    const x = rand(size, width - size);
    const y = -size;
    const speed = rand(1, 3);
    const rotSpeed = rand(-2, 2);
    asteroids.push({ x, y, size, speed, angle: 0, rotSpeed });
  };
  const spawnFuel = () => {
    const radius = 8;
    const x = rand(radius, width - radius);
    const y = -radius;
    const speed = 1.5;
    fuels.push({ x, y, radius, speed });
  };

  // ----- Game loop -----
  function update(dt) {
    // ship movement
    if (keys.ArrowUp || keys.w) ship.y -= ship.speed;
    if (keys.ArrowDown || keys.s) ship.y += ship.speed;
    if (keys.ArrowLeft || keys.a) ship.x -= ship.speed;
    if (keys.ArrowRight || keys.d) ship.x += ship.speed;
    // keep inside canvas
    ship.x = Math.max(ship.size, Math.min(width - ship.size, ship.x));
    ship.y = Math.max(ship.size, Math.min(height - ship.size, ship.y));

    // fuel consumption
    fuel -= dt * 0.01; // deplete 1% per second
    if (fuel <= 0) gameOver = true;

    // update starfield (move stars down, loop)
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.y += s.speed;
      if (s.y > height) {
        s.y = -s.size;
        s.x = Math.random() * width;
      }
    }

    // spawn objects
    if (Math.random() < 0.01) spawnAsteroid();
    if (Math.random() < 0.005) spawnFuel();

    // update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      a.angle += a.rotSpeed;
      if (a.y - a.size > height) asteroids.splice(i, 1);
      // collision with ship (simple circle approximation)
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      if (Math.hypot(dx, dy) < a.size + ship.size) { playCollisionSound(); gameOver = true; }
    }

    // update fuels
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
      f.y += f.speed;
      if (f.y - f.radius > height) { fuels.splice(i, 1); continue; }
      const dx = f.x - ship.x;
      const dy = f.y - ship.y;
      if (Math.hypot(dx, dy) < f.radius + ship.size) {
        fuel = Math.min(100, fuel + 20);
        fuels.splice(i, 1);
        playFuelSound();
      }
    }

    // distance based score
    score += dt * 0.05;
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // background gradient (dark space to nebula)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // starfield (twinkling)
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.globalAlpha = 0.5 + Math.random() * 0.5;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // ship (triangle with gradient)
    ctx.save();
    ctx.translate(ship.x, ship.y);
    const shipGrad = ctx.createLinearGradient(0, -ship.size, 0, ship.size);
    shipGrad.addColorStop(0, '#0f0');
    shipGrad.addColorStop(1, '#060');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(0, -ship.size);
    ctx.lineTo(ship.size / 2, ship.size);
    ctx.lineTo(-ship.size / 2, ship.size);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // asteroids (rotating polygons)
    ctx.strokeStyle = '#888';
    asteroids.forEach(a => {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(degToRad(a.angle));
      ctx.beginPath();
      const sides = 6;
      for (let i = 0; i < sides; i++) {
        const theta = (i / sides) * 2 * Math.PI;
        const r = a.size * (0.7 + 0.3 * Math.random());
        ctx.lineTo(r * Math.cos(theta), r * Math.sin(theta));
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    });

    // fuel orbs (pulsing circles)
    ctx.fillStyle = '#ff0';
    fuels.forEach(f => {
      const pulse = Math.abs(Math.sin(performance.now() / 200)) * 2 + 1;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.radius * pulse, 0, Math.PI * 2);
      ctx.fill();
    });

    // UI overlay
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${Math.floor(score)}`, 10, 20);
    ctx.fillText(`Fuel: ${Math.floor(fuel)}%`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
