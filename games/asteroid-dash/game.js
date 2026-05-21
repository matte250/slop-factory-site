// Game based on IDEA.md – Asteroid Dash
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width = canvas.clientWidth;
  const HEIGHT = canvas.height = canvas.clientHeight;

  // Simple sound helper using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // Helper sounds
  function playCollision() { playTone(150, 0.15); }
  function playCollect() { playTone(400, 0.08); }
  function playGameOver() { playTone(80, 0.6); }

  // Ship – represented as a triangle
  const ship = {
    x: WIDTH / 2,
    y: HEIGHT - 40,
    size: 30,
    w: 30,
    h: 30,
    speed: 5,
    lives: 3,
  };
  const keys = {};
  // ensure audio context resumes on first interaction
  let audioInitialized = false;
  function ensureAudio(){ if(!audioInitialized){ audioCtx.resume(); audioInitialized = true; } }
  window.addEventListener('keydown', e => { ensureAudio(); keys[e.key] = true; });
  window.addEventListener('keyup', e => keys[e.key] = false);

  // Game objects
  const asteroids = [];
  const stars = [];
  let score = 0;
  let timer = 30; // seconds
  let lastAsteroid = 0;
  let lastStar = 0;
  const ASTEROID_INTERVAL = 1000; // ms
  const STAR_INTERVAL = 1500;

  function spawnAsteroid() {
    const size = 20 + Math.random() * 30;
    asteroids.push({
      x: Math.random() * (WIDTH - size),
      y: -size,
      w: size,
      h: size,
      vy: 2 + Math.random() * 3,
    });
  }

  function spawnStar() {
    const size = 10;
    stars.push({
      x: Math.random() * (WIDTH - size),
      y: -size,
      w: size,
      h: size,
      vy: 1.5 + Math.random() * 2,
    });
  }

  function rectsCollide(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function update(dt) {
    // ship movement
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    ship.x = Math.max(0, Math.min(WIDTH - ship.w, ship.x));

    // spawn
    if (Date.now() - lastAsteroid > ASTEROID_INTERVAL) { spawnAsteroid(); lastAsteroid = Date.now(); }
    if (Date.now() - lastStar > STAR_INTERVAL) { spawnStar(); lastStar = Date.now(); }

    // update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.vy;
      if (a.y > HEIGHT) asteroids.splice(i, 1);
      else if (rectsCollide(ship, a)) {
        ship.lives--;
        asteroids.splice(i, 1);
        playCollision();
        if (ship.lives <= 0) gameOver();
      }
    }

    // update stars
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.y += s.vy;
      if (s.y > HEIGHT) stars.splice(i, 1);
      else if (rectsCollide(ship, s)) {
        score += 10;
        stars.splice(i, 1);
        playCollect();
      }
    }

    // timer
    timer -= dt / 1000;
    if (timer <= 0) gameOver();
  }

function draw() {
    // Background – dark space gradient
    const bg = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    bg.addColorStop(0, '#001');
    bg.addColorStop(1, '#000');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // ship – green triangle
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y);
    ctx.lineTo(ship.x - ship.size / 2, ship.y + ship.size);
    ctx.lineTo(ship.x + ship.size / 2, ship.y + ship.size);
    ctx.closePath();
    ctx.fill();

    // asteroids – gray circles with subtle shading
    asteroids.forEach(a => {
      const radius = a.w / 2;
      const grad = ctx.createRadialGradient(
        a.x + radius,
        a.y + radius,
        radius * 0.3,
        a.x + radius,
        a.y + radius,
        radius
      );
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + radius, a.y + radius, radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // stars – small yellow circles that twinkle (random opacity)
    stars.forEach(s => {
      ctx.fillStyle = `rgba(255,255,0,${0.5 + Math.random() * 0.5})`;
      ctx.beginPath();
      ctx.arc(s.x + s.w / 2, s.y + s.h / 2, s.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // UI overlay
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Lives: ${ship.lives}`, 10, 40);
    ctx.fillText(`Time: ${Math.max(0, timer).toFixed(1)}`, 10, 60);
  }

  let lastTime = performance.now();
  let running = true;
  function loop(ts) {
    if (!running) return;
    const dt = ts - lastTime;
    lastTime = ts;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  function gameOver() {
    running = false;
    playGameOver();
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#fff';
    ctx.font = '24px sans-serif';
    ctx.fillText(`Game Over – Score: ${score}`, WIDTH / 2 - 120, HEIGHT / 2);
  }

  // start loop
  requestAnimationFrame(loop);
})();
