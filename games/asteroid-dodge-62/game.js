// Simple Asteroid Dodge game
// Canvas element with id="game" is assumed to exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) { console.error('Canvas with id "game" not found'); return; }
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width = canvas.width || 800;
  const HEIGHT = canvas.height = canvas.height || 600;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  function playShoot() { playTone(800, 0.05); }
  function playExplosion() { playTone(200, 0.2); }
  function playGameOver() { playTone(100, 0.5); }

  // Game objects
  // Ship object (drawn as a triangle)
  const ship = {
    w: 40,
    h: 20,
    x: WIDTH / 2 - 20,
    y: HEIGHT - 30,
    speed: 5,
    movingLeft: false,
    movingRight: false,
  };

  const bullets = [];
  const asteroids = [];
  let score = 0;
  let gameOver = false;
  let lastAsteroidTime = 0;
  const ASTEROID_INTERVAL = 1000; // ms

  // Stars background
  const STAR_COUNT = 100;
  const stars = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({ x: Math.random() * WIDTH, y: Math.random() * HEIGHT });
  }

  // Input handling
  document.addEventListener('keydown', e => {
    if (e.code === 'ArrowLeft') ship.movingLeft = true;
    if (e.code === 'ArrowRight') ship.movingRight = true;
    if (e.code === 'Space') fireBullet();
  });
  document.addEventListener('keyup', e => {
    if (e.code === 'ArrowLeft') ship.movingLeft = false;
    if (e.code === 'ArrowRight') ship.movingRight = false;
  });

  function fireBullet() {
    // Ensure audio context is running (required by browsers)
    if (audioCtx.state === 'suspended') audioCtx.resume();
    // Bullet starts from middle of ship
    bullets.push({ x: ship.x + ship.w / 2 - 2, y: ship.y, w: 4, h: 10, speed: 7 });
    playShoot();
  }

  function spawnAsteroid() {
    const size = 20 + Math.random() * 30;
    const x = Math.random() * (WIDTH - size);
    const speed = 2 + Math.random() * 2;
    asteroids.push({ x, y: -size, w: size, h: size, speed });
  }

  function update(dt) {
    // Move ship
    if (ship.movingLeft) ship.x = Math.max(0, ship.x - ship.speed);
    if (ship.movingRight) ship.x = Math.min(WIDTH - ship.w, ship.x + ship.speed);

    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.y -= b.speed;
      if (b.y + b.h < 0) bullets.splice(i, 1);
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // Collision with ship => game over
      if (rectIntersect(a, ship)) {
        gameOver = true;
        playGameOver();
      }
      // Collision with bullets
      for (let j = bullets.length - 1; j >= 0; j--) {
        const b = bullets[j];
        if (rectIntersect(a, b)) {
          // remove both
          bullets.splice(j, 1);
          asteroids.splice(i, 1);
          score++;
          playExplosion();
          break;
        }
      }
      // Remove off‑screen asteroids
      if (a.y > HEIGHT) asteroids.splice(i, 1);
    }

    // Spawn new asteroid based on time
    if (Date.now() - lastAsteroidTime > ASTEROID_INTERVAL) {
      spawnAsteroid();
      lastAsteroidTime = Date.now();
    }
  }

  function draw() {
    // Background stars
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    stars.forEach(s => {
      ctx.fillStyle = 'white';
      ctx.fillRect(s.x, s.y, 1, 1);
    });

    // Ship (triangle)
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();

    // Bullets (circles)
    ctx.fillStyle = '#ff0';
    bullets.forEach(b => {
      ctx.beginPath();
      ctx.arc(b.x + b.w / 2, b.y + b.h / 2, b.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Asteroids (radial gradient)
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(
        a.x + a.w / 2,
        a.y + a.h / 2,
        a.w * 0.1,
        a.x + a.w / 2,
        a.y + a.h / 2,
        a.w / 2
      );
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#333');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.w / 2, a.y + a.h / 2, a.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2);
    }
  }

  function rectIntersect(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  let lastTime = 0;
  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Start game loop
  requestAnimationFrame(loop);
})();
