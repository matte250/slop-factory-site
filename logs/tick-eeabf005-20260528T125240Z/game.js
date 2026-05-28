// Simple Asteroid Dodge game
// Canvas element with id="game" must exist in the HTML.

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Pre‑generate starfield
  const stars = Array.from({length: 100}, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 1.5 + 0.5,
  }));

  // Audio context and helper
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // Spaceship
  const ship = {
    w: 30,
    h: 20,
    x: width / 2 - 15,
    y: height - 40,
    speed: 4,
    color: '#0f0',
  };

  // Input handling
  const keys = {};
  let audioStarted = false;
  window.addEventListener('keydown', e => { keys[e.key] = true; if (!audioStarted) { audioCtx.resume(); audioStarted = true; } });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // Asteroids
  const asteroids = [];
  const asteroidInterval = 1500; // ms
  const maxSpeed = 2.5;

  function spawnAsteroid() {
    // Choose random edge
    const edge = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3:left
    let x, y, vx, vy;
    const radius = 15 + Math.random() * 10;
    switch (edge) {
      case 0:
        x = Math.random() * width;
        y = -radius;
        vx = (Math.random() - 0.5) * maxSpeed;
        vy = Math.random() * maxSpeed + 0.5;
        break;
      case 1:
        x = width + radius;
        y = Math.random() * height;
        vx = -Math.random() * maxSpeed - 0.5;
        vy = (Math.random() - 0.5) * maxSpeed;
        break;
      case 2:
        x = Math.random() * width;
        y = height + radius;
        vx = (Math.random() - 0.5) * maxSpeed;
        vy = -Math.random() * maxSpeed - 0.5;
        break;
      case 3:
        x = -radius;
        y = Math.random() * height;
        vx = Math.random() * maxSpeed + 0.5;
        vy = (Math.random() - 0.5) * maxSpeed;
        break;
    }
    asteroids.push({ x, y, vx, vy, radius, color: '#f44' });
  }

  const spawnTimer = setInterval(spawnAsteroid, asteroidInterval);

  let startTime = performance.now();
  let gameOver = false;

  function update(dt) {
    // Move ship
    let moved = false;
    if (keys['ArrowLeft'] && ship.x > 0) { ship.x -= ship.speed; moved = true; }
    if (keys['ArrowRight'] && ship.x + ship.w < width) { ship.x += ship.speed; moved = true; }
    if (keys['ArrowUp'] && ship.y > 0) { ship.y -= ship.speed; moved = true; }
    if (keys['ArrowDown'] && ship.y + ship.h < height) { ship.y += ship.speed; moved = true; }
    if (moved) playBeep(150, 0.05);

    // Move asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx;
      a.y += a.vy;
      // Remove off‑screen asteroids
      if (a.x < -a.radius * 2 || a.x > width + a.radius * 2 || a.y < -a.radius * 2 || a.y > height + a.radius * 2) {
        asteroids.splice(i, 1);
      }
    }

    // Collision detection (circle‑rect)
    for (const a of asteroids) {
      const distX = Math.abs(a.x - (ship.x + ship.w / 2));
      const distY = Math.abs(a.y - (ship.y + ship.h / 2));
      if (distX > (ship.w / 2 + a.radius) || distY > (ship.h / 2 + a.radius)) continue;
      if (distX <= ship.w / 2 || distY <= ship.h / 2) { gameOver = true; playBeep(300, 0.3); break; }
      const dx = distX - ship.w / 2;
      const dy = distY - ship.h / 2;
      if (dx * dx + dy * dy <= a.radius * a.radius) { gameOver = true; playBeep(300, 0.3); break; }
    }
  }

function draw() {
    // Space background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    // Stars
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // Ship - already drawn as triangle in draw section below
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // Asteroids with radial gradient
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, a.radius);
      grad.addColorStop(0, '#fff');
      grad.addColorStop(1, a.color);
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }
    // Score
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${elapsed}s`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.font = '32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }
    // Score
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${elapsed}s`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.font = '32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  let lastTime = performance.now();
  function loop() {
    const now = performance.now();
    const dt = now - lastTime;
    lastTime = now;
    if (!gameOver) update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
    else clearInterval(spawnTimer);
  }

  requestAnimationFrame(loop);
});
