// Simple endless runner based on IDEA.md
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');

  // Set canvas size (you can adjust as needed)
  canvas.width = canvas.clientWidth || 400;
  canvas.height = canvas.clientHeight || 600;

  const LANE_COUNT = 3;
  const LANE_WIDTH = canvas.width / LANE_COUNT;
  const PLAYER_SIZE = 30;
  const OBSTACLE_SIZE = 30;
  const OBSTACLE_SPEED = 3;
  const SPAWN_INTERVAL = 1500; // ms

  let playerLane = 1; // start in middle lane (0‑based)
  let obstacles = [];
  let lastSpawn = 0;
  let gameOver = false;

  // Input: click/tap to move right, wrap around
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur / 1000);
  }

  // Input handling with sound
  canvas.addEventListener('click', async () => {
    // resume audio context (required on first interaction)
    if (audioCtx.state === 'suspended') await audioCtx.resume();
    // lane change sound
    playTone(440, 100);
    if (gameOver) return;
    playerLane = (playerLane + 1) % LANE_COUNT;
  });
    if (gameOver) return;
    playerLane = (playerLane + 1) % LANE_COUNT;
  });

  function spawnObstacle() {
    const lane = Math.floor(Math.random() * LANE_COUNT);
    obstacles.push({ lane, y: -OBSTACLE_SIZE });
  }

  function update(delta) {
    // spawn obstacles
    if (performance.now() - lastSpawn > SPAWN_INTERVAL) {
      spawnObstacle();
      lastSpawn = performance.now();
    }
    // move obstacles
    obstacles.forEach(o => o.y += OBSTACLE_SPEED);
    // remove off‑screen
    obstacles = obstacles.filter(o => o.y < canvas.height + OBSTACLE_SIZE);
    // collision detection
    for (const o of obstacles) {
      if (o.lane === playerLane && o.y + OBSTACLE_SIZE > canvas.height - PLAYER_SIZE && o.y < canvas.height) {
        playTone(200, 300);
        gameOver = true;
        break;
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // draw background gradient and stars
    const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGradient.addColorStop(0, '#001');
    bgGradient.addColorStop(1, '#004');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // stars for a simple space effect
    if (!window.__stars) {
      window.__stars = [];
      for (let i = 0; i < 100; i++) {
        window.__stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, r: Math.random() * 1.5 + 0.5 });
      }
    }
    ctx.fillStyle = '#fff';
    for (const s of window.__stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      s.y += 0.5; // slow fall
      if (s.y > canvas.height) s.y = 0;
    }

    // draw lanes (optional visual aid)
    ctx.strokeStyle = '#222';
    for (let i = 1; i < LANE_COUNT; i++) {
      ctx.beginPath();
      ctx.moveTo(i * LANE_WIDTH, 0);
      ctx.lineTo(i * LANE_WIDTH, canvas.height);
      ctx.stroke();
    }
    // draw player
    ctx.fillStyle = '#0ff'; // neon cyan
    const playerX = playerLane * LANE_WIDTH + (LANE_WIDTH - PLAYER_SIZE) / 2;
    const playerY = canvas.height - PLAYER_SIZE - 10;
    ctx.fillRect(playerX, playerY, PLAYER_SIZE, PLAYER_SIZE);
    // draw obstacles
    ctx.fillStyle = '#f00'; // neon red
    for (const o of obstacles) {
      const ox = o.lane * LANE_WIDTH + (LANE_WIDTH - OBSTACLE_SIZE) / 2;
      ctx.fillRect(ox, o.y, OBSTACLE_SIZE, OBSTACLE_SIZE);
    }
    // game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  let lastTime = 0;
  function loop(time) {
    const delta = time - lastTime;
    lastTime = time;
    if (!gameOver) update(delta);
    draw();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
