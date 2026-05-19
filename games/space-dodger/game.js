// Simple Space Dodger game targeting <canvas id="game"></canvas>
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio context is resumed on user interaction
  window.addEventListener('click', () => audioCtx.resume(), { once: true });
  function beep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // Player ship
  const ship = { x: 50, y: HEIGHT / 2 - 15, w: 30, h: 20, dy: 0 };
  const SPEED = 4;

  // Obstacles (asteroids/enemy ships)
  const obstacles = [];
  const OB_W = 30, OB_H = 30;
  const SPAWN_INTERVAL = 1500; // ms
  let lastSpawn = 0;

  // Starfield for background
  const STAR_COUNT = 100;
  const stars = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * WIDTH,
      y: Math.random() * HEIGHT,
      size: Math.random() * 2 + 1,
      speed: Math.random() * 0.5 + 0.2,
    });
  }

  let score = 0;
  let scoreMilestone = 0;
  let running = true;
  let lastTime = 0;

  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (!running && e.code === 'Space') restart();
  });
  window.addEventListener('keyup', e => keys[e.code] = false);

  function restart() {
    ship.y = HEIGHT / 2 - 15;
    obstacles.length = 0;
    score = 0;
    scoreMilestone = 0;
    running = true;
    lastSpawn = 0;
    lastTime = performance.now();
    // Play start sound
    beep(300, 0.15);
    requestAnimationFrame(loop);
  }

  function spawnObstacle() {
    const y = Math.random() * (HEIGHT - OB_H);
    const speed = Math.random() * 1.5 + 1.5; // varied speed
    obstacles.push({ x: WIDTH, y, w: OB_W, h: OB_H, speed });
  }

  function update(dt) {
    // Player movement
    if (keys['ArrowUp']) ship.y -= SPEED;
    if (keys['ArrowDown']) ship.y += SPEED;
    ship.y = Math.max(0, Math.min(HEIGHT - ship.h, ship.y));

    // Move stars (background)
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.x -= s.speed;
      if (s.x < 0) {
        s.x = WIDTH;
        s.y = Math.random() * HEIGHT;
        s.size = Math.random() * 2 + 1;
        s.speed = Math.random() * 0.5 + 0.2;
      }
    }

    // Move obstacles using their own speed
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= o.speed || 3;
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }

    // Collision detection
    for (const o of obstacles) {
      if (ship.x < o.x + o.w && ship.x + ship.w > o.x &&
          ship.y < o.y + o.h && ship.y + ship.h > o.y) {
        running = false;
        // Play crash sound (low beep)
        beep(150, 0.3);
      }
    }

    // Scoring and milestones
    score += dt * 0.01;
    const intScore = Math.floor(score);
    if (intScore > scoreMilestone) {
      scoreMilestone = intScore;
      // Play a higher beep for each new point (optional: every 10 points)
      if (intScore % 10 === 0) {
        beep(600, 0.05);
      } else {
        beep(400, 0.05);
      }
    }

    // Spawn logic
    if (performance.now() - lastSpawn > SPAWN_INTERVAL) {
      spawnObstacle();
      lastSpawn = performance.now();
    }
  }

  function draw() {
    // Background gradient (space nebula)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    bgGrad.addColorStop(0, '#001d3d');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Draw starfield (twinkling)
    ctx.fillStyle = 'white';
    stars.forEach(s => {
      // slight flicker
      const alpha = 0.5 + Math.random() * 0.5;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'white';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw ship (white triangle with outline)
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'gray';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h / 2);
    ctx.lineTo(ship.x + ship.w, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw obstacles (rounded red circles with slight gradient)
    obstacles.forEach(o => {
      const gradient = ctx.createRadialGradient(o.x + o.w/2, o.y + o.h/2, o.w*0.2, o.x + o.w/2, o.y + o.h/2, o.w/2);
      gradient.addColorStop(0, '#ff6b6b');
      gradient.addColorStop(1, '#c0392b');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(o.x + o.w/2, o.y + o.h/2, o.w/2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Score
    ctx.fillStyle = 'lime';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);

    if (!running) {
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2 - 10);
      ctx.fillText('Press Space to Restart', WIDTH / 2, HEIGHT / 2 + 20);
    }
  }

  function loop(timestamp) {
    const dt = timestamp - (lastTime || timestamp);
    lastTime = timestamp;
    if (running) update(dt);
    draw();
    if (running) requestAnimationFrame(loop);
  }

  // Start the game
  requestAnimationFrame(loop);
})();
