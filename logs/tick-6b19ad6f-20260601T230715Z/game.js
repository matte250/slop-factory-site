// Simple Asteroid Dodge game
// Canvas element with id="game" is expected in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  // Set a default size if not defined in HTML/CSS
  canvas.width = canvas.width || 800;
  canvas.height = canvas.height || 600;
  // Initialize audio context
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain).connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur / 1000);
  }
  // Sound helpers
  function soundCollision() { playTone(200, 150); }
  function soundShield() { playTone(400, 100); }
  function soundPowerUp() { playTone(800, 100); }
  function soundGameOver() { playTone(100, 300); }
  // Create starfield
  const starCount = 100;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      brightness: Math.random() * 0.7 + 0.3,
    });
  }

  // Ship definition
  const ship = {
    width: 40,
    height: 20,
    x: canvas.width / 2 - 20,
    y: canvas.height - 30,
    speed: 5,
    moveLeft: false,
    moveRight: false,
  };

  // Asteroid pool
  const asteroids = [];
  let asteroidSpawnTimer = 0;
  let asteroidSpawnInterval = 1000; // ms
  let lastTime = 0;
  let gameOver = false;

  // Power‑up (optional, simple shield)
  const powerUps = [];
  let shield = false;
  let shieldTimer = 0;

  // Input handling
  window.addEventListener('keydown', (e) => {
    // Resume audio context on first user interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (e.key === 'ArrowLeft') ship.moveLeft = true;
    if (e.key === 'ArrowRight') ship.moveRight = true;
  });
  window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft') ship.moveLeft = false;
    if (e.key === 'ArrowRight') ship.moveRight = false;
  });

  function spawnAsteroid() {
    const size = Math.random() * 30 + 20;
    const x = Math.random() * (canvas.width - size);
    const speed = 2 + Math.random() * 2 + asteroids.length * 0.05; // increase over time
    asteroids.push({ x, y: -size, size, speed });
  }

  function spawnPowerUp() {
    const size = 20;
    const x = Math.random() * (canvas.width - size);
    const speed = 1.5;
    powerUps.push({ x, y: -size, size, speed, type: 'shield' });
  }

  function update(delta) {
    // move ship
    if (ship.moveLeft) ship.x -= ship.speed;
    if (ship.moveRight) ship.x += ship.speed;
    // keep within bounds
    ship.x = Math.max(0, Math.min(canvas.width - ship.width, ship.x));

    // spawn asteroids
    asteroidSpawnTimer += delta;
    if (asteroidSpawnTimer > asteroidSpawnInterval) {
      spawnAsteroid();
      asteroidSpawnTimer = 0;
      // occasional power‑up
      if (Math.random() < 0.1) spawnPowerUp();
    }

    // update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // remove off‑screen
      if (a.y > canvas.height) asteroids.splice(i, 1);
    }

    // update power‑ups
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const p = powerUps[i];
      p.y += p.speed;
      if (p.y > canvas.height) powerUps.splice(i, 1);
    }

    // shield timer
    if (shield) {
      shieldTimer -= delta;
      if (shieldTimer <= 0) shield = false;
    }

    // collision detection
    // ship rectangle
    const shipRect = { x: ship.x, y: ship.y, w: ship.width, h: ship.height };
    // asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      const aRect = { x: a.x, y: a.y, w: a.size, h: a.size };
      if (rectIntersect(shipRect, aRect)) {
        if (shield) {
          // destroy asteroid, shield consumed
          asteroids.splice(i, 1);
          shield = false;
          soundShield();
        } else {
          soundCollision();
          gameOver = true;
          soundGameOver();
        }
      }
    }
      }
    }
    // power‑ups
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const p = powerUps[i];
      const pRect = { x: p.x, y: p.y, w: p.size, h: p.size };
      if (rectIntersect(shipRect, pRect)) {
        if (p.type === 'shield') {
          shield = true;
          shieldTimer = 5000; // 5 seconds
          soundShield();
        }
        soundPowerUp();
        powerUps.splice(i, 1);
      }
    }
  }

  function rectIntersect(r1, r2) {
    return !(r2.x > r1.x + r1.w ||
             r2.x + r2.w < r1.x ||
             r2.y > r1.y + r1.h ||
             r2.y + r2.h < r1.y);
  }

function draw() {
  // Draw starfield background
  ctx.fillStyle = '#000010';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // small twinkling stars
  stars.forEach(star => {
    ctx.fillStyle = 'white';
    ctx.globalAlpha = star.brightness;
    ctx.fillRect(star.x, star.y, 2, 2);
    // simple twinkle
    star.brightness += (Math.random() - 0.5) * 0.05;
    star.brightness = Math.min(1, Math.max(0.3, star.brightness));
  });
  ctx.globalAlpha = 1;

  // ship as triangle
  ctx.fillStyle = shield ? '#00ffff' : '#ffffff';
  ctx.beginPath();
  ctx.moveTo(ship.x, ship.y + ship.height);
  ctx.lineTo(ship.x + ship.width / 2, ship.y);
  ctx.lineTo(ship.x + ship.width, ship.y + ship.height);
  ctx.closePath();
  ctx.fill();

  // asteroids with radial gradient
  asteroids.forEach(a => {
    const grad = ctx.createRadialGradient(
      a.x + a.size / 2,
      a.y + a.size / 2,
      a.size * 0.1,
      a.x + a.size / 2,
      a.y + a.size / 2,
      a.size / 2
    );
    grad.addColorStop(0, '#777777');
    grad.addColorStop(1, '#222222');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(a.x + a.size / 2, a.y + a.size / 2, a.size / 2, 0, Math.PI * 2);
    ctx.fill();
  });

  // power‑ups as rotating shield icons
  powerUps.forEach(p => {
    ctx.save();
    ctx.translate(p.x + p.size / 2, p.y + p.size / 2);
    ctx.rotate((Date.now() % 2000) / 2000 * Math.PI * 2);
    ctx.fillStyle = 'gold';
    ctx.beginPath();
    ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // Game over overlay
  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'red';
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
  }
}

  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const delta = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) update(delta);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // start the game
  requestAnimationFrame(loop);
})();
