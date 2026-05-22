// Cosmic Courier – simple endless runner on canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id="game" not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;
  // Audio context and simple sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    osc.frequency.value = freq;
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playBoost() { playTone(600, 0.1); }
  function playCrash() { playTone(200, 0.3); }

  // Game state
  let score = 0;
  let highScore = Number(localStorage.getItem('cosmicHighScore')) || 0;
  let gameOver = false;
  let lastTime = 0;

  // Ship
  const ship = {
    x: width * 0.1,
    y: height / 2,
    w: 20,
    h: 10,
    speed: 200, // pixels per second
    boost: 1,
    color: '#0ff'
  };

  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    ship.y = e.clientY - rect.top;
  });

  // Entities
  const asteroids = [];
  const crates = [];
  // Starfield
  const starCount = 100;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      speed: Math.random() * 30 + 20,
    });
  }
  const asteroidSpawnInterval = 1000; // ms
  const crateSpawnInterval = 3000; // ms
  let asteroidTimer = 0;
  let crateTimer = 0;

  function spawnAsteroid() {
    const size = Math.random() * 30 + 10;
    asteroids.push({
      x: width + size,
      y: Math.random() * (height - size),
      r: size,
      speed: 150 + Math.random() * 100,
    });
  }

  function spawnCrate() {
    const size = 12;
    crates.push({
      x: width + size,
      y: Math.random() * (height - size),
      w: size,
      h: size,
      speed: 150,
    });
  }

  function update(dt) {
    if (gameOver) return;
    // Ship movement (arrow keys)
    if (keys.ArrowUp) ship.y -= ship.speed * ship.boost * dt;
    if (keys.ArrowDown) ship.y += ship.speed * ship.boost * dt;
    if (keys.ArrowLeft) ship.x -= ship.speed * ship.boost * dt;
    if (keys.ArrowRight) ship.x += ship.speed * ship.boost * dt;
    // Clamp to canvas
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));
    ship.y = Math.max(0, Math.min(height - ship.h, ship.y));

    // Spawn logic
    asteroidTimer += dt * 1000;
    if (asteroidTimer > asteroidSpawnInterval) {
      spawnAsteroid();
      asteroidTimer = 0;
    }
    crateTimer += dt * 1000;
    if (crateTimer > crateSpawnInterval) {
      spawnCrate();
      crateTimer = 0;
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed * dt;
      // Collision with ship (circle-rect)
      const dx = Math.max(ship.x - a.x, 0, a.x - (ship.x + ship.w));
      const dy = Math.max(ship.y - a.y, 0, a.y - (ship.y + ship.h));
      if (dx * dx + dy * dy < a.r * a.r) {
        endGame();
        return;
      }
      if (a.x + a.r < 0) asteroids.splice(i, 1);
    }

    // Update crates
    for (let i = crates.length - 1; i >= 0; i--) {
      const c = crates[i];
      c.x -= c.speed * dt;
      // Simple AABB collision
      if (
        ship.x < c.x + c.w &&
        ship.x + ship.w > c.x &&
        ship.y < c.y + c.h &&
        ship.y + ship.h > c.y
      ) {
        score += 10;
        ship.boost = 1.5; // brief speed boost
        playBoost();
        setTimeout(() => (ship.boost = 1), 200);
        crates.splice(i, 1);
      } else if (c.x + c.w < 0) {
        crates.splice(i, 1);
      }
    }

    // Move stars for parallax effect
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.x -= s.speed * dt;
      if (s.x < 0) {
        s.x = width;
        s.y = Math.random() * height;
        s.speed = Math.random() * 30 + 20;
      }
    }

    // Increment score over time
    score += dt * 5;
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // Starfield background with moving stars
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#555';
    stars.forEach(s => {
      ctx.fillRect(s.x, s.y, 2, 2);
    });
    // Ship (triangle)
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h / 2);
    ctx.lineTo(ship.x + ship.w, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // Asteroids (gradient)
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#ff7777');
      grad.addColorStop(1, '#880000');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // Crates (glow)
    crates.forEach(c => {
      ctx.fillStyle = '#3a3';
      ctx.fillRect(c.x, c.y, c.w, c.h);
    });
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
    ctx.fillText('High: ' + highScore, 10, 40);
    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2 - 20);
      ctx.font = '18px sans-serif';
      ctx.fillText('Press Enter to Restart', width / 2, height / 2 + 20);
    }
  }

  function loop(timestamp) {
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  function endGame() {
    gameOver = true;
    playCrash();
    if (score > highScore) {
      highScore = Math.floor(score);
      localStorage.setItem('cosmicHighScore', highScore);
    }
  }

  function restart() {
    score = 0;
    gameOver = false;
    ship.x = width * 0.1;
    ship.y = height / 2;
    asteroids.length = 0;
    crates.length = 0;
    asteroidTimer = crateTimer = 0;
    ship.boost = 1;
  }

  window.addEventListener('keydown', e => {
    if (gameOver && e.key === 'Enter') restart();
  });

  requestAnimationFrame(loop);
})();
