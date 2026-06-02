// Sky Runner – minimal canvas game
// Canvas with id="game" must exist in the HTML.

(() => {
  // Audio setup
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioCtx();
  // Ensure audio context is resumed on user interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  canvas.addEventListener('mousedown', resumeAudio);
  canvas.addEventListener('touchstart', resumeAudio);
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.stop(audioCtx.currentTime + dur);
  }
  function playJumpSound() { playTone(300, 0.15); }
  function playStarSound() { playTone(800, 0.12); }
  function playGameOverSound() { playTone(100, 0.5); }
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth || 800;
  const H = canvas.height = canvas.offsetHeight || 400;

  // Game constants
  const GRAVITY = 0.5;
  const JUMP_SPEED = -12;
  const PLAYER_SIZE = 30;
  const OBSTACLE_WIDTH = 30;
  const GAP_WIDTH = 80;
  const STAR_SIZE = 12;
  const SCROLL_SPEED = 4;
  const CLOUD_COUNT = 3;

  // State
  let playerY = H - PLAYER_SIZE;

  // clouds array
  let clouds = [];

  let playerVY = 0;
  let score = 0;
  let stars = 0;
  let obstacleX = W;
  let isGap = false;
  let gapX = W + 200;
  let starX = W + 400;
  let starY = H - PLAYER_SIZE - 80;
  let gameOver = false;

  // Input – tap/click to jump
  const jump = () => {
    if (playerY >= H - PLAYER_SIZE) {
      playerVY = JUMP_SPEED;
      playJumpSound();
    }
  };
  canvas.addEventListener('mousedown', jump);
  canvas.addEventListener('touchstart', jump);

  function reset() {
    playerY = H - PLAYER_SIZE;
    playerVY = 0;
    score = 0;
    stars = 0;
    obstacleX = W;
    isGap = false;
    gapX = W + 200;
    starX = W + 400;
    gameOver = false;
    // initialise clouds
    clouds = [];
    for (let i = 0; i < CLOUD_COUNT; i++) {
      clouds.push({
        x: Math.random() * W,
        y: Math.random() * (H * 0.4),
        r: 20 + Math.random() * 15,
        speed: 0.5 + Math.random() * 0.5,
      });
    }
  }

  function update() {
    if (gameOver) return;
    // Move objects left
    obstacleX -= SCROLL_SPEED;
    gapX -= SCROLL_SPEED;
    starX -= SCROLL_SPEED;

    // Move clouds left (parallax slower)
    clouds.forEach(c => {
      c.x -= c.speed;
      if (c.x < -c.r * 2) {
        c.x = W + c.r * 2;
        c.y = Math.random() * (H * 0.4);
        c.r = 20 + Math.random() * 15;
        c.speed = 0.5 + Math.random() * 0.5;
      }
    });

    // Recycle obstacle
    if (obstacleX < -OBSTACLE_WIDTH) {
      obstacleX = W + Math.random() * 200;
      // Randomly decide if next segment is a gap instead of an obstacle
      isGap = Math.random() < 0.3;
      if (isGap) gapX = obstacleX + OBSTACLE_WIDTH + GAP_WIDTH;
    }

    // Recycle star
    if (starX < -STAR_SIZE) {
      starX = W + Math.random() * 300;
      starY = H - PLAYER_SIZE - 40 - Math.random() * 80;
    }

    // Player physics
    playerVY += GRAVITY;
    playerY += playerVY;
    if (playerY > H - PLAYER_SIZE) playerY = H - PLAYER_SIZE;

    // Collision detection with obstacle (if not a gap)
    if (!isGap) {
      const inX = obstacleX < PLAYER_SIZE && obstacleX + OBSTACLE_WIDTH > 0;
      const inY = playerY + PLAYER_SIZE > H - OBSTACLE_WIDTH; // ground obstacle height same as width
      if (inX && inY) { gameOver = true; playGameOverSound(); }
    }

    // Falling into a gap
    if (isGap) {
      const overGap = obstacleX < PLAYER_SIZE && obstacleX + OBSTACLE_WIDTH + GAP_WIDTH > 0;
      if (overGap && playerY + PLAYER_SIZE >= H) { gameOver = true; playGameOverSound(); }
    }

    // Collect star
    const starHit = Math.abs(starX - PLAYER_SIZE / 2) < (STAR_SIZE + PLAYER_SIZE) / 2 &&
                    Math.abs(starY - playerY) < (STAR_SIZE + PLAYER_SIZE) / 2;
    if (starHit) {
      stars++;
      // Move star out of view
      starX = -STAR_SIZE;
      playStarSound();
    }

    score++;
  }

  function draw() {
    // Clear
    ctx.clearRect(0, 0, W, H);

    // Sky background gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
    skyGrad.addColorStop(0, '#87CEEB'); // light sky
    skyGrad.addColorStop(1, '#4682B4'); // deeper sky
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);

    // Clouds
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    clouds.forEach(c => {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.arc(c.x + c.r * 0.8, c.y - c.r * 0.6, c.r * 0.7, 0, Math.PI * 2);
      ctx.arc(c.x - c.r * 0.8, c.y - c.r * 0.6, c.r * 0.7, 0, Math.PI * 2);
      ctx.fill();
    });

    // Ground
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, H - 10, W, 10);

    // Player with gradient
    ctx.fillStyle = playerColorGrad;
    ctx.fillRect(playerX, playerY, PLAYER_SIZE, PLAYER_SIZE);

    // Obstacle / gap
    ctx.fillStyle = '#333';
    if (!isGap) {
      ctx.fillRect(obstacleX, H - OBSTACLE_WIDTH - 10, OBSTACLE_WIDTH, OBSTACLE_WIDTH);
    } else {
      // draw left obstacle block
      ctx.fillRect(obstacleX, H - OBSTACLE_WIDTH - 10, OBSTACLE_WIDTH, OBSTACLE_WIDTH);
      // draw right obstacle block after gap
      const rightX = obstacleX + OBSTACLE_WIDTH + GAP_WIDTH;
      ctx.fillRect(rightX, H - OBSTACLE_WIDTH - 10, OBSTACLE_WIDTH, OBSTACLE_WIDTH);
    }

    // Star with twinkle effect
    ctx.save();
    const starAlpha = 0.5 + 0.5 * Math.sin(Date.now() / 500);
    ctx.globalAlpha = starAlpha;
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(starX, starY, STAR_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // UI
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Stars: ${stars}`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over – Click to Restart', W / 2, H / 2);
    }
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // Restart on click when over
  canvas.addEventListener('mousedown', () => { if (gameOver) reset(); });
  canvas.addEventListener('touchstart', () => { if (gameOver) reset(); });

  reset();
  loop();
})();
