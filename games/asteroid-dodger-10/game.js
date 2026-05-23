// Asteroid Dodger – concise implementation
// Assumes there is a <canvas id="game"></canvas> in the HTML.
(function () {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Ship
  const ship = {
    w: 40,
    h: 20,
    x: width / 2,
    y: height - 30,
    speed: 5,
    draw() {
      // gradient ship
      const grad = ctx.createLinearGradient(this.x - this.w / 2, this.y, this.x + this.w / 2, this.y + this.h);
      grad.addColorStop(0, '#0f0');
      grad.addColorStop(1, '#050');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - this.w / 2, this.y + this.h);
      ctx.lineTo(this.x + this.w / 2, this.y + this.h);
      ctx.closePath();
      ctx.fill();
    },
    move(dx) {
      this.x = Math.max(this.w / 2, Math.min(width - this.w / 2, this.x + dx * this.speed));
    }
  };

  // Asteroids
  const asteroids = [];
  const asteroidSpawnInterval = 1000; // ms
  const asteroidSpeed = 2;
  // starfield
  const starCount = 120;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height });
  }
  function spawnAsteroid() {
  // play spawn sound
  playTone(150, 0.08, 'sawtooth', 0.08);
    const size = Math.random() * 30 + 20;
    const x = Math.random() * (width - size) + size / 2;
    asteroids.push({ x, y: -size, size, speed: asteroidSpeed + Math.random() });
  }

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, length = 0.1, type = 'sine', volume = 0.2) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = volume;
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + length);
  }

    // Audio resume on interaction
    window.addEventListener('click', () => audioCtx.resume());
    // Input handling
    const keys = {};
    window.addEventListener('keydown', e => {
      keys[e.key] = true;
      // play move sound on horizontal movement keys
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'ArrowRight' || e.key === 'd') {
        playTone(300, 0.05, 'triangle', 0.1);
      }
    });
    window.addEventListener('keyup', e => (keys[e.key] = false));

  // Game state
  let lastTime = 0;
  let score = 0;
  let gameOver = false;

  function update(dt) {
    // ship movement (arrow keys or WASD)
    if (keys.ArrowLeft || keys.a) ship.move(-1);
    if (keys.ArrowRight || keys.d) ship.move(1);

    // update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // remove off‑screen
      if (a.y - a.size > height) asteroids.splice(i, 1);
    }

    // collision detection
    for (const a of asteroids) {
      const dx = Math.abs(a.x - ship.x);
      const dy = Math.abs(a.y - ship.y);
      const shipRadius = Math.max(ship.w, ship.h) / 2;
      if (dx < a.size / 2 + shipRadius && dy < a.size / 2 + shipRadius) {
        // collision sound
        playTone(80, 0.4, 'square', 0.3);
        gameOver = true;
        break;
      }
    }

    if (!gameOver) score += dt / 1000; // seconds survived
  }

  function draw() {
    // motion blur / fade
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(0, 0, width, height);
    // draw stars on dark background (already dark due to blur)
    ctx.fillStyle = '#555';
    for (const s of stars) {
      ctx.fillRect(s.x, s.y, 2, 2);
    }
    // ship with gradient
    ship.draw();
    // asteroids with gradient
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, a.size / 2);
      grad.addColorStop(0, '#f88');
      grad.addColorStop(1, '#800');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
      ctx.fillText('Final Score: ' + Math.floor(score), width / 2, height / 2 + 30);
    }
  }

  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  // start spawning and animation
  setInterval(spawnAsteroid, asteroidSpawnInterval);
  requestAnimationFrame(loop);
})();
