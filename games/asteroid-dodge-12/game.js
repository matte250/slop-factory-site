// Simple Asteroid Dodge game
// Assumes a <canvas id="game"></canvas> exists in the HTML.

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.clientWidth || 400;
  canvas.height = canvas.clientHeight || 600;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  const playShoot = () => playTone(600, 0.08);
  const playExplosion = () => playTone(150, 0.15);
  const playGameOver = () => playTone(80, 0.5);

  // Star field background
  const starCount = 80;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 1.5 + 0.5
    });
  }

  // Ship – represented as a triangle
  const ship = {
    w: 40,
    h: 20,
    x: canvas.width / 2 - 20,
    y: canvas.height - 30,
    speed: 5,
    draw() {
      ctx.save();
      ctx.fillStyle = '#0ff'; // cyan ship
      ctx.beginPath();
      // triangle pointing up
      ctx.moveTo(this.x, this.y + this.h);
      ctx.lineTo(this.x + this.w / 2, this.y);
      ctx.lineTo(this.x + this.w, this.y + this.h);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  };

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; audioCtx.resume(); });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // Bullets
  const bullets = [];
  function shoot() {
    // Play shooting sound
    playShoot();
    bullets.push({ x: ship.x + ship.w / 2, y: ship.y, r: 3, speed: 7 });
  }

  // Asteroids
  const asteroids = [];
  let asteroidTimer = 0;
  const asteroidInterval = 90; // frames

  function spawnAsteroid() {
    const radius = Math.random() * 15 + 10;
    const x = Math.random() * (canvas.width - radius * 2) + radius;
    const speed = 1 + Math.random() * 1.5;
    asteroids.push({ x, y: -radius, r: radius, speed });
  }

  let gameOver = false;

  function update() {
    if (gameOver) return;

    // Move ship
    if (keys.ArrowLeft) ship.x = Math.max(0, ship.x - ship.speed);
    if (keys.ArrowRight) ship.x = Math.min(canvas.width - ship.w, ship.x + ship.speed);
    if (keys[' '] && !keys._spacePressed) { shoot(); keys._spacePressed = true; }
    if (!keys[' ']) keys._spacePressed = false;

    // Update bullets
    bullets.forEach(b => b.y -= b.speed);
    // Remove off‑screen bullets
    while (bullets.length && bullets[0].y < 0) bullets.shift();

    // Update asteroids
    asteroids.forEach(a => a.y += a.speed);
    // Spawn new asteroids
    if (++asteroidTimer > asteroidInterval) { spawnAsteroid(); asteroidTimer = 0; }

    // Collision: bullet‑asteroid
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      for (let j = asteroids.length - 1; j >= 0; j--) {
        const a = asteroids[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        if (dx * dx + dy * dy < (b.r + a.r) ** 2) {
          // Play explosion sound
          playExplosion();
          bullets.splice(i, 1);
          asteroids.splice(j, 1);
          break;
        }
      }
    }

    // Collision: ship‑asteroid or asteroid reaches bottom
    for (const a of asteroids) {
      const hitX = a.x > ship.x && a.x < ship.x + ship.w;
      const hitY = a.y + a.r > ship.y;
        if ((hitX && hitY) || a.y - a.r > canvas.height) {
        // Play game over sound
        playGameOver();
        gameOver = true;
        break;
      }
    }
  }

  function draw() {
    // Background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Stars
    ctx.fillStyle = '#555';
    stars.forEach(s => { ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2); ctx.fill(); });

    ship.draw();
    // Bullets with glow
    bullets.forEach(b => {
      ctx.save();
      ctx.shadowColor = '#ff0';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#ff0';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    // Asteroids with gradient
    ctx.save();
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#444');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Start game
  requestAnimationFrame(loop);
})();
