// Minimal Asteroid Escape game targeting canvas#game
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playBeep = (freq, duration) => {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  };
  const playThrust = () => playBeep(200, 0.05);
  const playExplosion = () => playBeep(100, 0.2);
  const playPowerup = () => playBeep(400, 0.1);
  const playGameOver = () => playBeep(50, 0.5);
  // Ensure audio context is resumed on first interaction
  const resumeAudio = () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    window.removeEventListener('keydown', resumeAudio);
  };
  window.addEventListener('keydown', resumeAudio);
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  // ----- Game state -----
  const ship = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    r: 12,
    angle: 0,
    vx: 0,
    vy: 0,
    thrust: 0.2,
    rotateSpeed: 0.07,
    health: 3,
  };

  const asteroids = [];
  const powerups = [];
  // background stars for parallax effect
  const stars = [];
  for (let i = 0; i < 150; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 1.5 + 0.3,
      speed: Math.random() * 0.3 + 0.1,
    });
  }
  let keys = {};
  let gameOver = false;

  // ----- Input -----
  window.addEventListener('keydown', e => (keys[e.code] = true));
  window.addEventListener('keyup', e => (keys[e.code] = false));

  // ----- Helpers -----
  const rand = (min, max) => Math.random() * (max - min) + min;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  const spawnAsteroid = () => {
    const size = rand(15, 40);
    const side = Math.random() < 0.5 ? 'left' : 'right';
    const x = side === 'left' ? -size : canvas.width + size;
    const y = rand(0, canvas.height);
    const vx = side === 'left' ? rand(0.5, 1.5) : -rand(0.5, 1.5);
    const angle = rand(0, Math.PI * 2);
    const angularVel = rand(-0.03, 0.03);
    asteroids.push({x, y, vx, vy: 0, size, angle, angularVel});
  };

  const spawnPowerup = () => {
    const size = 10;
    const x = rand(size, canvas.width - size);
    const y = -size;
    const vy = rand(0.5, 1);
    powerups.push({x, y, vy, size});
  };

  // ----- Game Loop -----
  let lastTime = 0;
  const update = (dt) => {
    if (gameOver) return;
    // Ship controls
    if (keys['ArrowLeft']) ship.angle -= ship.rotateSpeed;
    if (keys['ArrowRight']) ship.angle += ship.rotateSpeed;
    if (keys['ArrowUp']) {
      ship.vx += Math.cos(ship.angle) * ship.thrust;
      ship.vy += Math.sin(ship.angle) * ship.thrust;
      playThrust();
    }
    // Apply velocity & friction
    ship.x += ship.vx;
    ship.y += ship.vy;
    ship.vx *= 0.99;
    ship.vy *= 0.99;
    // Wrap around edges
    if (ship.x < 0) ship.x += canvas.width;
    if (ship.x > canvas.width) ship.x -= canvas.width;
    if (ship.y < 0) ship.y += canvas.height;
    if (ship.y > canvas.height) ship.y -= canvas.height;

    // Asteroids
    asteroids.forEach(a => {
      a.x += a.vx;
      a.y += a.vy;
      a.angle += a.angularVel;
      // wrap
      if (a.x < -a.size) a.x = canvas.width + a.size;
      if (a.x > canvas.width + a.size) a.x = -a.size;
      if (a.y < -a.size) a.y = canvas.height + a.size;
      if (a.y > canvas.height + a.size) a.y = -a.size;
    });
    // Powerups
    powerups.forEach(p => { p.y += p.vy; });
    // Background stars parallax
    stars.forEach(s => {
      s.y += s.speed;
      if (s.y > canvas.height) {
        s.y = 0;
        s.x = Math.random() * canvas.width;
      }
    });
    // Collision ship-asteroid
    asteroids.forEach(a => {
      if (dist(ship, a) < ship.r + a.size) {
        ship.health -= 1;
        a.size = 0; // destroy asteroid
        playExplosion();
      }
    });
    // Remove destroyed asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      if (asteroids[i].size <= 0) asteroids.splice(i, 1);
    }
    // Collision ship-powerup
    for (let i = powerups.length - 1; i >= 0; i--) {
      const p = powerups[i];
      if (dist(ship, p) < ship.r + p.size) {
        ship.health = Math.min(ship.health + 1, 5);
        powerups.splice(i, 1);
        playPowerup();
      }
    }
    // Cleanup off-screen powerups
    for (let i = powerups.length - 1; i >= 0; i--) {
      if (powerups[i].y > canvas.height + powerups[i].size) powerups.splice(i, 1);
    }
    // Spawn timing
    if (Math.random() < 0.02) spawnAsteroid();
    if (Math.random() < 0.001) spawnPowerup();
    if (ship.health <= 0) {
      playGameOver();
      gameOver = true;
    }
  };

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Ship
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.beginPath();
    ctx.moveTo(ship.r, 0);
    ctx.lineTo(-ship.r, ship.r / 2);
    ctx.lineTo(-ship.r, -ship.r / 2);
    ctx.closePath();
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.restore();
    // Asteroids
    ctx.fillStyle = 'gray';
    asteroids.forEach(a => {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.angle);
      ctx.beginPath();
      ctx.arc(0, 0, a.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    // Powerups
    ctx.fillStyle = 'lime';
    powerups.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    // Stars background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });
    // Ship with simple glow
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    // glow
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'cyan';
    ctx.fillStyle = 'cyan';
    ctx.beginPath();
    ctx.moveTo(ship.r, 0);
    ctx.lineTo(-ship.r, ship.r / 2);
    ctx.lineTo(-ship.r, -ship.r / 2);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
    // Asteroids with gradient
    asteroids.forEach(a => {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.angle);
      const grad = ctx.createRadialGradient(0, 0, a.size * 0.2, 0, 0, a.size);
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#222');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, a.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    // Powerups
    ctx.fillStyle = 'lime';
    powerups.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    // HUD
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText('Health: ' + ship.health, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '48px sans-serif';
      ctx.fillText('GAME OVER', canvas.width / 2 - 150, canvas.height / 2);
    }
  };

  const loop = (timestamp) => {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
