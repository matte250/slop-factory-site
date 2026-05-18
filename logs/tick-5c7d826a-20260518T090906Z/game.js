// Pixel Runner – simple endless side‑scroll runner
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  // Load simple sound effects using data URIs
  const jumpSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YQgAAAAA'); // short silent placeholder
  const crashSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YQgAAAAA'); // placeholder
  const ctx = canvas.getContext('2d');
  const W = canvas.width = 800;
  const H = canvas.height = 200;

  // Game state
  let speed = 2; // pixels per frame
  let score = 0;
  let gameOver = false;

  // Player
  const player = {
    // Player rendered as a circle with gradient
    draw() {
      const grad = ctx.createRadialGradient(this.x + this.w/2, this.y + this.h/2, 0, this.x + this.w/2, this.y + this.h/2, this.w);
      grad.addColorStop(0, '#ff4444');
      grad.addColorStop(1, '#880000');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.x + this.w/2, this.y + this.h/2, this.w/2, 0, Math.PI*2);
      ctx.fill();
    },
    x: 50,
    y: H - 20,
    w: 10,
    h: 10,
    vy: 0,
    jumpStrength: -6,
    onGround: true,
    draw() {
      ctx.fillStyle = '#000';
      ctx.fillRect(this.x, this.y, this.w, this.h);
    },
    update() {
      this.vy += 0.3; // gravity
      this.y += this.vy;
      if (this.y + this.h >= H) {
        this.y = H - this.h;
        this.vy = 0;
        this.onGround = true;
      } else {
        this.onGround = false;
      }
    },
    jump() {
      if (this.onGround) {
        this.vy = this.jumpStrength;
        this.onGround = false;
        // Play jump sound
        jumpSound.currentTime = 0;
        jumpSound.play();
      }
    }
  };

  // Obstacles – simple vertical blocks of varying height
  const obstacles = [];
  function spawnObstacle() {
    const gap = 120 + Math.random() * 80; // distance from previous obstacle
    const lastX = obstacles.length ? obstacles[obstacles.length - 1].x : W;
    const x = Math.max(lastX + gap, W);
    const h = 20 + Math.random() * 30;
    obstacles.push({ x, y: H - h, w: 10, h });
  }

  // Input handling
  window.addEventListener('keydown', e => {
    if (e.code === 'Space') player.jump();
  });
  canvas.addEventListener('pointerdown', () => player.jump());

  // Main loop
  function loop() {
    if (gameOver) return;
    // Draw background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#cceeff');
    bgGrad.addColorStop(1, '#88bbdd');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Update player
    player.update();
    player.draw();

    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const ob = obstacles[i];
      ob.x -= speed;
      // Obstacle with vertical gradient
      const obGrad = ctx.createLinearGradient(0, ob.y, 0, H);
      obGrad.addColorStop(0, '#555555');
      obGrad.addColorStop(1, '#222222');
      ctx.fillStyle = obGrad;
      ctx.fillRect(ob.x, ob.y, ob.w, ob.h);

      // Collision
      if (
        player.x < ob.x + ob.w &&
        player.x + player.w > ob.x &&
        player.y < ob.y + ob.h &&
        player.y + player.h > ob.y
      ) {
        gameOver = true;
        // Play crash sound
        crashSound.currentTime = 0;
        crashSound.play();
      }

      // Remove off‑screen obstacles
      if (ob.x + ob.w < 0) obstacles.splice(i, 1);
    }

    // Spawn new obstacles periodically
    if (obstacles.length === 0 || obstacles[obstacles.length - 1].x < W - 200) {
      spawnObstacle();
    }

    // Increase speed gradually
    speed += 0.0005;
    score += speed;
    ctx.fillStyle = '#000';
    ctx.font = '14px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);

    if (!gameOver) requestAnimationFrame(loop);
    else {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', W / 2 - 60, H / 2);
    }
  }

  // Start
  spawnObstacle();
  loop();
})();
