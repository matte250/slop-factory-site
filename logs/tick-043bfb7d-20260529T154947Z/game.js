// Simple endless runner for canvas with id "game"
// © Generated from IDEA.md - minimal implementation

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width = canvas.offsetWidth || 800;
  const HEIGHT = canvas.height = canvas.offsetHeight || 400;

  // Game constants
  const GRAVITY = 0.6;
  const JUMP_STRENGTH = -12;
  const SPEED = 4; // world scroll speed
  const PLATFORM_HEIGHT = 20;

  // Player
  // Sound assets
  const jumpSound = new Audio('jump.wav');
  const dieSound = new Audio('die.wav');
  const bgMusic = new Audio('bg.mp3');
  bgMusic.loop = true;
  bgMusic.volume = 0.3;
  bgMusic.play().catch(() => {}); // ignore autoplay block

  const player = {
    w: 20,
    h: 20,
    x: 50,
    y: HEIGHT - PLATFORM_HEIGHT - 20,
    vy: 0,
    onGround: false,
    draw() {
      const grad = ctx.createRadialGradient(this.x + this.w/2, this.y + this.h/2, 2, this.x + this.w/2, this.y + this.h/2, this.w);
      grad.addColorStop(0, '#ff0');
      grad.addColorStop(1, '#ff8c00');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.x + this.w/2, this.y + this.h/2, this.w/2, 0, Math.PI * 2);
      ctx.fill();
    },
    update() {
      this.vy += GRAVITY;
      this.y += this.vy;
      // simple ground check
      if (this.y + this.h >= HEIGHT - PLATFORM_HEIGHT) {
        this.y = HEIGHT - PLATFORM_HEIGHT - this.h;
        this.vy = 0;
        this.onGround = true;
      } else {
        this.onGround = false;
      }
    },
    jump() {
      if (this.onGround) {
        this.vy = JUMP_STRENGTH;
        jumpSound.currentTime = 0;
        jumpSound.play().catch(() => {});
      }
    },
  };

  // Platforms & obstacles (as simple rectangles)
  const platforms = [];
  const obstacles = [];

  function spawnPlatform() {
    const w = 100 + Math.random() * 100;
    const gap = 50 + Math.random() * 100;
    const x = WIDTH;
    const y = HEIGHT - PLATFORM_HEIGHT;
    platforms.push({ x, y, w, h: PLATFORM_HEIGHT });
    // Maybe spawn an obstacle on the platform
    if (Math.random() < 0.3) {
      const obW = 20;
      const obH = 30;
      const obX = x + w / 2 - obW / 2;
      obstacles.push({ x: obX, y: y - obH, w: obW, h: obH });
    }
    // Schedule next platform after current width + gap passes
    setTimeout(spawnPlatform, (w + gap) / SPEED * 16); // approx frames
  }

  // Start with a few platforms
  for (let i = 0; i < 3; i++) spawnPlatform();

  // Input handling
  function onInput() {
    player.jump();
  }
  window.addEventListener('keydown', (e) => { if (e.code === 'Space' || e.code === 'ArrowUp') onInput(); });
  canvas.addEventListener('pointerdown', onInput);

  function rectCollision(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  let gameOver = false;

  function update() {
    if (gameOver) return;
    // Move world left
    platforms.forEach(p => p.x -= SPEED);
    obstacles.forEach(o => o.x -= SPEED);
    // Remove off‑screen
    while (platforms.length && platforms[0].x + platforms[0].w < 0) platforms.shift();
    while (obstacles.length && obstacles[0].x + obstacles[0].w < 0) obstacles.shift();
    // Update player
    player.update();
    // Collision with obstacles
    for (const o of obstacles) {
      if (rectCollision(player, o)) {
          gameOver = true;
          dieSound.currentTime = 0;
          dieSound.play().catch(() => {});
          bgMusic.pause();
          break;
        }
      }
      // Fall off platform detection (if not on ground and below platform line)
      if (!player.onGround && player.y + player.h > HEIGHT) {
        gameOver = true;
        dieSound.currentTime = 0;
        dieSound.play().catch(() => {});
        bgMusic.pause();
      }
  }

  function draw() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    // Background with gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    bgGrad.addColorStop(0, '#4a90e2');
    bgGrad.addColorStop(1, '#003973');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    // Platforms with gradient
    const platGrad = ctx.createLinearGradient(0, HEIGHT - 20, 0, HEIGHT);
    platGrad.addColorStop(0, '#7d5a50');
    platGrad.addColorStop(1, '#3e2723');
    ctx.fillStyle = platGrad;
    for (const p of platforms) {
      ctx.fillRect(p.x, p.y, p.w, p.h);
    }
    // Obstacles with gradient and shape
    const obsGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    obsGrad.addColorStop(0, '#ff5555');
    obsGrad.addColorStop(1, '#aa0000');
    ctx.fillStyle = obsGrad;
    for (const o of obstacles) {
      // draw a simple triangle obstacle
      ctx.beginPath();
      ctx.moveTo(o.x, o.y + o.h);
      ctx.lineTo(o.x + o.w / 2, o.y);
      ctx.lineTo(o.x + o.w, o.y + o.h);
      ctx.closePath();
      ctx.fill();
    }
    // Player
    player.draw();
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  loop();
})();
