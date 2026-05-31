// Simple Endless Runner – Pixel Dash
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 400;

  // Sound assets (embedded base64 WAV)
  const jumpSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YUgAAAA='); // short click
  const hitSound = new Audio('data:audio/wav;base64,UklGRhYAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YVQAAAA='); // low buzz
  const bgMusic = new Audio('data:audio/wav;base64,UklGRlgAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YVYAAAA=');
  bgMusic.loop = true;
  bgMusic.volume = 0.3;
  bgMusic.play();

  // Player configuration
  const player = {
    w: 30,
    h: 30,
    x: 50,
    y: H - 60, // start on ground (groundY = H - 30)
    vy: 0,
    onGround: true,
  };

  // Physics
  const GRAVITY = 0.6;
  const JUMP_VEL = -12;
  const GROUND_Y = H - 30; // ground y position for player bottom

  // Obstacles – simple rectangles on ground
  let obstacles = [];
  let obstacleTimer = 0; // frames until next obstacle
  const OBSTACLE_SPACING = 120; // min frames between obstacles
  const OBSTACLE_SPEED_START = 4;
  let obstacleSpeed = OBSTACLE_SPEED_START;

  // Game state
  let running = true;
  let frame = 0;
  let score = 0;

  // Input – any key or touch triggers a jump if allowed
  const tryJump = () => {
    if (player.onGround) {
      player.vy = JUMP_VEL;
      player.onGround = false;
      jumpSound.currentTime = 0;
      jumpSound.play();
    }
  };
  window.addEventListener('keydown', tryJump);
  window.addEventListener('touchstart', e => { e.preventDefault(); tryJump(); }, { passive: false });

  const rectCollision = (a, b) => (
    a.x < b.x + b.w && a.x + a.w > b.x &&
    a.y < b.y + b.h && a.y + a.h > b.h + b.y
  );

  const update = () => {
    // Player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y + player.h >= GROUND_Y) {
      player.y = GROUND_Y - player.h;
      player.vy = 0;
      player.onGround = true;
    }

    // Obstacle management
    obstacleTimer--;
    if (obstacleTimer <= 0) {
      // create new obstacle with random height (20‑80px)
      const height = 20 + Math.random() * 60;
      obstacles.push({ x: W, y: GROUND_Y - height, w: 20, h: height });
      obstacleTimer = OBSTACLE_SPACING + Math.random() * 60;
    }
    // move obstacles left
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= obstacleSpeed;
      // remove off‑screen
      if (o.x + o.w < 0) {
        obstacles.splice(i, 1);
        score++;
        } else if (rectCollision(player, o)) {
          running = false;
          hitSound.currentTime = 0;
          hitSound.play();
        }
    }

    // increase speed gradually
    obstacleSpeed += 0.001;
  };

  const draw = () => {
    // Background gradient (sky)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
    skyGrad.addColorStop(0, '#87ceeb'); // light blue
    skyGrad.addColorStop(1, '#e0f7fa'); // pale cyan
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);

    // Ground with gradient
    const groundGrad = ctx.createLinearGradient(0, GROUND_Y, 0, GROUND_Y + 20);
    groundGrad.addColorStop(0, '#654321');
    groundGrad.addColorStop(1, '#3e2723');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, GROUND_Y, W, 20);

    // Helper to draw rounded rectangles
    const roundRect = (x, y, w, h, r, fill) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      if (fill) {
        ctx.fillStyle = fill;
        ctx.fill();
      } else {
        ctx.stroke();
      }
    };

    // Player – green rounded square with slight gradient
    const playerGrad = ctx.createLinearGradient(player.x, player.y, player.x, player.y + player.h);
    playerGrad.addColorStop(0, '#6fff6f');
    playerGrad.addColorStop(1, '#00aa00');
    roundRect(player.x, player.y, player.w, player.h, 5, playerGrad);

    // Obstacles – varied colors, rounded
    for (const o of obstacles) {
      const hue = Math.floor(200 + Math.random() * 50);
      const obsColor = `hsl(${hue}, 80%, 45%)`;
      roundRect(o.x, o.y, o.w, o.h, 3, obsColor);
    }

    // Score – white text with shadow
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px sans-serif';
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.shadowBlur = 2;
    ctx.fillText('Score: ' + score, 10, 30);
    // reset shadow
    ctx.shadowColor = 'transparent';

    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  };

  const loop = () => {
    if (!running) {
      draw();
      return; // stop animation
    }
    frame++;
    update();
    draw();
    requestAnimationFrame(loop);
  };

  // Start the game
  loop();
})();
