// Simple Canvas Dodge game
// Assumes there is a <canvas id="game"></canvas> in the HTML
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // ----- audio -----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // resume audio on first user interaction (required by browsers)
  const resumeAudio = () => { if (audioCtx.state !== 'running') audioCtx.resume(); };
  window.addEventListener('click', resumeAudio);
  window.addEventListener('keydown', resumeAudio);
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
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // ----- utilities -----
  const rand = (min, max) => Math.random() * (max - min) + min;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  // ----- player -----
  const ship = {
    x: width / 2,
    y: height - 60,
    radius: 12,
    speed: 4,
    vx: 0,
    vy: 0,
    shield: 0,
    draw() {
      // draw ship with gradient fill and slight tilt based on velocity
      ctx.save();
      ctx.translate(this.x, this.y);
      const angle = Math.atan2(this.vy, this.vx);
      ctx.rotate(angle * 0.2); // subtle tilt
      const grad = ctx.createLinearGradient(0, -12, 0, 12);
      grad.addColorStop(0, this.shield ? 'cyan' : '#ffd700');
      grad.addColorStop(1, this.shield ? '#00ffff' : '#ffa500');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(10, 12);
      ctx.lineTo(-10, 12);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  };

  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function updateShip() {
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    // keep inside bounds
    ship.x = Math.max(ship.radius, Math.min(width - ship.radius, ship.x));
    ship.y = Math.max(ship.radius, Math.min(height - ship.radius, ship.y));
    if (ship.shield > 0) ship.shield--;
  }

  // ----- starfield -----
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({ x: rand(0, width), y: rand(0, height), size: rand(0.5, 2) });
  }
  function drawStars() {
    // dark space background
    ctx.fillStyle = '#001020';
    ctx.fillRect(0, 0, width, height);
    // draw twinkling stars as circles with varying opacity
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size / 2, 0, Math.PI * 2);
      const opacity = 0.5 + Math.random() * 0.5;
      ctx.fillStyle = `rgba(255,255,255,${opacity})`;
      ctx.fill();
      s.y += 0.5; // scroll downwards
      if (s.y > height) { s.y = 0; s.x = rand(0, width); }
    });
  }

  // ----- asteroids -----
  const asteroids = [];
  function spawnAsteroid() {
    const size = rand(15, 30);
    asteroids.push({
      x: rand(0, width),
      y: -size,
      r: size,
      speed: rand(1, 3)
    });
  }
  let asteroidTimer = 0;

  // ----- power‑ups -----
  const powerUps = [];
  function spawnPowerUp() {
    powerUps.push({
      x: rand(0, width),
      y: -20,
      r: 8,
      speed: 2,
      type: Math.random() < 0.5 ? 'speed' : 'shield'
    });
  }
  let powerTimer = 0;

  function updateAsteroids() {
    asteroidTimer -= 1;
    if (asteroidTimer <= 0) {
      spawnAsteroid();
      asteroidTimer = 60; // roughly one per second
    }
    asteroids.forEach(a => a.y += a.speed);
    // remove off‑screen
    for (let i = asteroids.length - 1; i >= 0; i--) {
      if (asteroids[i].y - asteroids[i].r > height) asteroids.splice(i, 1);
    }
  }

  function updatePowerUps() {
    powerTimer -= 1;
    if (powerTimer <= 0) {
      spawnPowerUp();
      powerTimer = 300; // occasional
    }
    powerUps.forEach(p => p.y += p.speed);
    for (let i = powerUps.length - 1; i >= 0; i--) {
      if (powerUps[i].y - powerUps[i].r > height) powerUps.splice(i, 1);
    }
  }

  // ----- collision -----
  let gameOver = false;
  function checkCollisions() {
    // asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      if (dist(ship, a) < ship.radius + a.r) {
        if (ship.shield) {
          // destroy asteroid with a short chime
          playTone(400, 0.1, 'triangle');
          asteroids.splice(i, 1);
          ship.shield = 0;
        } else {
          // collision – game over crash sound
          playTone(150, 0.5, 'sawtooth');
          gameOver = true;
        }
        return;
      }
    }
    // power‑ups
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const p = powerUps[i];
      if (dist(ship, p) < ship.radius + p.r) {
        if (p.type === 'shield') {
          ship.shield = 180; // 3 seconds
          playTone(600, 0.2, 'sine');
        } else {
          ship.speed += 2; // speed boost
          playTone(800, 0.15, 'square');
        }
        powerUps.splice(i, 1);
      }
    }
  }

  // ----- main loop -----
  function loop() {
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = 'white';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
      return;
    }
    drawStars();
    updateShip();
    updateAsteroids();
    updatePowerUps();
    checkCollisions();
    // draw entities
    ship.draw();
    // draw asteroids with rocky gradient and slight rotation
    asteroids.forEach(a => {
      ctx.save();
      ctx.translate(a.x, a.y);
      const rot = (a.speed / 3) * Math.PI; // rotate based on speed
      ctx.rotate(rot);
      const grad = ctx.createRadialGradient(0, 0, a.r * 0.2, 0, 0, a.r);
      grad.addColorStop(0, '#777777');
      grad.addColorStop(1, '#333333');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, a.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    powerUps.forEach(p => {
      ctx.fillStyle = p.type === 'shield' ? 'cyan' : 'lime';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    requestAnimationFrame(loop);
  }

  // start
  requestAnimationFrame(loop);
})();
