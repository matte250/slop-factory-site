// Asteroid Escape – enhanced graphics
// Canvas with id "game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Game state
  const ship = { x: width / 2, y: height - 80, radius: 20, shield: false };
  let mouseX = ship.x;
  const asteroids = [];
  const powerUps = [];
  let lastAsteroid = 0;
  let lastPower = 0;
  let fuel = 60; // seconds
  let shieldTimer = 0;
  let gameOver = false;
  let lastTime = performance.now();

  // Starfield – persistent twinkling stars
  const starCount = 120;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5 + 0.5,
      tw: Math.random() * 0.5 + 0.5 // opacity target
    });
  }

  // Helpers – random and distance
  const rand = (min, max) => Math.random() * (max - min) + min;
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  // Sound manager using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };
  const sounds = {
    shield: () => playTone(600, 0.15),
    explosion: () => playTone(200, 0.4),
    power: () => playTone(800, 0.1)
  };
  // Input – mouse and touch
  const setShipPos = (x) => {
    mouseX = Math.max(ship.radius, Math.min(width - ship.radius, x));
  };
  canvas.addEventListener('mousemove', (e) => setShipPos(e.offsetX));
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    setShipPos(touch.clientX - rect.left);
  }, { passive: false });

  // Main loop
  function loop(now) {
    const dt = (now - lastTime) / 1000;
    lastTime = now;
    if (!gameOver) update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  function update(dt) {
    // Ship follows mouse smoothly
    ship.x += (mouseX - ship.x) * 0.12;

    // Asteroid spawning
    lastAsteroid += dt;
    if (lastAsteroid > 0.7) {
      lastAsteroid = 0;
      asteroids.push({
        x: rand(0, width),
        y: -30,
        radius: rand(15, 30),
        speed: rand(120, 260)
      });
    }
    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed * dt;
      if (a.y - a.radius > height) asteroids.splice(i, 1);
      else if (!ship.shield && distance(ship, a) < ship.radius + a.radius) {
        // Play collision/explosion sound
        sounds.explosion();
        gameOver = true;
      }
    }

    // Power‑up spawning
    lastPower += dt;
    if (lastPower > 5) {
      lastPower = 0;
      powerUps.push({ x: rand(0, width), y: -20, radius: 12, speed: 130, active: true });
    }
    // Update power‑ups
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const p = powerUps[i];
      p.y += p.speed * dt;
      if (p.y - p.radius > height) powerUps.splice(i, 1);
      else if (p.active && distance(ship, p) < ship.radius + p.radius) {
        ship.shield = true;
        shieldTimer = 3; // seconds
        p.active = false;
        powerUps.splice(i, 1);
        // Play shield activation sound
        sounds.shield();
      }
    }

    // Shield timer
    if (ship.shield) {
      shieldTimer -= dt;
      if (shieldTimer <= 0) ship.shield = false;
    }

    // Fuel countdown
    fuel -= dt;
    if (fuel <= 0) gameOver = true;

    // Update star twinkle (simple opacity oscillation)
    stars.forEach(s => {
      s.r = Math.max(0.5, Math.min(2, s.r + (Math.random() - 0.5) * dt));
    });
  }

  function drawBackground() {
    // Gradient space background
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#00102a');
    grad.addColorStop(1, '#000000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }

  function drawStars() {
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawShip() {
    ctx.save();
    ctx.translate(ship.x, ship.y);
    // ship body – gradient fill for depth
    const shipGrad = ctx.createLinearGradient(0, -ship.radius, 0, ship.radius);
    shipGrad.addColorStop(0, ship.shield ? '#00ffff' : '#ffffff');
    shipGrad.addColorStop(1, ship.shield ? '#0055ff' : '#aaaaaa');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(0, -ship.radius);
    ctx.lineTo(ship.radius, ship.radius);
    ctx.lineTo(-ship.radius, ship.radius);
    ctx.closePath();
    ctx.fill();
    // outline
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  function drawAsteroids() {
    asteroids.forEach(a => {
      const grd = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
      grd.addColorStop(0, '#777');
      grd.addColorStop(1, '#222');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawPowerUps() {
    ctx.fillStyle = 'gold';
    powerUps.forEach(p => {
      if (!p.active) return;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawHUD() {
    // Fuel bar
    ctx.fillStyle = 'limegreen';
    const barWidth = 150;
    ctx.fillRect(10, 10, barWidth * Math.max(0, fuel / 60), 8);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 10, barWidth, 8);
    // Shield indicator
    if (ship.shield) {
      ctx.fillStyle = '#00ffff';
      ctx.font = '14px sans-serif';
      ctx.fillText('Shield', 10, 30);
    }
    // Game over message
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function draw() {
    drawBackground();
    drawStars();
    drawShip();
    drawAsteroids();
    drawPowerUps();
    drawHUD();
  }

  requestAnimationFrame(loop);
})();
