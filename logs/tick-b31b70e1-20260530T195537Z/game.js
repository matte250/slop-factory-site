// Game: Starfall Dodger
// Implements an endless runner on a canvas with id="game"
// Ship drifts down due to gravity; click/tap applies upward thrust.
// Random obstacles appear from the right; collision ends the game.

(function () {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');

  // Set canvas size to its displayed dimensions
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playSound = (freq, dur) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  };
  const playThrust = () => playSound(300, 0.08);
  const playCrash = () => playSound(80, 0.3);

  const GRAVITY = 0.3;      // pixels per frame²
  const THRUST = -6;        // instantaneous upward velocity
  const SHIP_W = 30;
  const SHIP_H = 30;
  const OBSTACLE_W = 40;
  const OBSTACLE_H = 40;
  const OBSTACLE_SPEED = 3;
  const SPAWN_INTERVAL = 1500; // ms

  const ship = {
    x: canvas.width * 0.2,
    y: canvas.height / 2,
    vy: 0,
    w: SHIP_W,
    h: SHIP_H,
  };

  let obstacles = [];
  // Starfield background
  const STAR_COUNT = 100;
  const stars = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 1,
      speed: Math.random() * 0.5 + 0.2,
    });
  }
  let lastSpawn = 0;
  let startTime = null;
  let score = 0;
  let running = true;

  // Input handling – mouse or touch
  const applyThrust = () => { playThrust(); ship.vy = THRUST; };
  canvas.addEventListener('mousedown', applyThrust);
  canvas.addEventListener('touchstart', (e) => { e.preventDefault(); applyThrust(); });

  // Game loop
  function update(timestamp) {
    if (!running) return;
    if (!startTime) startTime = timestamp;
    const delta = timestamp - (lastSpawn || timestamp);

    // Update ship physics
    ship.vy += GRAVITY;
    ship.y += ship.vy;

    // Update starfield (move left)
    stars.forEach(star => {
      star.x -= star.speed;
      if (star.x < 0) {
        star.x = canvas.width;
        star.y = Math.random() * canvas.height;
        star.size = Math.random() * 2 + 1;
        star.speed = Math.random() * 0.5 + 0.2;
      }
    });

    // Lose if ship hits bottom or top
    if (ship.y + ship.h > canvas.height || ship.y < 0) {
      endGame();
      return;
    }

    // Spawn obstacles
    if (timestamp - lastSpawn > SPAWN_INTERVAL) {
      spawnObstacle();
      lastSpawn = timestamp;
    }

    // Update obstacles
    obstacles.forEach(o => o.x -= OBSTACLE_SPEED);
    // Remove off‑screen obstacles
    obstacles = obstacles.filter(o => o.x + o.w > 0);

    // Collision detection (AABB)
    for (const o of obstacles) {
      if (rectIntersect(ship, o)) {
        endGame();
        return;
      }
    }

    // Update score (seconds survived)
    score = ((timestamp - startTime) / 1000).toFixed(1);

    draw();
    requestAnimationFrame(update);
  }

  function spawnObstacle() {
    const y = Math.random() * (canvas.height - OBSTACLE_H);
    obstacles.push({ x: canvas.width, y, w: OBSTACLE_W, h: OBSTACLE_H });
  }

  function rectIntersect(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

function draw() {
    // Background gradient (dark space to slightly lighter)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#000020');
    bgGrad.addColorStop(1, '#000010');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw stars
    ctx.fillStyle = '#fff';
    stars.forEach(star => {
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw ship – gradient triangle with optional thrust flame (already defined elsewhere)
    // Ship drawing code already updated in earlier edit; re‑use that logic here
    // (the ship gradient and flame are drawn separately in draw())
    // Draw ship body
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x + ship.w, ship.y + ship.h);
    shipGrad.addColorStop(0, '#0f0');
    shipGrad.addColorStop(1, '#003300');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h / 2);
    ctx.lineTo(ship.x + ship.w, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // Thrust flame
    if (ship.vy <= THRUST) {
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.moveTo(ship.x, ship.y + ship.h / 2);
      ctx.lineTo(ship.x - 10, ship.y + ship.h / 2 - 5);
      ctx.lineTo(ship.x - 10, ship.y + ship.h / 2 + 5);
      ctx.closePath();
      ctx.fill();
    }

    // Draw obstacles – gradient circles (asteroids)
    obstacles.forEach(o => {
      const grad = ctx.createRadialGradient(o.x + o.w / 2, o.y + o.h / 2, o.w / 4, o.x + o.w / 2, o.y + o.h / 2, o.w / 2);
      grad.addColorStop(0, '#555');
      grad.addColorStop(1, '#111');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(o.x + o.w / 2, o.y + o.h / 2, o.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}s`, 10, 20);
  }

    // Draw obstacles – red rectangles
    ctx.fillStyle = '#f00';
    obstacles.forEach(o => ctx.fillRect(o.x, o.y, o.w, o.h));

    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}s`, 10, 20);
  }

  function endGame() {
    // Play crash sound
    playCrash();
    running = false;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 10);
    ctx.fillText(`Score: ${score}s`, canvas.width / 2, canvas.height / 2 + 30);
  }

  requestAnimationFrame(update);
})();
