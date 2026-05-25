// Minimal Asteroid Escape game
// Assumes an HTML canvas with id="game"

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  canvas.width = 800;
  canvas.height = 600;
  // generate static star field
  const STAR_COUNT = 100;
  const stars = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height });
  }
  // audio setup
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioCtx();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  // sound triggers
  window.addEventListener('keydown', e => {
    if (e.code === 'ArrowUp') {
      playTone(300, 0.05);
    }
  });

  // ----- Game state -----
  const ship = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    angle: 0,
    radius: 10,
    vx: 0,
    vy: 0,
    thrust: 0.1,
    turnSpeed: 0.07,
  };

  let asteroids = [];
  let asteroidSpawnTimer = 0;
  let asteroidSpawnInterval = 2000; // ms
  let lastTime = 0;
  let score = 0;
  let gameOver = false;

  // ----- Input handling -----
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.code] = true; });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  // ----- Helper functions -----
  function spawnAsteroid() {
    const edge = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    const speed = 1 + Math.random() * 1.5 + score / 20000; // increase with score
    switch (edge) {
      case 0: // top
        x = Math.random() * canvas.width; y = -20; vx = (Math.random() - 0.5) * speed; vy = speed; break;
      case 1: // right
        x = canvas.width + 20; y = Math.random() * canvas.height; vx = -speed; vy = (Math.random() - 0.5) * speed; break;
      case 2: // bottom
        x = Math.random() * canvas.width; y = canvas.height + 20; vx = (Math.random() - 0.5) * speed; vy = -speed; break;
      case 3: // left
        x = -20; y = Math.random() * canvas.height; vx = speed; vy = (Math.random() - 0.5) * speed; break;
    }
    const radius = 15 + Math.random() * 15;
    asteroids.push({ x, y, vx, vy, radius });
  }

  function update(dt) {
    if (gameOver) return;
    // ship controls
    if (keys['ArrowLeft']) ship.angle -= ship.turnSpeed;
    if (keys['ArrowRight']) ship.angle += ship.turnSpeed;
    if (keys['ArrowUp']) {
      ship.vx += Math.cos(ship.angle) * ship.thrust;
      ship.vy += Math.sin(ship.angle) * ship.thrust;
    }

    // move ship
    ship.x += ship.vx;
    ship.y += ship.vy;

    // screen wrap for ship (optional: off-screen ends game)
    if (ship.x < 0 || ship.x > canvas.width || ship.y < 0 || ship.y > canvas.height) {
      gameOver = true;
    }

    // move asteroids
    asteroids.forEach(a => {
      a.x += a.vx;
      a.y += a.vy;
    });

    // remove off‑screen asteroids
    asteroids = asteroids.filter(a => a.x > -30 && a.x < canvas.width + 30 && a.y > -30 && a.y < canvas.height + 30);

    // spawn logic
    asteroidSpawnTimer += dt;
    if (asteroidSpawnTimer > asteroidSpawnInterval) {
      spawnAsteroid();
      asteroidSpawnTimer = 0;
      // speed up spawns over time
      if (asteroidSpawnInterval > 500) asteroidSpawnInterval -= 20;
    }

    // collision detection
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.radius + ship.radius) {
        playTone(100, 0.2);
        gameOver = true;
        break;
      }
    }

    // update score
    score += dt;
  }

  function draw() {
    // background (dark space)
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // draw stars
    ctx.fillStyle = '#444';
    stars.forEach(s => {
      ctx.fillRect(s.x, s.y, 1, 1);
    });

    // draw ship (triangle) with stroke
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-8, -8);
    ctx.lineTo(-8, 8);
    ctx.closePath();
    ctx.fillStyle = '#0ff';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();
    // thrust flame
    if (keys['ArrowUp']) {
      ctx.beginPath();
      ctx.moveTo(-8, 0);
      ctx.lineTo(-14, -5);
      ctx.lineTo(-14, 5);
      ctx.closePath();
      ctx.fillStyle = 'orange';
      ctx.fill();
    }
    ctx.restore();

    // draw asteroids with radial gradient shading
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.3, a.x, a.y, a.radius);
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // draw score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${Math.floor(score / 1000)}`, 10, 20);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f00';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
