// Pixel Runner – simple endless runner
// Targets a canvas with id="game"

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth;
  const height = canvas.height = canvas.offsetHeight;

  // Game constants
  const GRAVITY = 0.6;
  const JUMP_VELOCITY = -12;
  const PLAYER_SIZE = 20;
  const SCROLL_SPEED = 4;
  const OBSTACLE_SPACING = 200; // distance between obstacles

  // State
  let playerY = height - PLAYER_SIZE;
  let playerVy = 0;
  let isJumping = false;
  let offsetX = 0;
  let obstacles = []; // {x, type: 'gap'|'spike'}
  let lastObstacleX = width;
  let score = 0;
  let gameOver = false;

  // Load sounds
  const jumpSound = new Audio('https://assets.codepen.io/6093407/jump.wav');
  const hitSound = new Audio('https://assets.codepen.io/6093407/hit.wav');

  // Input
  const jump = () => {
    if (playerY >= height - PLAYER_SIZE) {
      playerVy = JUMP_VELOCITY;
      jumpSound.currentTime = 0;
      jumpSound.play();
    }
  };
  window.addEventListener('keydown', e => { if (e.code === 'Space' || e.key === ' ') jump(); });
  canvas.addEventListener('pointerdown', jump);

  // Helper to spawn obstacles
  const addObstacle = () => {
    const type = Math.random() < 0.7 ? 'gap' : 'spike';
    obstacles.push({ x: lastObstacleX + OBSTACLE_SPACING, type });
    lastObstacleX += OBSTACLE_SPACING;
  };
  // Fill initial obstacles
  for (let i = 0; i < Math.ceil(width / OBSTACLE_SPACING) + 2; i++) addObstacle();

  const update = () => {
    if (gameOver) return;
    // Player physics
    playerVy += GRAVITY;
    playerY += playerVy;
    if (playerY > height - PLAYER_SIZE) {
      playerY = height - PLAYER_SIZE;
      playerVy = 0;
    }

    // Move obstacles
    obstacles.forEach(o => o.x -= SCROLL_SPEED);
    // Remove off‑screen and add new ones
    if (obstacles[0].x < -40) {
      obstacles.shift();
      addObstacle();
      score++;
    }

    // Collision detection
    const playerRect = { x: 40, y: playerY, w: PLAYER_SIZE, h: PLAYER_SIZE };
    for (const o of obstacles) {
      if (o.type === 'gap') {
        // gap is a hole in the ground; if player is over it and on ground, lose
        const gapStart = o.x;
        const gapEnd = o.x + 40; // gap width
        if (playerRect.x + playerRect.w > gapStart && playerRect.x < gapEnd && playerY + PLAYER_SIZE >= height) {
          gameOver = true;
          hitSound.currentTime = 0;
          hitSound.play();
        }
      } else if (o.type === 'spike') {
        // spike is a triangle from the ground up
        const spikeX = o.x;
        const spikeWidth = 20;
        if (playerRect.x + playerRect.w > spikeX && playerRect.x < spikeX + spikeWidth) {
          // simple point-in-rectangle check for top of spike
          const spikeTopY = height - 30; // height of spike
          if (playerY + PLAYER_SIZE > spikeTopY) {
            gameOver = true;
            hitSound.currentTime = 0;
            hitSound.play();
          }
        }
      }
    }
  };

  const draw = () => {
    ctx.clearRect(0, 0, width, height);

    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#1e1e2f');
    bgGrad.addColorStop(1, '#0a0a13');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // ground with subtle shading
    const groundGrad = ctx.createLinearGradient(0, height - 10, 0, height);
    groundGrad.addColorStop(0, '#555');
    groundGrad.addColorStop(1, '#222');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, height - 10, width, 10);

    // player – small rounded square for a softer look
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(40, playerY);
    ctx.lineTo(40 + PLAYER_SIZE, playerY);
    ctx.quadraticCurveTo(40 + PLAYER_SIZE, playerY, 40 + PLAYER_SIZE, playerY + PLAYER_SIZE / 2);
    ctx.quadraticCurveTo(40 + PLAYER_SIZE, playerY + PLAYER_SIZE, 40 + PLAYER_SIZE / 2, playerY + PLAYER_SIZE);
    ctx.quadraticCurveTo(40, playerY + PLAYER_SIZE, 40, playerY + PLAYER_SIZE / 2);
    ctx.quadraticCurveTo(40, playerY, 40, playerY);
    ctx.closePath();
    ctx.fill();

    // obstacles – enhanced visuals
    obstacles.forEach(o => {
      if (o.type === 'gap') {
        // draw a thin line to indicate gap edge
        ctx.strokeStyle = '#777';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(o.x, height - 10);
        ctx.lineTo(o.x + 40, height - 10);
        ctx.stroke();
      } else if (o.type === 'spike') {
        const spikeGrad = ctx.createLinearGradient(o.x, height - 30, o.x + 20, height - 10);
        spikeGrad.addColorStop(0, '#ff5555');
        spikeGrad.addColorStop(1, '#aa0000');
        ctx.fillStyle = spikeGrad;
        ctx.beginPath();
        ctx.moveTo(o.x, height - 10);
        ctx.lineTo(o.x + 10, height - 30);
        ctx.lineTo(o.x + 20, height - 10);
        ctx.closePath();
        ctx.fill();
      }
    });

    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + score, 10, 20);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px monospace';
      ctx.fillText('Game Over', width / 2 - 60, height / 2);
    }
  };

  const loop = () => {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  };

  // start
  loop();
})();
