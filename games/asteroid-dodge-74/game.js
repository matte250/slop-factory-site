// Minimal Asteroid Dodge game
// Canvas with id="game" expected in the HTML

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration = 0.1, type = 'sine') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }
  const sounds = {
    shield: () => playTone(800, 0.2, 'triangle'),
    explosion: () => playTone(150, 0.3, 'sawtooth'),
    gameOver: () => playTone(60, 0.5, 'square'),
  };
  // Resume audio on first user interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); window.removeEventListener('keydown', resumeAudio); };
  window.addEventListener('keydown', resumeAudio);

  // Ship state
  const ship = {
    x: width * 0.1,
    y: height / 2,
    radius: 15,
    speed: 4,
    shield: false,
    shieldTimer: 0,
  };

  // Simple starfield for background
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

  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; if (e.key === ' ') activateShield(); });
  window.addEventListener('keyup', e => delete keys[e.key]);

  function activateShield() {
    if (ship.shieldTimer <= 0) {
      ship.shield = true;
      ship.shieldTimer = 180; // frames (~3s at 60fps)
      sounds.shield(); // play shield activation sound
    }
  }

  // Asteroid pool
  const asteroids = [];
  const spawnInterval = 90; // frames
  let spawnCounter = 0;

  function spawnAsteroid() {
    const radius = 10 + Math.random() * 20;
    asteroids.push({
      x: width + radius,
      y: Math.random() * height,
      radius,
      speed: 2 + Math.random() * 3,
    });
  }

  function update() {
    // Ship movement
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    // Keep within bounds
    ship.x = Math.max(ship.radius, Math.min(width - ship.radius, ship.x));
    ship.y = Math.max(ship.radius, Math.min(height - ship.radius, ship.y));

    // Shield timer
    if (ship.shield) {
      ship.shieldTimer--;
      if (ship.shieldTimer <= 0) ship.shield = false;
    }

    // Asteroids
    spawnCounter++;
    if (spawnCounter >= spawnInterval) {
      spawnCounter = 0;
      spawnAsteroid();
    }
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed;
      if (a.x + a.radius < 0) asteroids.splice(i, 1);
    }
  }

  function draw() {
    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#001d3d');
    grad.addColorStop(1, '#000814');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Draw moving starfield
    ctx.fillStyle = 'white';
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
      s.x -= s.speed;
      if (s.x < 0) {
        s.x = width;
        s.y = Math.random() * height;
      }
    }

    // Draw ship with shadow effect
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.fillStyle = ship.shield ? '#00ffff' : '#ffffff';
    ctx.shadowColor = ship.shield ? '#00ffff' : '#ffffff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(0, -ship.radius);
    ctx.lineTo(ship.radius, ship.radius);
    ctx.lineTo(-ship.radius, ship.radius);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();

    // Draw asteroids with radial gradient
    asteroids.forEach(a => {
      const radGrad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
      radGrad.addColorStop(0, '#b0b0b0');
      radGrad.addColorStop(1, '#404040');
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function checkCollision() {
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.radius + ship.radius) {
        // Play explosion sound on any hit
        sounds.explosion();
        if (!ship.shield) return true;
        // shield absorbs one hit
        a.x = -100; // move asteroid off‑screen
      }
    }
    return false;
  }

  let gameOver = false;
  function loop() {
    if (gameOver) return;
    update();
    if (checkCollision()) {
      gameOver = true;
      sounds.gameOver();
      ctx.fillStyle = 'red';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
      return;
    }
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
