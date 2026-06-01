// Simple Asteroid Dodger game
// Assumes an HTML canvas element with id="game"

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let audioStarted = false;
  function ensureAudio(){
    if (!audioStarted && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    audioStarted = true;
  }
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playMove() { ensureAudio(); playTone(440, 0.05); }
  function playExplosion() { ensureAudio(); playTone(80, 0.4); }
  function playPoint() { ensureAudio(); playTone(660, 0.08); }

  // Player ship
  const ship = {
    width: 40,
    height: 20,
    x: width / 2 - 20,
    y: height - 30,
    speed: 5,
    color: '#00f'
  };

  // Asteroid pool
  const asteroids = [];
  // starfield background
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5
    });
  }
  const asteroidSpawnInterval = 1500; // ms
  const asteroidSpeed = 2;

  // Score
  let score = 0;
  let lastSpawn = 0;
  let lastTime = performance.now();
  let gameOver = false;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') {
      keys.left = true;
      playMove();
    }
    if (e.key === 'ArrowRight' || e.key === 'd') {
      keys.right = true;
      playMove();
    }
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
  });

  function spawnAsteroid() {
    const size = Math.random() * 30 + 10;
    const x = Math.random() * (width - size);
    asteroids.push({ x, y: -size, size, speed: asteroidSpeed + Math.random() });
  }

  function update(dt) {
    // move ship
    if (keys.left) ship.x -= ship.speed;
    if (keys.right) ship.x += ship.speed;
    // keep within bounds
    ship.x = Math.max(0, Math.min(width - ship.width, ship.x));

    // spawn asteroids
    if (performance.now() - lastSpawn > asteroidSpawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }

    // update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // check collision with ship
      if (
        a.x < ship.x + ship.width &&
        a.x + a.size > ship.x &&
        a.y < ship.y + ship.height &&
        a.y + a.size > ship.y
      ) {
        gameOver = true;
        playExplosion();
      }
      // remove off‑screen
if (a.y > height) {
          asteroids.splice(i, 1);
          score++;
          playPoint();
        }
    }
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001d3d');
    bgGrad.addColorStop(1, '#003566');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // draw starfield
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // draw ship as triangle
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.width / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.height);
    ctx.lineTo(ship.x + ship.width, ship.y + ship.height);
    ctx.closePath();
    ctx.fill();

    // draw asteroids with radial gradient
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(
        a.x + a.size / 2,
        a.y + a.size / 2,
        a.size * 0.2,
        a.x + a.size / 2,
        a.y + a.size / 2,
        a.size / 2
      );
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.size / 2, a.y + a.size / 2, a.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // draw score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);

    // game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#ff0';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop() {
    const now = performance.now();
    const dt = now - lastTime;
    lastTime = now;
    if (!gameOver) update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  // start loop
  requestAnimationFrame(loop);
})();
