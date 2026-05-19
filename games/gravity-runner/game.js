// Gravity Runner game
// Canvas with id="game" must exist in the HTML.

(() => {
  // Audio setup
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
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas element with id "game" not found');
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width = canvas.clientWidth || 800;
  const HEIGHT = canvas.height = canvas.clientHeight || 600;

  // Game constants
  const GRAVITY = 0.4;
  const THRUST = -8;
  const PLAYER_RADIUS = 15;
  const OBSTACLE_WIDTH = 40;
  const GAP_HEIGHT = 120;
  const OBSTACLE_SPEED = 3;
  const SPAWN_INTERVAL = 1500; // ms

  // Player state
  const player = { x: WIDTH * 0.2, y: HEIGHT / 2, vy: 0 };

  // Obstacles: { x, gapY }
  const obstacles = [];
  let lastSpawn = 0;
  let score = 0;
  let running = true;

  // Input
  const thrust = () => { audioCtx.resume().then(() => playTone(440, 0.1)); player.vy = THRUST; };
  canvas.addEventListener('mousedown', thrust);
  canvas.addEventListener('touchstart', e => { e.preventDefault(); thrust(); });

  // Main loop
  function update(dt) {
    // Player physics
    player.vy += GRAVITY;
    player.y += player.vy;

    // Bounds check
    if (player.y - PLAYER_RADIUS > HEIGHT || player.y + PLAYER_RADIUS < 0) {
      endGame();
    }

    // Spawn obstacles
    if (performance.now() - lastSpawn > SPAWN_INTERVAL) {
      const gapY = Math.random() * (HEIGHT - GAP_HEIGHT - 40) + 20;
      obstacles.push({ x: WIDTH, gapY });
      lastSpawn = performance.now();
    }

    // Move obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= OBSTACLE_SPEED;
      // Collision detection (circle-rectangle)
      if (o.x < player.x + PLAYER_RADIUS && o.x + OBSTACLE_WIDTH > player.x - PLAYER_RADIUS) {
        if (player.y - PLAYER_RADIUS < o.gapY || player.y + PLAYER_RADIUS > o.gapY + GAP_HEIGHT) {
          endGame();
        }
      }
      // Remove off‑screen obstacles
      if (o.x + OBSTACLE_WIDTH < 0) {
        obstacles.splice(i, 1);
        score++;
      }
    }
  }

  function draw() {
    // Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Starfield (simple static stars)
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 50; i++) {
      const sx = (i * 73) % WIDTH;
      const sy = ((i * 97) >> 2) % HEIGHT;
      ctx.fillRect(sx, sy, 2, 2);
    }

    // Player ship (triangle)
    ctx.save();
    ctx.translate(player.x, player.y);
    const angle = Math.atan2(player.vy, 2);
    ctx.rotate(angle);
    ctx.fillStyle = '#0ff';
    ctx.beginPath();
    ctx.moveTo(-PLAYER_RADIUS, -PLAYER_RADIUS / 2);
    ctx.lineTo(-PLAYER_RADIUS, PLAYER_RADIUS / 2);
    ctx.lineTo(PLAYER_RADIUS, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Obstacles with gradient
    const obsGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    obsGrad.addColorStop(0, '#f88');
    obsGrad.addColorStop(1, '#a00');
    ctx.fillStyle = obsGrad;
    obstacles.forEach(o => {
      // top block
      ctx.fillRect(o.x, 0, OBSTACLE_WIDTH, o.gapY);
      // bottom block
      ctx.fillRect(o.x, o.gapY + GAP_HEIGHT, OBSTACLE_WIDTH, HEIGHT - (o.gapY + GAP_HEIGHT));
    });

    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 30);
  }

  function loop(timestamp) {
    if (!running) return;
    const dt = timestamp - (loop.last || timestamp);
    loop.last = timestamp;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  function endGame() {
    running = false; audioCtx.resume(); playTone(200, 0.4);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#fff';
    ctx.font = '30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2 - 20);
    ctx.fillText(`Score: ${score}`, WIDTH / 2, HEIGHT / 2 + 20);
    canvas.removeEventListener('mousedown', thrust);
    canvas.removeEventListener('touchstart', thrust);
    // Restart on click
    const restart = () => {
      canvas.removeEventListener('mousedown', restart);
      canvas.removeEventListener('touchstart', restart);
      // Reset state
      player.y = HEIGHT / 2;
      player.vy = 0;
      obstacles.length = 0;
      score = 0;
      lastSpawn = 0;
      running = true;
      requestAnimationFrame(loop);
    };
    canvas.addEventListener('mousedown', restart);
    canvas.addEventListener('touchstart', restart);
  }

  requestAnimationFrame(loop);
})();
