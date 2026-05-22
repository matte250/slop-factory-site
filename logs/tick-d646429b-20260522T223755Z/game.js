// Simple Starfall Defender game
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 600;
  // Generate starfield
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.5,
    });
  }
  const planet = { x: W / 2, y: H / 2, r: 40 };
  const ship = {
    radius: 20,
    orbit: planet.r + 30,
    angle: 0, // radians
    rotationSpeed: Math.PI / 180 * 3,
  };

  const asteroids = [];
  const lasers = [];
  let lastAsteroid = 0;
  let gameOver = false;
  const keys = {};

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration / 1000);
  }
  function playLaser() { playTone(800, 100); }
  function playExplosion() { playTone(200, 300); }
  function playGameOver() { playTone(100, 600); }

  // Input handling
  window.addEventListener('keydown', e => { 
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.code] = true; 
  });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  function spawnAsteroid() {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.max(W, H) * 0.6;
    asteroids.push({
      x: planet.x + Math.cos(angle) * distance,
      y: planet.y + Math.sin(angle) * distance,
      vx: (planet.x - (planet.x + Math.cos(angle) * distance)) * 0.0015,
      vy: (planet.y - (planet.y + Math.sin(angle) * distance)) * 0.0015,
      r: 10 + Math.random() * 10,
    });
  }

  function fireLaser() {
    const sx = planet.x + Math.cos(ship.angle) * ship.orbit;
    const sy = planet.y + Math.sin(ship.angle) * ship.orbit;
    const speed = 5;
    lasers.push({
      x: sx,
      y: sy,
      vx: Math.cos(ship.angle) * speed,
      vy: Math.sin(ship.angle) * speed,
    });
    playLaser();
  }

  function update(dt) {
    if (gameOver) return;
    // Ship rotation
    if (keys['ArrowLeft']) ship.angle -= ship.rotationSpeed;
    if (keys['ArrowRight']) ship.angle += ship.rotationSpeed;
    // Fire
    if (keys['Space']) {
      if (!keys._spacePressed) {
        fireLaser();
        keys._spacePressed = true;
      }
    } else {
      keys._spacePressed = false;
    }

    // Spawn asteroids every 1.5s
    const now = performance.now();
    if (now - lastAsteroid > 1500) {
      spawnAsteroid();
      lastAsteroid = now;
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      // Collision with planet
      const dxp = a.x - planet.x;
      const dyp = a.y - planet.y;
      if (Math.hypot(dxp, dyp) < planet.r + a.r) {
        gameOver = true;
        playExplosion();
        playGameOver();
        alert('Game Over: Planet smashed!');
        return;
      }
      // Collision with ship
      const sx = planet.x + Math.cos(ship.angle) * ship.orbit;
      const sy = planet.y + Math.sin(ship.angle) * ship.orbit;
      const dxs = a.x - sx;
      const dys = a.y - sy;
if (Math.hypot(dxs, dys) < a.r + 8) {
          gameOver = true;
          playExplosion();
          playGameOver();
          alert('Game Over: Ship destroyed!');
          return;
        }
    }

    // Update lasers
    for (let i = lasers.length - 1; i >= 0; i--) {
      const l = lasers[i];
      l.x += l.vx * dt;
      l.y += l.vy * dt;
      // Remove off‑screen
      if (l.x < 0 || l.x > W || l.y < 0 || l.y > H) lasers.splice(i, 1);
    }

    // Laser‑asteroid collisions
    for (let i = lasers.length - 1; i >= 0; i--) {
      const l = lasers[i];
      for (let j = asteroids.length - 1; j >= 0; j--) {
        const a = asteroids[j];
        if (Math.hypot(l.x - a.x, l.y - a.y) < a.r) {
          lasers.splice(i, 1);
          asteroids.splice(j, 1);
          playExplosion();
          break;
        }
      }
    }
  }

  function draw() {
// Background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    // Stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // Planet with radial gradient
    const planetGrad = ctx.createRadialGradient(planet.x, planet.y, planet.r * 0.2, planet.x, planet.y, planet.r);
    planetGrad.addColorStop(0, '#3ddc84');
    planetGrad.addColorStop(1, '#2b8a3e');
    ctx.fillStyle = planetGrad;
    ctx.beginPath();
    ctx.arc(planet.x, planet.y, planet.r, 0, Math.PI * 2);
    ctx.fill();

    // Ship (triangle)
    const sx = planet.x + Math.cos(ship.angle) * ship.orbit;
    const sy = planet.y + Math.sin(ship.angle) * ship.orbit;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(ship.angle);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(6, 8);
    ctx.lineTo(-6, 8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Asteroids with gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.3, a.x, a.y, a.r);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Lasers
    ctx.strokeStyle = '#ff0';
    ctx.lineWidth = 2;
    lasers.forEach(l => {
      ctx.beginPath();
      ctx.moveTo(l.x, l.y);
      ctx.lineTo(l.x - l.vx * 2, l.y - l.vy * 2);
      ctx.stroke();
    });
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
