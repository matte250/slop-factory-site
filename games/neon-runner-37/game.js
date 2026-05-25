// Neon Runner – simple endless runner
// Canvas with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 400;
  // starfield for background
  const stars = [];
  const STAR_COUNT = 100;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height, r: Math.random() * 1.5 + 0.5 });
  }
  // player trail positions
  const trail = []; // each entry {x, y}
  const TRAIL_MAX = 10;

  // Game constants
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain).connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  // background hum
  let bgInterval = null;
  function startBackgroundSound() {
    if (bgInterval) return;
    bgInterval = setInterval(() => {
      if (!gameOver) playSound(80, 0.2);
    }, 2000);
  }
  function stopBackgroundSound() {
    if (bgInterval) clearInterval(bgInterval);
    bgInterval = null;
  }
  const GRAVITY = 0.6;
  const JUMP_VELOCITY = -12;
  const PLAYER_SIZE = 40;
  const OBSTACLE_WIDTH = 30;
  const OBSTACLE_GAP = 200; // distance between obstacles
  const OBSTACLE_SPEED = 4;

  // Player state
  const player = { x: 80, y: height - PLAYER_SIZE, vy: 0, onGround: true };

  // Obstacles array
  const obstacles = [];
  let nextObstacleX = width + 100;

  // Score
  let score = 0;
  let gameOver = false;

  function spawnObstacle() {
    const heightOptions = [PLAYER_SIZE, PLAYER_SIZE * 1.5, PLAYER_SIZE * 2];
    const h = heightOptions[Math.floor(Math.random() * heightOptions.length)];
    obstacles.push({ x: nextObstacleX, y: height - h, w: OBSTACLE_WIDTH, h });
    nextObstacleX += OBSTACLE_GAP + Math.random() * 100;
  }

  function reset() {
    player.y = height - PLAYER_SIZE;
    player.vy = 0;
    player.onGround = true;
    obstacles.length = 0;
    nextObstacleX = width + 100;
    score = 0;
    gameOver = false;
    spawnObstacle();
    startBackgroundSound();
  }

  function update() {
    if (gameOver) return;
    // player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y >= height - PLAYER_SIZE) {
      player.y = height - PLAYER_SIZE;
      player.vy = 0;
      player.onGround = true;
    } else {
      player.onGround = false;
    }
    // record trail
    trail.push({ x: player.x + PLAYER_SIZE / 2, y: player.y + PLAYER_SIZE / 2 });
    if (trail.length > TRAIL_MAX) trail.shift();

    // obstacles movement
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= OBSTACLE_SPEED;
      // collision detection
      if (
        player.x < o.x + o.w &&
        player.x + PLAYER_SIZE > o.x &&
        player.y < o.y + o.h &&
        player.y + PLAYER_SIZE > o.y
      ) {
        gameOver = true; stopBackgroundSound(); playSound(200, 0.4); // collision beep
      }
      // remove off‑screen obstacles and increase score
      if (o.x + o.w < 0) {
        obstacles.splice(i, 1);
        score++;
      }
    }
    // spawn new obstacles as needed
    if (nextObstacleX - width < 0) spawnObstacle();
  }

  function drawBackground() {
    // neon gradient sky
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#0ff');
    grad.addColorStop(1, '#001');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    // simple city skyline
    const skylineHeight = height * 0.3;
    const buildingWidth = 40;
    ctx.fillStyle = '#111';
    for (let x = 0; x < width; x += buildingWidth) {
      const h = skylineHeight * (0.5 + Math.random() * 0.5);
      ctx.fillRect(x, height - h, buildingWidth - 2, h);
      // neon windows
      ctx.fillStyle = '#0ff';
      const rows = Math.floor(h / 20);
      for (let r = 0; r < rows; r++) {
        if (Math.random() < 0.3) {
          const w = 6;
          const y = height - h + r * 20 + 4;
          ctx.fillRect(x + 4, y, w, 8);
        }
      }
      ctx.fillStyle = '#111';
    }
}

function draw() {
    // clear background
    ctx.clearRect(0, 0, width, height);
    // draw starfield
    ctx.fillStyle = '#fff';
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 2;
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;
    drawBackground();

    // draw player trail (glowing afterimage)
    ctx.fillStyle = 'rgba(255,255,0,0.3)';
    ctx.shadowColor = '#ff0';
    ctx.shadowBlur = 8;
    trail.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, PLAYER_SIZE * 0.4, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;
    // neon background gradient now part of drawBackground

    // player with neon glow and rounded edges
    ctx.fillStyle = '#ff0';
    ctx.shadowColor = '#ff0';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.moveTo(player.x + PLAYER_SIZE * 0.2, player.y);
    ctx.lineTo(player.x + PLAYER_SIZE * 0.8, player.y);
    ctx.quadraticCurveTo(player.x + PLAYER_SIZE, player.y, player.x + PLAYER_SIZE, player.y + PLAYER_SIZE * 0.2);
    ctx.lineTo(player.x + PLAYER_SIZE, player.y + PLAYER_SIZE * 0.8);
    ctx.quadraticCurveTo(player.x + PLAYER_SIZE, player.y + PLAYER_SIZE, player.x + PLAYER_SIZE * 0.8, player.y + PLAYER_SIZE);
    ctx.lineTo(player.x + PLAYER_SIZE * 0.2, player.y + PLAYER_SIZE);
    ctx.quadraticCurveTo(player.x, player.y + PLAYER_SIZE, player.x, player.y + PLAYER_SIZE * 0.8);
    ctx.lineTo(player.x, player.y + PLAYER_SIZE * 0.2);
    ctx.quadraticCurveTo(player.x, player.y, player.x + PLAYER_SIZE * 0.2, player.y);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // obstacles with neon outline
    ctx.fillStyle = '#f0f';
    obstacles.forEach(o => {
      // draw glowing fill
      ctx.shadowColor = '#f0f';
      ctx.shadowBlur = 12;
      ctx.fillRect(o.x, o.y, o.w, o.h);
      ctx.shadowBlur = 0;
      // draw outline
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.strokeRect(o.x, o.y, o.w, o.h);
    });

    // score
    ctx.fillStyle = '#fff';
    ctx.font = '20px monospace';
    ctx.fillText('Score: ' + score, 10, 30);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f88';
      ctx.font = '40px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // input handling
  window.addEventListener('keydown', e => {
    if (e.code === 'Space' || e.key === ' ') {
      if (player.onGround) player.vy = JUMP_VELOCITY;
      if (gameOver) reset();
    }
  });
  canvas.addEventListener('click', () => {
    if (player.onGround) player.vy = JUMP_VELOCITY;
    if (gameOver) reset();
  });

  // start
  reset();
  requestAnimationFrame(loop);
})();
