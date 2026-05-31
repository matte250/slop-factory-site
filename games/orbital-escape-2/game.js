// game.js – simple Orbital Escape implementation
// Assumes an HTML canvas with id="game" exists.

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let thrustOsc = null;
  function playThrust(start) {
    if (start) {
      if (thrustOsc) return; // already playing
      thrustOsc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      thrustOsc.frequency.setValueAtTime(150, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      thrustOsc.connect(gain).connect(audioCtx.destination);
      thrustOsc.start();
    } else {
      if (thrustOsc) {
        thrustOsc.stop();
        thrustOsc.disconnect();
        thrustOsc = null;
      }
    }
  }
  function playCollision() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.setValueAtTime(80, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  }
  function playFuel() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.setValueAtTime(440, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
  }
  // Full‑window canvas
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const ship = {
    x: canvas.width / 2,
    y: canvas.height * 0.8,
    radius: 12,
    speed: 4,
    color: '#0ff',
    fuel: 100,
  };

  const stars = [];
  const asteroids = [];
  const fuels = [];
  let score = 0;
  let lastAsteroid = 0;
  let lastFuel = 0;
  const keys = {};

  // Input handling
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (e.key === 'ArrowUp') playThrust(true);
  });
  window.addEventListener('keyup', e => {
    keys[e.key] = false;
    if (e.key === 'ArrowUp') playThrust(false);
  });

  function spawnStar() {
    stars.push({ x: Math.random() * canvas.width, y: 0, size: Math.random() * 2 + 1, speed: Math.random() * 0.5 + 0.5 });
  }
  function spawnAsteroid() {
    const size = Math.random() * 30 + 20;
    asteroids.push({
      x: Math.random() * (canvas.width - size),
      y: -size,
      size,
      speed: Math.random() * 2 + 2,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: Math.random() * 0.02 + 0.01,
    });
  }
  function spawnFuel() {
    const size = 10;
    fuels.push({ x: Math.random() * (canvas.width - size), y: -size, size, speed: 1.5 });
  }

  function update(dt) {
    // Move ship based on keys
    if (keys['ArrowLeft']) ship.x -= ship.speed;
    if (keys['ArrowRight']) ship.x += ship.speed;
    if (keys['ArrowUp']) ship.y -= ship.speed;
    if (keys['ArrowDown']) ship.y += ship.speed;

    // Keep ship inside canvas
    ship.x = Math.max(ship.radius, Math.min(canvas.width - ship.radius, ship.x));
    ship.y = Math.max(ship.radius, Math.min(canvas.height - ship.radius, ship.y));

    // Fuel consumption
    ship.fuel -= dt * 0.02;
    if (ship.fuel <= 0) endGame();

    // Stars
    if (Math.random() < 0.05) spawnStar();
    stars.forEach(s => s.y += s.speed);
    while (stars.length && stars[0].y > canvas.height) stars.shift();

    // Asteroids
    if (performance.now() - lastAsteroid > 1500) { spawnAsteroid(); lastAsteroid = performance.now(); }
    asteroids.forEach(a => {
        a.y += a.speed;
        a.rotation += a.rotationSpeed;
      });
    asteroids.filter(a => a.y < canvas.height + a.size);
    // Remove off‑screen
    while (asteroids.length && asteroids[0].y > canvas.height + asteroids[0].size) asteroids.shift();

    // Fuel orbs
    if (performance.now() - lastFuel > 5000) { spawnFuel(); lastFuel = performance.now(); }
    fuels.forEach(f => f.y += f.speed);
    while (fuels.length && fuels[0].y > canvas.height + fuels[0].size) fuels.shift();

    // Collision detection (circle‑rectangle approx)
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      const dx = Math.abs(ship.x - (a.x + a.size / 2));
      const dy = Math.abs(ship.y - (a.y + a.size / 2));
      if (dx < a.size / 2 + ship.radius && dy < a.size / 2 + ship.radius) {
          playCollision();
          endGame();
        }
    }
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
      const dx = Math.abs(ship.x - (f.x + f.size / 2));
      const dy = Math.abs(ship.y - (f.y + f.size / 2));
if (dx < f.size / 2 + ship.radius && dy < f.size / 2 + ship.radius) {
          ship.fuel = Math.min(100, ship.fuel + 30);
          fuels.splice(i, 1);
          playFuel();
        }
    }

    // Score – distance travelled (time based)
    score += dt * 0.01;
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001020');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Stars with glow
    stars.forEach(s => {
      const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.size * 2);
      grad.addColorStop(0, 'rgba(255,255,255,0.9)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size * 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // Ship as triangle with thrust glow
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(Math.atan2(keys['ArrowDown'] - keys['ArrowUp'], keys['ArrowRight'] - keys['ArrowLeft'] || 0));
    ctx.beginPath();
    ctx.moveTo(0, -ship.radius);
    ctx.lineTo(ship.radius * 0.8, ship.radius);
    ctx.lineTo(-ship.radius * 0.8, ship.radius);
    ctx.closePath();
    ctx.fillStyle = ship.color;
    ctx.fill();
    // Thrust flame when moving forward
    if (keys['ArrowUp']) {
      const flameGrad = ctx.createRadialGradient(0, ship.radius, 0, 0, ship.radius + 10, 10);
      flameGrad.addColorStop(0, 'rgba(255,160,0,0.8)');
      flameGrad.addColorStop(1, 'rgba(255,0,0,0)');
      ctx.fillStyle = flameGrad;
      ctx.beginPath();
      ctx.moveTo(0, ship.radius);
      ctx.lineTo(5, ship.radius + 12);
      ctx.lineTo(-5, ship.radius + 12);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    // Asteroids with rotation
    asteroids.forEach(a => {
      ctx.save();
      ctx.translate(a.x + a.size/2, a.y + a.size/2);
      ctx.rotate(a.rotation || 0);
      ctx.fillStyle = '#666';
      ctx.beginPath();
      ctx.arc(0, 0, a.size/2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    // Fuel orbs with gradient
    fuels.forEach(f => {
      const grad = ctx.createRadialGradient(f.x + f.size/2, f.y + f.size/2, 0, f.x + f.size/2, f.y + f.size/2, f.size);
      grad.addColorStop(0, 'rgba(0,255,0,0.9)');
      grad.addColorStop(1, 'rgba(0,100,0,0.3)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(f.x + f.size/2, f.y + f.size/2, f.size/2, 0, Math.PI * 2);
      ctx.fill();
    });
    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${Math.floor(score)}`, 10, 20);
    ctx.fillText(`Fuel: ${Math.floor(ship.fuel)}`, 10, 40);
  }

  function loop(timestamp) {
    const dt = timestamp - (loop.last || timestamp);
    loop.last = timestamp;
    update(dt);
    draw();
    if (!loop.stopped) requestAnimationFrame(loop);
  }

  function endGame() {
    loop.stopped = true;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = '24px sans-serif';
    ctx.fillText(`Score: ${Math.floor(score)}` , canvas.width / 2, canvas.height / 2 + 20);
  }

  requestAnimationFrame(loop);
})();
