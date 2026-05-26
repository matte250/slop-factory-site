// Pixel Runner – minimal endless runner
// Targets <canvas id="game"></canvas>
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // set canvas size (fallback if not set in HTML)
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 200;

  // Background colors
  const SKY_COLOR_TOP = '#87CEEB'; // light sky blue
  const SKY_COLOR_BOTTOM = '#B0E0E6'; // pale turquoise
  const GROUND_COLOR = '#654321'; // brown ground
  const GROUND_HEIGHT = 30;
  const STAR_COUNT = 100;
  const STAR_SPEED = 0.2;
  const stars = [];
  // initialize stars
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * (canvas.height - GROUND_HEIGHT),
      radius: Math.random() * 1.5 + 0.5,
    });
  }

  const GRAVITY = 0.6;
  const JUMP_VELOCITY = -12;
  const PLAYER_SIZE = 20;
  const OBSTACLE_WIDTH = 20;
  const OBSTACLE_GAP = 1500; // ms between spawns

  const player = {
    x: 50,
    y: canvas.height - GROUND_HEIGHT - PLAYER_SIZE,
    w: PLAYER_SIZE,
    h: PLAYER_SIZE,
    vy: 0,
    onGround: true,
    draw() {
      // player as rounded square with gradient
      const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.h);
      grad.addColorStop(0, '#ffd700'); // gold top
      grad.addColorStop(1, '#ff8c00'); // dark orange bottom
      ctx.fillStyle = grad;
      const radius = 4;
      ctx.beginPath();
      ctx.moveTo(this.x + radius, this.y);
      ctx.lineTo(this.x + this.w - radius, this.y);
      ctx.quadraticCurveTo(this.x + this.w, this.y, this.x + this.w, this.y + radius);
      ctx.lineTo(this.x + this.w, this.y + this.h - radius);
      ctx.quadraticCurveTo(this.x + 
        this.w, this.y + this.h, this.x + this.w - radius, this.y + this.h);
      ctx.lineTo(this.x + radius, this.y + this.h);
      ctx.quadraticCurveTo(this.x, this.y + this.h, this.x, this.y + this.h - radius);
      ctx.lineTo(this.x, this.y + radius);
      ctx.quadraticCurveTo(this.x, this.y, this.x + radius, this.y);
      ctx.closePath();
      ctx.fill();
    },
    update() {
      this.vy += GRAVITY;
      this.y += this.vy;
      if (this.y + this.h >= canvas.height - GROUND_HEIGHT) {
        this.y = canvas.height - this.h;
        this.vy = 0;
        this.onGround = true;
      } else {
        this.onGround = false;
      }
    },
  };

  const obstacles = [];
  let lastSpawn = 0;
  let score = 0;
  let startTime = performance.now();
  let gameOver = false;

  function spawnObstacle() {
    const height = 30 + Math.random() * 40;
    obstacles.push({
      x: canvas.width,
      y: canvas.height - GROUND_HEIGHT - height,
      w: OBSTACLE_WIDTH,
      h: height,
    });
  }

  function updateObstacles(delta) {
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      // base speed plus acceleration factor
      o.x -= gameSpeed;
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }
    if (performance.now() - lastSpawn > OBSTACLE_GAP) {
      spawnObstacle();
      lastSpawn = performance.now();
    }
  }

  function drawRoundedRect(x, y, w, h, r, style) {
    ctx.fillStyle = style;
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
    ctx.fill();
  }

function drawObstacles() {
    obstacles.forEach(o => {
      const grad = ctx.createLinearGradient(o.x, o.y, o.x, o.y + o.h);
      grad.addColorStop(0, '#8B0000'); // dark red top
      grad.addColorStop(1, '#FF4500'); // orange red bottom
      drawRoundedRect(o.x, o.y, o.w, o.h, 3, grad);
    });
  }

  function drawStars() {
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      s.x -= STAR_SPEED; // slow parallax
      if (s.x < 0) s.x = canvas.width + s.radius;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function checkCollision() {
    for (const o of obstacles) {
      if (
        player.x < o.x + o.w &&
        player.x + player.w > o.x &&
        player.y < o.y + o.h &&
        player.y + player.h > o.y
      ) {
        if (!gameOver) {
          // Play game over sound once
          gameOverAudio.play();
        }
        gameOver = true;
        break;
      }
    }
  }

  function drawScore() {
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
  }

  function reset() {
    player.y = canvas.height - GROUND_HEIGHT - PLAYER_SIZE;
    player.vy = 0;
    obstacles.length = 0;
    score = 0;
    startTime = performance.now();
    gameOver = false;
    lastSpawn = 0;
    requestAnimationFrame(loop);
  }

  function drawBackground(){
    // sky gradient
    const grad = ctx.createLinearGradient(0,0,0,canvas.height);
    grad.addColorStop(0, SKY_COLOR_TOP);
    grad.addColorStop(1, SKY_COLOR_BOTTOM);
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,canvas.width,canvas.height);
    // ground strip
    ctx.fillStyle = GROUND_COLOR;
    ctx.fillRect(0, canvas.height - GROUND_HEIGHT, canvas.width, GROUND_HEIGHT);
}

// Global speed, increases over time
  let gameSpeed = 5;
  // Sound effects
  const jumpAudio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA='); // short beep placeholder
  const gameOverAudio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA='); // same placeholder


function loop(timestamp) {
    const delta = timestamp - (loop.last || timestamp);
    loop.last = timestamp;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    drawStars();

    player.update();
    player.draw();

    updateObstacles(delta);
    drawObstacles();

    // gradually increase speed
    gameSpeed += 0.0005; // subtle acceleration

    checkCollision();
    if (!gameOver) {
      score = (timestamp - startTime) / 1000;
      drawScore();
      requestAnimationFrame(loop);
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over – Score: ' + Math.floor(score), canvas.width / 2, canvas.height / 2);
      ctx.fillText('Press Space to Restart', canvas.width / 2, canvas.height / 2 + 30);
    }
  }

  // Input handling
  function onJump(e) {
    if (e.type === 'keydown' && e.code !== 'Space') return;
    if (gameOver) {
      reset();
} else if (player.onGround) {
        // Play jump sound
        jumpAudio.currentTime = 0;
        jumpAudio.play();
        player.vy = JUMP_VELOCITY;
      }
  }
  window.addEventListener('keydown', onJump);
  // Touch support – tap to jump / restart
  window.addEventListener('touchstart', (e) => {
    e.preventDefault();
    onJump({type: 'keydown'});
  }, {passive: false});

  // start game
  requestAnimationFrame(loop);
})();
