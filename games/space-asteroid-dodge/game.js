// Simple endless‑runner asteroid dodge game with improved graphics
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Audio setup
  let audioCtx;
  function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  function playTone(freq, duration) {
    initAudio();
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
  function playCollision() { playTone(150, 0.3); }
  function playThrust() { playTone(400, 0.07); }

  // Starfield for background
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 0.5 + 0.2,
    });
  }

  // Ship
  const ship = {
    x: width * 0.1,
    y: height / 2,
    w: 30,
    h: 20,
    speed: 4,
    color: '#0f0',
    draw() {
      // Ship with simple gradient for a shiny effect
      const grad = ctx.createLinearGradient(this.x - this.w, this.y - this.h / 2, this.x, this.y + this.h / 2);
      grad.addColorStop(0, '#0f0');
      grad.addColorStop(1, '#050');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - this.w, this.y - this.h / 2);
      ctx.lineTo(this.x - this.w, this.y + this.h / 2);
      ctx.closePath();
      ctx.fill();
    }
  };

  // Asteroid pool
  const asteroids = [];
  const asteroidBaseSize = 20;
  const asteroidBaseSpeed = 2;
  let spawnTimer = 0;
  let spawnInterval = 90; // frames
  let score = 0;
  let gameOver = false;

  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnAsteroid() {
    const size = asteroidBaseSize + Math.random() * 30;
    const speed = asteroidBaseSpeed + Math.random() * 2 + score * 0.001; // speed up over time
    const y = Math.random() * (height - size);
    asteroids.push({ x: width + size, y, w: size, h: size, speed, color: '#888' });
  }

  function update() {
  // Update starfield
  for (const s of stars) {
    s.x -= s.speed;
    if (s.x < 0) {
      s.x = width;
      s.y = Math.random() * height;
      s.radius = Math.random() * 1.5 + 0.5;
      s.speed = Math.random() * 0.5 + 0.2;
    }
  }
    if (gameOver) return;

    // Move ship and play thrust sound
    let moved = false;
    if (keys.ArrowUp || keys.w) { ship.y -= ship.speed; moved = true; }
    if (keys.ArrowDown || keys.s) { ship.y += ship.speed; moved = true; }
    if (keys.ArrowLeft || keys.a) { ship.x -= ship.speed; moved = true; }
    if (keys.ArrowRight || keys.d) { ship.x += ship.speed; moved = true; }
    if (moved) playThrust();
    // Keep within bounds
    ship.y = Math.max(ship.h / 2, Math.min(height - ship.h / 2, ship.y));
    ship.x = Math.max(ship.w, Math.min(width - ship.w, ship.x));

    // Spawn asteroids
    spawnTimer++;
    if (spawnTimer >= spawnInterval) {
      spawnAsteroid();
      spawnTimer = 0;
      // gradually increase difficulty
      if (spawnInterval > 30) spawnInterval -= 0.5;
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed;
      if (a.x + a.w < 0) asteroids.splice(i, 1);
      // Collision check (simple AABB)
      if (
        ship.x < a.x + a.w &&
        ship.x + ship.w > a.x &&
        ship.y < a.y + a.h &&
        ship.y + ship.h > a.y
      ) {
        gameOver = true;
        playCollision();
      }
    }
    score++;
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#000020');
    bgGrad.addColorStop(1, '#000040');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // Draw starfield
    for (const s of stars) {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // Ship
    ship.draw();
    // Asteroids
    for (const a of asteroids) {
      // Asteroid with radial gradient for depth
      const grad = ctx.createRadialGradient(
        a.x, a.y, a.w * 0.1,
        a.x, a.y, a.w / 2
      );
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.w / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score / 60), 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f44';
      ctx.font = '32px sans-serif';
      ctx.fillText('Game Over', width / 2 - 80, height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Start the game loop
  requestAnimationFrame(loop);
})();
