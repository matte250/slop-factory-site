// Asteroid Dash – simple canvas game with improved graphics
// Canvas with id="game" must exist in the HTML.
(function() {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Starfield background
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5
    });
  }

  // Ship definition – green triangle with stroke
  const ship = {
    x: 50,
    y: height / 2,
    w: 20,
    h: 12,
    speed: 4,
    draw() {
      ctx.fillStyle = '#0f0';
      ctx.strokeStyle = '#060';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - this.w, this.y - this.h / 2);
      ctx.lineTo(this.x - this.w, this.y + this.h / 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  };

  // Asteroid pool
  const asteroids = [];
  let asteroidTimer = 0;
  let asteroidInterval = 1500; // ms
  let baseSpeed = 2;

  // Input handling with simple sounds
  const keys = {};
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  window.addEventListener('keydown', e => {
    // Ensure audio context is running (required after user interaction)
    if (audioCtx.state !== 'running') audioCtx.resume();
    if (!keys[e.code]) {
      // play thrust sound on first press
      if (e.code === 'ArrowUp' || e.code === 'ArrowDown') beep(300, 80);
    }
    keys[e.code] = true;
  });
  window.addEventListener('keyup', e => (keys[e.code] = false));

  let startTime = null;
  let gameOver = false;
  let score = 0;

  function spawnAsteroid() {
    const size = Math.random() * 30 + 10;
    asteroids.push({
      x: width + size,
      y: Math.random() * (height - size),
      r: size,
      speed: baseSpeed + Math.random() * 1.5
    });
    // subtle spawn sound
    beep(200, 60);
  }

  function update(dt) {
    // ship movement (ArrowUp / ArrowDown)
    if (keys['ArrowUp']) ship.y -= ship.speed;
    if (keys['ArrowDown']) ship.y += ship.speed;
    // keep within bounds vertically
    if (ship.y < 0) ship.y = 0;
    if (ship.y > height) ship.y = height;

    // asteroid logic
    asteroidTimer += dt;
    if (asteroidTimer > asteroidInterval) {
      spawnAsteroid();
      asteroidTimer = 0;
      // gradually increase difficulty
      asteroidInterval = Math.max(400, asteroidInterval - 20);
      baseSpeed += 0.02;
    }
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed;
      // remove off‑screen
      if (a.x + a.r < 0) asteroids.splice(i, 1);
      // collision detection (simple circle‑rect)
      const distX = Math.abs(a.x - ship.x);
      const distY = Math.abs(a.y - ship.y);
      if (distX <= a.r + ship.w && distY <= a.r + ship.h) {
        beep(100, 200);
        gameOver = true;
      }
    }

    // lose if ship falls off bottom (already clamped; keep check for safety)
    if (ship.y >= height) gameOver = true;
  }

  function draw() {
    // clear with dark space background
    ctx.fillStyle = '#001';
    ctx.fillRect(0, 0, width, height);

    // draw starfield
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ship.draw();
    // draw asteroids with radial gradient
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // score display
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
  }

  function loop(timestamp) {
    if (!startTime) startTime = timestamp;
    const dt = timestamp - (startTime + score * 1000);
    if (!gameOver) {
      const delta = timestamp - (last?.time ?? timestamp);
      update(delta);
      score = (timestamp - startTime) / 1000;
      draw();
      last = { time: timestamp };
      requestAnimationFrame(loop);
    } else {
      // overlay game over screen
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f44';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2 - 10);
      ctx.fillStyle = '#fff';
      ctx.fillText('Final Score: ' + Math.floor(score), width / 2, height / 2 + 20);
    }
  }

  // start the game
  let last = null;
  requestAnimationFrame(loop);
})();
