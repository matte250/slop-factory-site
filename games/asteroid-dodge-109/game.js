// Asteroid Dodge – minimal canvas game
// Canvas element with id="game" must exist in the page.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playScoreSound() { playTone(800, 0.05); }
  function playCrashSound() { playTone(200, 0.3); }


  // Player ship
  const ship = { w: 40, h: 20, x: width / 2 - 20, y: height - 30, speed: 5 };

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // Asteroids
  const asteroids = [];
  let spawnTimer = 0;
  let spawnInterval = 1000; // ms
  let lastTime = 0;
  let score = 0;
  let gameOver = false;

  function reset() {
    ship.x = width / 2 - ship.w / 2;
    asteroids.length = 0;
    spawnInterval = 1000;
    score = 0;
    gameOver = false;
    lastTime = performance.now();
    requestAnimationFrame(loop);
  }

  function spawnAsteroid() {
    const size = 20 + Math.random() * 30;
    const x = Math.random() * (width - size);
    const speed = 1 + Math.random() * 2 + score * 0.02; // speed up with score
    const angle = Math.random() * Math.PI * 2;
    const rotSpeed = (Math.random() - 0.5) * 0.02; // radians per ms
    asteroids.push({ x, y: -size, size, speed, angle, rotSpeed });
  }

  function update(dt) {
    // Move ship
    if (keys['ArrowLeft'] || keys['a']) ship.x -= ship.speed;
    if (keys['ArrowRight'] || keys['d']) ship.x += ship.speed;
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));

    // Spawn asteroids
    spawnTimer += dt;
    if (spawnTimer > spawnInterval) {
      spawnAsteroid();
      spawnTimer = 0;
      // gradually increase difficulty
      spawnInterval = Math.max(200, spawnInterval - 20);
    }

    // Update asteroids (position, rotation, collision)
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed * dt * 0.06; // vertical movement
      a.angle += a.rotSpeed * dt; // rotate over time
      // collision detection (simple AABB using bounding box)
      if (
        a.x < ship.x + ship.w &&
        a.x + a.size > ship.x &&
        a.y < ship.y + ship.h &&
        a.y + a.size > ship.y
      ) {
        gameOver = true;
        playCrashSound();
      }
      // remove off‑screen asteroids and increment score
      if (a.y > height) {
        asteroids.splice(i, 1);
        score++;
        playScoreSound();
      }
    }
  }

  function draw() {
    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#001');
    grad.addColorStop(1, '#003');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Ship (triangle)
    ctx.fillStyle = '#0af';
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();

    // Asteroids (rotating circles with shading)
    ctx.fillStyle = '#a33';
    asteroids.forEach(a => {
      ctx.save();
      ctx.translate(a.x + a.size / 2, a.y + a.size / 2);
      ctx.rotate(a.angle);
      ctx.beginPath();
      ctx.arc(0, 0, a.size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#ff0';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2 - 10);
      ctx.fillText('Press Enter to Restart', width / 2, height / 2 + 20);
    }
  }

  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) {
      update(dt);
    }
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Restart on Enter key
  window.addEventListener('keydown', e => {
    if (gameOver && e.key === 'Enter') reset();
  });

  // start game
  reset();
})();
