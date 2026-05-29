// Simple endless runner based on IDEA.md
// Canvas with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 200;

  // Game constants
  const GRAVITY = 0.6;
  const JUMP_SPEED = -12;
  const PLAYER_SIZE = 20;
  const PLAYER_X = 50;
  const OBSTACLE_WIDTH = 20;
  const OBSTACLE_GAP = 150; // distance between obstacles
  const SPEED = 4;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }
  // Ensure audio context is resumed on first user interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  window.addEventListener('click', resumeAudio);
  window.addEventListener('keydown', resumeAudio);

  let playerY = height - PLAYER_SIZE;
  let playerVy = 0;
  let obstacles = [];
  let clouds = [];
  // moving background clouds
  const CLOUD_SPEED = 1;
  const CLOUD_SPAWN_INTERVAL = 200; // frames
  let cloudSpawnCounter = 0;
  let frameCount = 0;
  let score = 0;
  let gameOver = false;

  // Input handling – space or click to jump
  const jump = () => {
    if (playerY >= height - PLAYER_SIZE) {
      playerVy = JUMP_SPEED;
      playTone(400, 0.1); // jump sound
    }
  };
  window.addEventListener('keydown', e => { if (e.code === 'Space') jump(); });
  canvas.addEventListener('click', jump);

  function spawnObstacle() {
    // spawn a ground obstacle as before

    const heightOptions = [PLAYER_SIZE, PLAYER_SIZE * 2, PLAYER_SIZE * 3];
    const h = heightOptions[Math.floor(Math.random() * heightOptions.length)];
    obstacles.push({ x: width, h });
  }

  function update() {
    if (gameOver) return;
    frameCount++;
    // Player physics
    playerVy += GRAVITY;
    playerY += playerVy;
    if (playerY > height - PLAYER_SIZE) {
      playerY = height - PLAYER_SIZE;
      playerVy = 0;
    }
    // Obstacles movement and generation
    obstacles.forEach(o => o.x -= SPEED);
    if (obstacles.length === 0 || obstacles[obstacles.length - 1].x < width - OBSTACLE_GAP) {
      spawnObstacle();
    }
    // Remove passed obstacles
    obstacles = obstacles.filter(o => o.x + OBSTACLE_WIDTH > 0);
    // Cloud movement and spawning
    clouds.forEach(c => c.x -= CLOUD_SPEED);
    cloudSpawnCounter++;
    if (cloudSpawnCounter >= CLOUD_SPAWN_INTERVAL) {
      cloudSpawnCounter = 0;
      const radius = 15 + Math.random() * 10;
      clouds.push({ x: width, y: 30 + Math.random() * 40, r: radius });
    }
    clouds = clouds.filter(c => c.x + c.r > 0);
    // Collision detection
    for (const o of obstacles) {
      const playerRect = { x: PLAYER_X, y: playerY, w: PLAYER_SIZE, h: PLAYER_SIZE };
      const obstacleRect = { x: o.x, y: height - o.h, w: OBSTACLE_WIDTH, h: o.h };
      if (rectIntersect(playerRect, obstacleRect)) {
        playTone(200, 0.3); // collision sound
        gameOver = true;
        break;
      }
    }
    // Score based on frames survived
    score = Math.floor(frameCount / 10);
  }

  function rectIntersect(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function draw() {
    // Sky gradient background
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, '#74b9ff');
    skyGrad.addColorStop(1, '#81ecec');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // simple moving clouds (circles)
    clouds.forEach(c => {
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // ground with slight texture
    ctx.fillStyle = '#2d3436';
    ctx.fillRect(0, height - 10, width, 10);
    for (let i = 0; i < width; i += 20) {
      ctx.fillStyle = '#636e72';
      ctx.fillRect(i, height - 12, 10, 2);
    }

    // player as a rounded square for smoother look
    ctx.fillStyle = '#00b894';
    ctx.beginPath();
    ctx.moveTo(PLAYER_X, playerY + PLAYER_SIZE);
    ctx.lineTo(PLAYER_X, playerY);
    ctx.lineTo(PLAYER_X + PLAYER_SIZE, playerY);
    ctx.lineTo(PLAYER_X + PLAYER_SIZE, playerY + PLAYER_SIZE);
    ctx.closePath();
    ctx.fill();

    // obstacles as spikes (triangles)
    ctx.fillStyle = '#d63031';
    obstacles.forEach(o => {
      const baseY = height - o.h;
      ctx.beginPath();
      ctx.moveTo(o.x, baseY);
      ctx.lineTo(o.x + OBSTACLE_WIDTH / 2, baseY - o.h);
      ctx.lineTo(o.x + OBSTACLE_WIDTH, baseY);
      ctx.closePath();
      ctx.fill();
    });

    // score
    ctx.fillStyle = '#2d3436';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2 - 60, height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // start game
  requestAnimationFrame(loop);
})();
