// Asteroid Escape – minimal canvas game
// Assumes an HTML canvas with id="game" exists.

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  // Adjust canvas size to its CSS dimensions
  const resize = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  // Starfield definition
  const starCount = 80;
  const stars = [];
  const initStars = () => {
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 1,
        speed: Math.random() * 0.5 + 0.2,
      });
    }
  };
  initStars();

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, len) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + len);
  };
  // Ensure audio context runs after user interaction
  const resumeAudio = () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    window.removeEventListener('keydown', resumeAudio);
    window.removeEventListener('click', resumeAudio);
  };
  window.addEventListener('keydown', resumeAudio);
  window.addEventListener('click', resumeAudio);

  // Starfield definition
  const starCount = 80;
  const stars = [];
  const initStars = () => {
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 1,
        speed: Math.random() * 0.5 + 0.2,
      });
    }
  };
  initStars();

  // Ship definition
  const ship = {
    w: 30,
    h: 20,
    x: 0,
    y: 0,
    speed: 3,
    boost: 6,
    fuel: 100, // percent, depletes over time
  };
  // Position ship at bottom centre
  const resetShip = () => {
    ship.x = canvas.width / 2 - ship.w / 2;
    ship.y = canvas.height - ship.h - 10;
  };
  resetShip();

  // Asteroid definition
  const asteroids = [];
  const asteroidSpawnInterval = 2000; // ms, will accelerate later
  let nextSpawn = performance.now() + asteroidSpawnInterval;

  // Fuel cell definition (simple, adds fuel)
  const fuelCells = [];
  const fuelCellSpawnInterval = 15000;
  let nextFuel = performance.now() + fuelCellSpawnInterval;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (e.key === 'ArrowUp') playTone(440, 0.1);
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // Simple AABB‑circle collision (asteroid approximated as circle)
  const collides = (rect, circle) => {
    const dx = Math.max(rect.x - circle.x, 0, circle.x - (rect.x + rect.w));
    const dy = Math.max(rect.y - circle.y, 0, circle.y - (rect.y + rect.h));
    return dx * dx + dy * dy < circle.r * circle.r;
  };

  let startTime = null;
  let gameOver = false;

  const update = now => {
    if (!startTime) startTime = now;
    const dt = now - (lastTime || now);
    lastTime = now;
    if (gameOver) return drawGameOver();

    // Input
    if (keys['ArrowLeft']) ship.x -= ship.speed;
    if (keys['ArrowRight']) ship.x += ship.speed;
    if (keys['ArrowUp']) ship.x += (keys['Shift'] ? ship.boost : ship.speed) * 0;
    // Keep inside bounds
    ship.x = Math.max(0, Math.min(canvas.width - ship.w, ship.x));

    // Fuel consumption
    ship.fuel -= dt * 0.005; // 0.5% per second
    if (ship.fuel <= 0) gameOver = true;

    // Move stars for background illusion
    stars.forEach(s => {
      s.y += s.speed;
      if (s.y > canvas.height) {
        s.y = 0;
        s.x = Math.random() * canvas.width;
      }
    });

    // Spawn asteroids
    if (now > nextSpawn) {
      const size = Math.random() * 20 + 10;
      asteroids.push({
        x: Math.random() * (canvas.width - size),
        y: -size,
        r: size / 2,
        speed: 1 + Math.random() * 2 + (now - startTime) / 20000, // accelerate over time
      });
      nextSpawn = now + Math.max(500, asteroidSpawnInterval - (now - startTime) * 0.5);
    }

    // Spawn fuel cells
    if (now > nextFuel) {
      const size = 12;
      fuelCells.push({
        x: Math.random() * (canvas.width - size),
        y: -size,
        r: size / 2,
        speed: 1.5,
      });
      nextFuel = now + fuelCellSpawnInterval;
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      if (a.y - a.r > canvas.height) asteroids.splice(i, 1);
      else if (collides(ship, a)) { gameOver = true; playTone(220, 0.2); }
    }

    // Update fuel cells
    for (let i = fuelCells.length - 1; i >= 0; i--) {
      const f = fuelCells[i];
      f.y += f.speed;
      if (f.y - f.r > canvas.height) fuelCells.splice(i, 1);
else if (collides(ship, f)) {
          ship.fuel = Math.min(100, ship.fuel + 20);
          playTone(660, 0.15); // fuel pickup sound
          fuelCells.splice(i, 1);
        }
    }

    draw();
    requestAnimationFrame(update);
  };

  const draw = () => {
    // Clear canvas with semi‑transparent overlay for motion blur effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // --- Background stars ---
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.fillRect(s.x, s.y, 2, 2);
    });

    // Ship – gradient triangle with slight shadow
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x + ship.w, ship.y + ship.h);
    shipGrad.addColorStop(0, '#00ff80');
    shipGrad.addColorStop(1, '#004400');
    ctx.fillStyle = shipGrad;
    ctx.shadowColor = 'rgba(0,255,128,0.5)';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // Asteroids – radial gradient rocks
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x + a.r, a.y + a.r, a.r * 0.2, a.x + a.r, a.y + a.r, a.r);
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#222');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.r, a.y + a.r, a.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Fuel cells – glowing yellow
    fuelCells.forEach(f => {
      const glow = ctx.createRadialGradient(f.x + f.r, f.y + f.r, f.r * 0.2, f.x + f.r, f.y + f.r, f.r);
      glow.addColorStop(0, '#ffff80');
      glow.addColorStop(1, '#ff8000');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(f.x + f.r, f.y + f.r, f.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // UI – time and fuel bar
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Time: ${elapsed}s`, 10, 20);

    // Fuel bar background
    ctx.fillStyle = '#555';
    ctx.fillRect(10, 30, 100, 10);
    // Fuel level – green gradient
    const fuelGrad = ctx.createLinearGradient(10, 30, 10 + ship.fuel, 40);
    fuelGrad.addColorStop(0, '#0f0');
    fuelGrad.addColorStop(1, '#060');
    ctx.fillStyle = fuelGrad;
    ctx.fillRect(10, 30, ship.fuel, 10);
  };

  const drawGameOver = () => {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = '24px sans-serif';
    const finalTime = ((performance.now() - startTime) / 1000).toFixed(1);
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
    ctx.fillText(`Survived: ${finalTime}s`, canvas.width / 2, canvas.height / 2 + 20);
  };

  let lastTime = null;
  requestAnimationFrame(update);
})();
