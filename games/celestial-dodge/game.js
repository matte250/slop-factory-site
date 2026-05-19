// game.js – simple Celestial Dodge
// Targets <canvas id="game"></canvas> present in the page.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // ----- Audio setup -----
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  // simple tone generator
  function playTone(freq, duration = 0.1, type = 'sine') {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }
  // background music loop (low hum)
  setInterval(() => playTone(100, 0.5, 'sawtooth'), 2000);

  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // ----- Game objects -----
  const stars = [];
  // pre‑populate starfield
  for (let i = 0; i < 200; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.5,
      speed: 20 + Math.random() * 30,
    });
  }
  const ship = {
    x: 100,
    y: height / 2,
    angle: 0, // radians
    vx: 0,
    vy: 0,
    radius: 12,
    thrust: 0.1,
    rotateSpeed: 0.07,
    shield: false,
    shieldTimer: 0,
  };

  const asteroids = [];
  const powerUps = [];

  let lastAsteroid = 0;
  let lastPower = 0;
  let gameOver = false;

  // ----- Input handling -----
  const keys = {};
  window.addEventListener('keydown', e => {
    // unlock audio on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.code] = true;
    if (e.code === 'ArrowUp') playTone(400, 0.05, 'triangle'); // thrust sound
  });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  function update(dt) {
    // update starfield
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.x -= s.speed * dt * 0.5; // slower than asteroids
      if (s.x < 0) {
        s.x = width;
        s.y = Math.random() * height;
        s.size = Math.random() * 2 + 0.5;
        s.speed = 20 + Math.random() * 30;
      }
    }
    if (gameOver) return;
    // ship rotation
    if (keys['ArrowLeft']) ship.angle -= ship.rotateSpeed;
    if (keys['ArrowRight']) ship.angle += ship.rotateSpeed;
    // thrust
    if (keys['ArrowUp']) {
      ship.vx += Math.cos(ship.angle) * ship.thrust;
      ship.vy += Math.sin(ship.angle) * ship.thrust;
    }
    // apply friction
    ship.vx *= 0.99;
    ship.vy *= 0.99;
    // move ship
    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;
    // keep within bounds
    if (ship.x < 0) ship.x = width;
    if (ship.x > width) ship.x = 0;
    if (ship.y < 0) ship.y = height;
    if (ship.y > height) ship.y = 0;

    // shield timer
    if (ship.shield) {
      ship.shieldTimer -= dt;
      if (ship.shieldTimer <= 0) ship.shield = false;
    }

    // spawn asteroids
    lastAsteroid += dt;
    if (lastAsteroid > 1.0) { // every second
      lastAsteroid = 0;
      const size = 15 + Math.random() * 20;
      asteroids.push({
        x: width + size,
        y: Math.random() * height,
        radius: size,
        speed: 100 + Math.random() * 100,
      });
    }

    // update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed * dt;
      if (a.x < -a.radius) asteroids.splice(i, 1);
    }

    // spawn power‑ups
    lastPower += dt;
    if (lastPower > 7) { // every 7 seconds
      lastPower = 0;
      powerUps.push({
        x: width + 20,
        y: Math.random() * height,
        radius: 10,
        speed: 120,
        type: 'shield',
      });
    }

    // update power‑ups
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const p = powerUps[i];
      p.x -= p.speed * dt;
      if (p.x < -p.radius) powerUps.splice(i, 1);
    }

    // collision detection
    const shipCenter = { x: ship.x, y: ship.y };
    // ship vs asteroids
    for (const a of asteroids) {
      const dx = shipCenter.x - a.x;
      const dy = shipCenter.y - a.y;
      const dist = Math.hypot(dx, dy);
      if (dist < ship.radius + a.radius) {
        if (ship.shield) {
          // shield consumes the hit and disappears
          playTone(600, 0.2, 'square'); // shield hit
          ship.shield = false;
        } else {
          playTone(200, 0.3, 'square');
            gameOver = true;
        }
        break;
      }
    }
    // ship vs power‑ups
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const p = powerUps[i];
      const dx = shipCenter.x - p.x;
      const dy = shipCenter.y - p.y;
      if (Math.hypot(dx, dy) < ship.radius + p.radius) {
        if (p.type === 'shield') {
          ship.shield = true;
          ship.shieldTimer = 5; // seconds
          playTone(800, 0.2, 'triangle'); // power‑up collected
        }
        powerUps.splice(i, 1);
      }
    }
  }

  function draw() {
    // clear
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    // draw starfield
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.globalAlpha = 0.8;
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }
    ctx.globalAlpha = 1.0;

    // draw ship (triangle) with outline and optional shield glow
    // ship glow when shield active
    if (ship.shield) {
      ctx.save();
      ctx.shadowColor = 'cyan';
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#0ff';
      ctx.beginPath();
      ctx.moveTo(ship.x + 15 * Math.cos(ship.angle), ship.y + 15 * Math.sin(ship.angle));
      ctx.lineTo(ship.x - 10 * Math.cos(ship.angle) - 8 * Math.sin(ship.angle), ship.y - 10 * Math.sin(ship.angle) + 8 * Math.cos(ship.angle));
      ctx.lineTo(ship.x - 10 * Math.cos(ship.angle) + 8 * Math.sin(ship.angle), ship.y - 10 * Math.sin(ship.angle) - 8 * Math.cos(ship.angle));
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.fillStyle = ship.shield ? '#0ff' : '#fff';
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(-10, -8);
    ctx.lineTo(-10, 8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // draw asteroids
    ctx.fillStyle = '#888';
    for (const a of asteroids) {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // draw power‑ups
    ctx.fillStyle = '#0f0';
    for (const p of powerUps) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // UI – shield timer
    if (ship.shield) {
      ctx.fillStyle = '#0ff';
      ctx.font = '16px sans-serif';
      ctx.fillText('Shield: ' + ship.shieldTimer.toFixed(1) + 's', 10, 20);
    }
    if (gameOver) {
      ctx.fillStyle = '#f00';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  let last = performance.now();
  function loop(now) {
    const dt = (now - last) / 1000; // seconds
    last = now;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
