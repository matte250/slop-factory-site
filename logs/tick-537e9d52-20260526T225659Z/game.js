// Simple endless runner based on IDEA.md
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth || 800;
  // ----- Audio -----
  const jumpSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQgAAAAA');
  const hitSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQgAAAAA');
  const height = canvas.height = canvas.offsetHeight || 200;

  // ----- Graphics helpers -----
  function drawBackground() {
    // Sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, height * 0.6);
    sky.addColorStop(0, '#87CEEB');
    sky.addColorStop(1, '#B0E0E6');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height * 0.6);
    // Ground
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, height * 0.8, width, height * 0.2);
  }

  // Simple cloud class for parallax effect
  const clouds = [];
  function spawnCloud() {
    const cw = 60 + Math.random() * 40;
    const ch = 30 + Math.random() * 20;
    clouds.push({ x: width, y: Math.random() * height * 0.4, w: cw, h: ch, speed: 0.5 + Math.random() * 0.5 });
  }
  function updateClouds() {
    for (let i = clouds.length - 1; i >= 0; i--) {
      const c = clouds[i];
      c.x -= c.speed;
      if (c.x + c.w < 0) clouds.splice(i, 1);
    }
    if (Math.random() < 0.01) spawnCloud();
  }
  function drawClouds() {
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    clouds.forEach(c => ctx.fillRect(c.x, c.y, c.w, c.h));
  }

  const player = {
    x: 50,
    y: height - 30,
    w: 20,
    h: 30,
    vy: 0,
    jumpStrength: -8,
    onGround: true,
    draw() {
      // Rounded rectangle with gradient
      const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.h);
      grad.addColorStop(0, '#4CAF50');
      grad.addColorStop(1, '#2E7D32');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(this.x + 5, this.y);
      ctx.lineTo(this.x + this.w - 5, this.y);
      ctx.quadraticCurveTo(this.x + this.w, this.y, this.x + this.w, this.y + 5);
      ctx.lineTo(this.x + this.w, this.y + this.h - 5);
      ctx.quadraticCurveTo(this.x + this.w, this.y + this.h, this.x + this.w - 5, this.y + this.h);
      ctx.lineTo(this.x + 5, this.y + this.h);
      ctx.quadraticCurveTo(this.x, this.y + this.h, this.x, this.y + this.h - 5);
      ctx.lineTo(this.x, this.y + 5);
      ctx.quadraticCurveTo(this.x, this.y, this.x + 5, this.y);
      ctx.closePath();
      ctx.fill();
    },
    update() {
      this.vy += 0.4; // gravity
      this.y += this.vy;
      if (this.y + this.h >= height * 0.8) {
        this.y = height * 0.8 - this.h;
        this.vy = 0;
        this.onGround = true;
      } else {
        this.onGround = false;
      }
    },
    jump() { if (this.onGround) { this.vy = this.jumpStrength; this.onGround = false; jumpSound.play(); } }
  };

  // obstacles: simple rectangles moving left with gradient shading
  const obstacles = [];
  let obstacleTimer = 0;
  const obstacleInterval = 120; // frames
  let score = 0;
  let gameOver = false;

  function spawnObstacle() {
    const w = 20 + Math.random() * 20;
    const h = 20 + Math.random() * 40;
    obstacles.push({ x: width, y: height * 0.8 - h, w, h, passed: false });
  }

  function updateObstacles() {
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= 3; // speed
      // collision
      if (!gameOver &&
          player.x < o.x + o.w &&
          player.x + player.w > o.x &&
          player.y < o.y + o.h &&
          player.y + player.h > o.y) {
        gameOver = true; hitSound.play();
      }
      // remove off‑screen
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }
  }

  function drawObstacles() {
    obstacles.forEach(o => {
      const grad = ctx.createLinearGradient(o.x, o.y, o.x, o.y + o.h);
      grad.addColorStop(0, '#D32F2F');
      grad.addColorStop(1, '#7B241C');
      ctx.fillStyle = grad;
      ctx.fillRect(o.x, o.y, o.w, o.h);
    });
  }

  function drawScore() {
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
  }

  function loop() {
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2 - 60, height / 2);
      return;
    }
    // Draw background and clouds first
    drawBackground();
    updateClouds();
    drawClouds();
    // Game entities
    player.update();
    player.draw();
    obstacleTimer++;
    if (obstacleTimer > obstacleInterval) { spawnObstacle(); obstacleTimer = 0; }
    updateObstacles();
    drawObstacles();
    score++;
    drawScore();
    requestAnimationFrame(loop);
  }

  canvas.addEventListener('click', () => player.jump());
  // also support touch
  canvas.addEventListener('touchstart', e => { e.preventDefault(); player.jump(); });

  loop();
})();
