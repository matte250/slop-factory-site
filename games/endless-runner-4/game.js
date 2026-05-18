// Simple endless runner targeting <canvas id="game"></canvas>
// Dot (player) jumps over scrolling rectangular obstacles.
// Collision reduces lives; after 3 collisions game over.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  // Adjust for high‑DPI displays
  const dpr = window.devicePixelRatio || 1;
  const logicalWidth = canvas.clientWidth || 800;
  const logicalHeight = canvas.clientHeight || 200;
  canvas.width = logicalWidth * dpr;
  canvas.height = logicalHeight * dpr;
  ctx.scale(dpr, dpr);
  // Set CSS size for crisp rendering
  canvas.style.width = logicalWidth + 'px';
  canvas.style.height = logicalHeight + 'px';
  // Store logical size for drawing
  const LOGICAL_WIDTH = logicalWidth;
  const LOGICAL_HEIGHT = logicalHeight;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio context resumes on first interaction
  const resumeAudio = () => { if (audioCtx.state !== 'running') audioCtx.resume(); };
  window.addEventListener('keydown', resumeAudio, { once: true });
  canvas.addEventListener('mousedown', resumeAudio, { once: true });
  function playBeep(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }

  // Game constants
  const GRAVITY = 0.6;
  const JUMP_SPEED = -12;
  const PLAYER_RADIUS = 10;
  const PLAYER_X = 50; // fixed horizontal position
  const OBSTACLE_WIDTH = 20;
  const OBSTACLE_GAP = 150; // distance between obstacles
  const BASE_OBSTACLE_SPEED = 4;
  const SPEED_INCREASE = 0.001; // per frame
  const MAX_LIVES = 3;
  const GROUND_HEIGHT = 30; // height of ground strip
  const SKY_TOP = '#87ceeb';
  const SKY_BOTTOM = '#b0e0e6';

  // Game state
  // Player stands on ground strip
  let playerY = LOGICAL_HEIGHT - GROUND_HEIGHT - PLAYER_RADIUS;
  let playerVy = 0;
  let obstacles = [];
  let framesSinceLast = 0;
  let lives = MAX_LIVES;
  let gameOver = false;

  // Input handling – space or click to jump
  const jump = () => {
    if (playerY >= canvas.height - PLAYER_RADIUS) {
      playerVy = JUMP_SPEED;
    }
  };
  window.addEventListener('keydown', (e) => { if (e.code === 'Space') jump(); });
  canvas.addEventListener('mousedown', jump);

  // Main loop
  let totalFrames = 0;
  function update() {
    if (gameOver) return;
    totalFrames++;
    // Player physics
    playerVy += GRAVITY;
    playerY += playerVy;
    if (playerY > LOGICAL_HEIGHT - GROUND_HEIGHT - PLAYER_RADIUS) {
      playerY = LOGICAL_HEIGHT - GROUND_HEIGHT - PLAYER_RADIUS;
      playerVy = 0;
    }

    // Obstacle management
    framesSinceLast++;
    if (framesSinceLast > OBSTACLE_GAP) {
      // Height limited by logical canvas height minus ground and a minimum
      const maxObstacleHeight = LOGICAL_HEIGHT - GROUND_HEIGHT - 20;
      obstacles.push({ x: LOGICAL_WIDTH, w: OBSTACLE_WIDTH, h: Math.random() * (maxObstacleHeight / 2) + 30 });
      framesSinceLast = 0;
    }
    const currentSpeed = BASE_OBSTACLE_SPEED + totalFrames * SPEED_INCREASE;
    obstacles.forEach(ob => ob.x -= currentSpeed);
    // Remove off‑screen obstacles
    obstacles = obstacles.filter(ob => ob.x + ob.w > 0);

    // Collision detection (circle‑rect)
    for (const ob of obstacles) {
      const cx = PLAYER_X;
      const cy = playerY;
      const rx = ob.x;
      const ry = LOGICAL_HEIGHT - GROUND_HEIGHT - ob.h;
      const rw = ob.w;
      const rh = ob.h;
      const nearestX = Math.max(rx, Math.min(cx, rx + rw));
      const nearestY = Math.max(ry, Math.min(cy, ry + rh));
      const dx = cx - nearestX;
      const dy = cy - nearestY;
      if (dx * dx + dy * dy < PLAYER_RADIUS * PLAYER_RADIUS) {
        // Collision
        lives--;
        // Remove this obstacle to avoid repeated hits
        ob.x = -ob.w;
        if (lives <= 0) {
          gameOver = true;
        }
        break;
      }
    }

    draw();
    requestAnimationFrame(update);
  }

  function draw() {
    // Clear using logical size
    ctx.clearRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    // Draw sky gradient background
    const skyGrad = ctx.createLinearGradient(0, 0, 0, LOGICAL_HEIGHT - GROUND_HEIGHT);
    skyGrad.addColorStop(0, SKY_TOP);
    skyGrad.addColorStop(1, SKY_BOTTOM);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT - GROUND_HEIGHT);
    // Draw ground strip
    ctx.fillStyle = '#654321'; // brown ground
    ctx.fillRect(0, LOGICAL_HEIGHT - GROUND_HEIGHT, LOGICAL_WIDTH, GROUND_HEIGHT);
    // Draw player with slight shadow
    ctx.save();
    ctx.fillStyle = 'deepskyblue';
    ctx.beginPath();
    ctx.arc(PLAYER_X, playerY, PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Draw obstacles with gradient
    const obsGrad = ctx.createLinearGradient(0, LOGICAL_HEIGHT - GROUND_HEIGHT, 0, LOGICAL_HEIGHT);
    obsGrad.addColorStop(0, '#ff7f7f');
    obsGrad.addColorStop(1, '#b22222');
    ctx.fillStyle = obsGrad;
    obstacles.forEach(ob => {
      ctx.fillRect(ob.x, LOGICAL_HEIGHT - GROUND_HEIGHT - ob.h, ob.w, ob.h);
    });
    // Draw UI overlay
    ctx.fillStyle = 'black';
    ctx.font = '16px sans-serif';
    ctx.fillText('Lives: ' + lives, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2);
    }
  }

  // Start the loop
  update();
})();
