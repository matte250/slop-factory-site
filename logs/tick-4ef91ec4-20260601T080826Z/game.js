// Neon Runner – minimal endless runner
// Canvas element with id="game" must exist in the page.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 200;

  // Game settings
  const PLAYER_SIZE = 20;
  const GRAVITY = 0.6;
  const JUMP_VELOCITY = -12;
  const OBSTACLE_WIDTH = 20;
  const OBSTACLE_GAP = 150; // distance between obstacles
  const SPEED = 4;

  let player = { x: 50, y: height - PLAYER_SIZE, vy: 0, onGround: true };

  // Star field for background effect
  const STAR_COUNT = 50;
  const stars = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height, size: Math.random() * 2 + 1, speed: Math.random() * 0.5 + 0.2 });
  }

  // Audio assets (small base64-encoded wav)
  // Jump sound – short beep
  const jumpAudio = new Audio('data:audio/wav;base64,//uQZAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACABAAZGF0YYAAAAA=' );
  // Hit / game over sound – lower tone
  const hitAudio = new Audio('data:audio/wav;base64,//uQZAAAAAAABAAAAAAAAAAAAAAAWGluZzAAAAAAABAAAABAAAABAAAAAAAAAA=' );
  let obstacles = [];
  let frameCount = 0;
  let running = true;

  function spawnObstacle() {
    const type = Math.random() < 0.5 ? 'spike' : 'gap';
    const x = width;
    if (type === 'spike') {
      obstacles.push({ type, x, y: height - PLAYER_SIZE, w: OBSTACLE_WIDTH, h: PLAYER_SIZE });
    } else {
      // gap: just a space the player must jump over; represent as invisible obstacle for collision check
      obstacles.push({ type, x, w: OBSTACLE_WIDTH, gap: true });
    }
  }

let gameOverPlayed = false;
function update() {
    // Player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y >= height - PLAYER_SIZE) {
      player.y = height - PLAYER_SIZE;
      player.vy = 0;
      player.onGround = true;
    } else {
      player.onGround = false;
    }

    // Move obstacles
    obstacles.forEach(o => o.x -= SPEED);
    // Remove off‑screen obstacles
    obstacles = obstacles.filter(o => o.x + o.w > 0);

    // Update star field for parallax effect
    stars.forEach(s => {
      s.x -= s.speed;
      if (s.x < 0) s.x = width;
    });

    // Spawn new obstacles
    if (frameCount % Math.floor(OBSTACLE_GAP / SPEED) === 0) spawnObstacle();

    // Collision detection
    for (const o of obstacles) {
      if (o.type === 'spike') {
        const collides =
          player.x < o.x + o.w &&
          player.x + PLAYER_SIZE > o.x &&
          player.y < o.y + o.h &&
          player.y + PLAYER_SIZE > o.y;
        if (collides) {
          running = false;
          if (!gameOverPlayed) { hitAudio.play(); gameOverPlayed = true; }
        }
      } else if (o.type === 'gap') {
        // gap is a hole: if player is over the gap and not jumping enough, lose
        const overGap = player.x + PLAYER_SIZE > o.x && player.x < o.x + o.w;
        if (overGap && player.onGround) {
          running = false;
          if (!gameOverPlayed) { hitAudio.play(); gameOverPlayed = true; }
          break;
        }
      }
    }

    frameCount++;
  }



  function draw() {
    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#001');
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Neon glow settings
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 12;

    // draw player (neon cyan, rounded)
    ctx.fillStyle = '#00ffff';
    const radius = 4;
    ctx.beginPath();
    ctx.moveTo(player.x + radius, player.y);
    ctx.lineTo(player.x + PLAYER_SIZE - radius, player.y);
    ctx.quadraticCurveTo(player.x + PLAYER_SIZE, player.y, player.x + PLAYER_SIZE, player.y + radius);
    ctx.lineTo(player.x + PLAYER_SIZE, player.y + PLAYER_SIZE - radius);
    ctx.quadraticCurveTo(player.x + PLAYER_SIZE, player.y + PLAYER_SIZE, player.x + PLAYER_SIZE - radius, player.y + PLAYER_SIZE);
    ctx.lineTo(player.x + radius, player.y + PLAYER_SIZE);
    ctx.quadraticCurveTo(player.x, player.y + PLAYER_SIZE, player.x, player.y + PLAYER_SIZE - radius);
    ctx.lineTo(player.x, player.y + radius);
    ctx.quadraticCurveTo(player.x, player.y, player.x + radius, player.y);
    ctx.fill();

    // draw obstacles with glow
    ctx.shadowColor = '#f0f';
    ctx.shadowBlur = 10;
    obstacles.forEach(o => {
      if (o.type === 'spike') {
        // draw triangular spike
        ctx.fillStyle = '#ff00ff';
        ctx.beginPath();
        ctx.moveTo(o.x, o.y + PLAYER_SIZE);
        ctx.lineTo(o.x + o.w / 2, o.y);
        ctx.lineTo(o.x + o.w, o.y + PLAYER_SIZE);
        ctx.closePath();
        ctx.fill();
      } else if (o.type === 'gap') {
        // visualize gap as a dark cutout (no glow)
        ctx.fillStyle = '#111';
        ctx.fillRect(o.x, height - PLAYER_SIZE, o.w, PLAYER_SIZE);
      }
    });
    // reset shadow for other drawings
    ctx.shadowBlur = 0;
  }

  function loop() {
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
      return;
    }
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // Input – tap/click to jump
  window.addEventListener('mousedown', () => {
    if (player.onGround) {
      player.vy = JUMP_VELOCITY;
      jumpAudio.currentTime = 0;
      jumpAudio.play();
    }
  });
  window.addEventListener('touchstart', e => {
    e.preventDefault();
    if (player.onGround) {
      player.vy = JUMP_VELOCITY;
      jumpAudio.currentTime = 0;
      jumpAudio.play();
    }
  }, { passive: false });

  // start
  requestAnimationFrame(loop);
})();
