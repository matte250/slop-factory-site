// Simple endless scrolling mining drone game
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration);
  }
  function playCollision() { playTone(200, 0.2); }
  function playCollect() { playTone(600, 0.1); }
  function playGameOver() { playTone(100, 0.5); }
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  // Game state
  // Starfield for background
  const stars = [];
  const STAR_COUNT = 100;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      size: Math.random() * 2 + 1,
      speed: Math.random() * 0.5 + 0.2,
    });
  }
  let score = 0;
  let hull = 3; // hull integrity lives
  let gameOver = false;

  // Drone (player) definition
  const drone = {
    x: 60,
    y: H / 2,
    radius: 12,
    speed: 2,
    dy: 0,
  };

  // Collections for asteroids and gems
  const asteroids = [];
  const gems = [];

  // Utility functions
  const rand = (min, max) => Math.random() * (max - min) + min;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  // Input handling – arrow keys move up/down
  const keys = {};
  window.addEventListener('keydown', e => {
    // Ensure audio context is running after user interaction
    if (audioCtx.state === 'suspended') { audioCtx.resume(); }
    keys[e.key] = true;
  });
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => {
    keys[e.key] = false;
  });

  // Spawn functions
  function spawnAsteroid() {
    const size = rand(10, 30);
    asteroids.push({
      x: W + size,
      y: rand(size, H - size),
      r: size,
      speed: rand(2, 5),
    });
  }

  function spawnGem() {
    const size = 8;
    gems.push({
      x: W + size,
      y: rand(size, H - size),
      r: size,
      speed: rand(2, 4),
    });
  }

  // Timing control
  let asteroidTimer = 0;
  let gemTimer = 0;
  const asteroidInterval = 90; // frames
  const gemInterval = 150; // frames

  function update() {
    // Move background stars
    stars.forEach(s => {
      s.x -= s.speed;
      if (s.x < 0) {
        s.x = W + s.size;
        s.y = Math.random() * H;
        s.speed = Math.random() * 0.5 + 0.2;
        s.size = Math.random() * 2 + 1;
      }
    });
    if (gameOver) return;

    // Move drone based on input
    if (keys['ArrowUp']) drone.dy = -drone.speed;
    else if (keys['ArrowDown']) drone.dy = drone.speed;
    else drone.dy = 0;
    drone.y = Math.max(drone.radius, Math.min(H - drone.radius, drone.y + drone.dy));

    // Spawn asteroids and gems
    if (asteroidTimer++ >= asteroidInterval) {
      spawnAsteroid();
      asteroidTimer = 0;
    }
    if (gemTimer++ >= gemInterval) {
      spawnGem();
      gemTimer = 0;
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed;
      // Collision with drone
      if (dist(a, drone) < a.r + drone.radius) { // collision
        playCollision();
        hull--;
        asteroids.splice(i, 1);
        if (hull <= 0) {
          gameOver = true;
          playGameOver();
        }
        continue;
      }
      // Remove off‑screen
      if (a.x + a.r < 0) asteroids.splice(i, 1);
    }

    // Update gems
    for (let i = gems.length - 1; i >= 0; i--) {
      const g = gems[i];
      g.x -= g.speed;
      if (dist(g, drone) < g.r + drone.radius) { // collection
        playCollect();
        score++;
        gems.splice(i, 1);
        continue;
      }
      if (g.x + g.r < 0) gems.splice(i, 1);
    }
  }

  function draw() {
    // Draw background stars
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw drone – stylized triangular ship
    const droneGrad = ctx.createLinearGradient(drone.x - drone.radius, drone.y - drone.radius, drone.x + drone.radius, drone.y + drone.radius);
    droneGrad.addColorStop(0, '#00ff88');
    droneGrad.addColorStop(1, '#004400');
    ctx.fillStyle = droneGrad;
    ctx.beginPath();
    ctx.moveTo(drone.x, drone.y - drone.radius);
    ctx.lineTo(drone.x - drone.radius, drone.y + drone.radius);
    ctx.lineTo(drone.x + drone.radius, drone.y + drone.radius);
    ctx.closePath();
    ctx.fill();

    // Draw asteroids – radial gradient rock texture
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#777777');
      grad.addColorStop(1, '#333333');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw gems
    ctx.fillStyle = '#ff00ff';
    gems.forEach(g => {
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // UI – score & hull
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Hull: ${hull}`, 10, 40);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  }

  function loop() {
    if (!gameOver) {
      update();
    }
    draw();
    requestAnimationFrame(loop);
  }

  // Start the loop
  requestAnimationFrame(loop);
})();
