// Minimal Cosmic Dodger game with enhanced graphics
(() => {
  const canvas = document.getElementById('game');
  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  function playSound(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  if (!canvas) return; // no canvas present
  const ctx = canvas.getContext('2d');
  const DPR = window.devicePixelRatio || 1;
  const width = canvas.width = canvas.clientWidth * DPR;
  const height = canvas.height = canvas.clientHeight * DPR;
  ctx.scale(DPR, DPR);

  // Game state
  const ship = { x: 80, y: height / 2, radius: 12, angle: 0, shield: 3 };
  const asteroids = [];
  let score = 0;
  let speed = 2; // forward speed (affects asteroid speed)
  let lastTime = 0;
  let gameOver = false;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (gameOver && e.key === ' ') restart();
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function spawnAsteroid() {
    const radius = Math.random() * 20 + 10;
    const y = Math.random() * (height - radius * 2) + radius;
    const x = width + radius;
    const vel = speed + Math.random() * 1.5;
    asteroids.push({ x, y, radius, vel });
  }

  function update(dt) {
    // ship controls
    if (keys.ArrowUp || keys.w) ship.y -= 200 * dt;
    if (keys.ArrowDown || keys.s) ship.y += 200 * dt;
    if (keys.ArrowLeft || keys.a) ship.angle = -0.2; else if (keys.ArrowRight || keys.d) ship.angle = 0.2; else ship.angle = 0;
    if (keys['Shift'] || keys[' ']) {
      speed = Math.min(speed + 0.5 * dt, 5);
      playSound(400, 0.05);
    } else {
      speed = Math.max(2, speed - 0.2 * dt);
    }

    // Keep ship inside canvas
    ship.y = Math.max(ship.radius, Math.min(height - ship.radius, ship.y));

    // spawn asteroids periodically
    if (Math.random() < dt * 0.5) spawnAsteroid();

    // update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.vel * dt * 60; // scale to 60fps base
      // collision
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.radius + ship.radius) {
        asteroids.splice(i, 1);
        ship.shield--;
        playSound(200, 0.1); // hit sound
        if (ship.shield <= 0) {
          gameOver = true;
          playSound(100, 0.3); // game over sound
        }
        continue;
      }
      // remove off‑screen
      if (a.x + a.radius < 0) asteroids.splice(i, 1);
    }

    // score based on distance travelled
    score += dt * speed * 10;
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // ship
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.fillStyle = '#0ff';
    ctx.beginPath();
    ctx.moveTo(-ship.radius, -ship.radius);
    ctx.lineTo(ship.radius, 0);
    ctx.lineTo(-ship.radius, ship.radius);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // asteroids
    ctx.fillStyle = '#888';
    asteroids.forEach(a => {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    // shield indicator
    ctx.fillStyle = '#0f0';
    for (let i = 0; i < ship.shield; i++) {
      ctx.fillRect(10 + i * 20, 10, 15, 15);
    }
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), width - 120, 25);
    // game over
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '32px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2 - 20);
      ctx.font = '20px sans-serif';
      ctx.fillText('Press Space to Restart', width / 2, height / 2 + 20);
    }
  }

  function loop(timestamp) {
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    if (!gameOver) update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  function restart() {
    ship.y = height / 2; ship.shield = 3; score = 0; speed = 2; asteroids.length = 0; gameOver = false;
  }

  requestAnimationFrame(loop);
})();
