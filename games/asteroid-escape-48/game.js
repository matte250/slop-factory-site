// game.js – Minimal Asteroid Escape implementation
// Assumes an HTML canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
   const width = canvas.width = canvas.clientWidth || 800;
   // Audio setup
   const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
   // Ensure audio context resumes on first user interaction
   const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
   window.addEventListener('click', resumeAudio, { once: true });
   window.addEventListener('keydown', resumeAudio, { once: true });
   function beep(freq, type = 'sine', duration = 0.1) {
     const osc = audioCtx.createOscillator();
     const gain = audioCtx.createGain();
     osc.type = type;
     osc.frequency.value = freq;
     osc.connect(gain);
     gain.connect(audioCtx.destination);
     const now = audioCtx.currentTime;
     gain.gain.setValueAtTime(0.001, now);
     gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
     gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
     osc.start(now);
     osc.stop(now + duration);
   }
   const height = canvas.height = canvas.clientHeight || 600;
   // Create a simple starfield background
   const stars = [];
   for (let i = 0; i < 100; i++) {
     stars.push({
       x: Math.random() * width,
       y: Math.random() * height,
       size: Math.random() * 2 + 0.5,
       speed: Math.random() * 0.5 + 0.2,
     });
   }
 
   // ----- Game state -----
   let ship = { x: width / 2, y: height - 50, w: 20, h: 30, speed: 4 };
  let asteroids = [];
  let fuels = [];
  let score = 0;
  let fuel = 100;
  let gameOver = false;

  // ----- Helper functions -----
  const rand = (min, max) => Math.random() * (max - min) + min;
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  function spawnAsteroid() {
    const r = rand(15, 40);
    asteroids.push({
      x: rand(r, width - r),
      y: -r,
      r,
      vx: rand(-1, 1),
      vy: rand(1, 3),
      angle: rand(0, Math.PI * 2),
      av: rand(-0.05, 0.05), // angular velocity
    });
  }
  function spawnFuel() {
    const r = 8;
    fuels.push({ x: rand(r, width - r), y: -r, r, vy: rand(1, 2) });
  }

  // ----- Input handling -----
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function updateShip() {
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    // keep inside canvas
    ship.x = Math.max(ship.w / 2, Math.min(width - ship.w / 2, ship.x));
    ship.y = Math.max(ship.h / 2, Math.min(height - ship.h / 2, ship.y));
  }

  // ----- Main loop -----
  let lastSpawn = 0, lastFuelSpawn = 0;
  function loop(timestamp) {
    if (gameOver) {
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = 'white';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', width / 2 - 80, height / 2);
      ctx.fillText(`Score: ${score}`, width / 2 - 70, height / 2 + 40);
      return;
    }
    const dt = timestamp - (lastSpawn || timestamp);
    // spawn asteroids every 1.5s
    if (timestamp - lastSpawn > 1500) { spawnAsteroid(); lastSpawn = timestamp; }
    // spawn fuel cells every 5s
    if (timestamp - lastFuelSpawn > 5000) { spawnFuel(); lastFuelSpawn = timestamp; }

    // update objects
    updateShip();
    // update stars (move down, reset at top)
    stars.forEach(s => {
      s.y += s.speed;
      if (s.y > height) { s.y = 0; s.x = Math.random() * width; }
    });
    // update asteroids (move and rotate)
    asteroids.forEach(a => {
      a.x += a.vx;
      a.y += a.vy;
      a.angle += a.av;
    });
    // update fuel cells
    fuels.forEach(f => { f.y += f.vy; });

    // collision detection
    asteroids = asteroids.filter(a => {
      if (distance({ x: a.x, y: a.y }, { x: ship.x, y: ship.y }) < a.r + ship.h / 2) {
        beep(150, 'sawtooth', 0.3); // collision sound
        gameOver = true;
        return false;
      }
      // remove off‑screen
      return a.y - a.r < height;
    });
    fuels = fuels.filter(f => {
      if (distance({ x: f.x, y: f.y }, { x: ship.x, y: ship.y }) < f.r + ship.h / 2) {
        fuel = Math.min(100, fuel + 20);
        score += 10;
        beep(80, 'triangle', 0.15); // fuel collection sound
        return false;
      }
      return f.y - f.r < height;
    });

    // fuel consumption
    fuel -= 0.02;
    if (fuel <= 0) { beep(60, 'sine', 0.3); gameOver = true; }

    // draw
    ctx.clearRect(0, 0, width, height);
    // starfield
    ctx.fillStyle = 'white';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });
    // ship with gradient glow
    const shipGrad = ctx.createRadialGradient(ship.x, ship.y, ship.w/2, ship.x, ship.y, ship.w);
    shipGrad.addColorStop(0, 'rgba(0,255,255,0.9)');
    shipGrad.addColorStop(1, 'rgba(0,100,255,0.2)');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.h / 2);
    ctx.lineTo(ship.x - ship.w / 2, ship.y + ship.h / 2);
    ctx.lineTo(ship.x + ship.w / 2, ship.y + ship.h / 2);
    ctx.closePath();
    ctx.fill();
    // asteroids with rotation and shading
    asteroids.forEach(a => {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.angle);
      const grad = ctx.createRadialGradient(0, 0, a.r*0.3, 0, 0, a.r);
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#222');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, a.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    // fuel cells with subtle glow
    fuels.forEach(f => {
      const fuelGrad = ctx.createRadialGradient(f.x, f.y, f.r*0.5, f.x, f.y, f.r);
      fuelGrad.addColorStop(0, 'rgba(255,215,0,0.9)');
      fuelGrad.addColorStop(1, 'rgba(255,165,0,0.4)');
      ctx.fillStyle = fuelGrad;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // UI
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Fuel: ${Math.max(0, Math.floor(fuel))}`, 10, 40);

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
