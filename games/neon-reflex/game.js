// Neon Reflex – minimal endless runner with enhanced graphics
// Canvas with id="game" must exist in the page.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Set a fixed size; can be adjusted via CSS if needed
  canvas.width = canvas.offsetWidth || 400;
  canvas.height = canvas.offsetHeight || 600;

  // Audio context (created lazily on first user interaction)
  let audioCtx = null;
  const createAudio = () => {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
  };
  const playTone = (freq, duration = 0.1) => {
    const ctx = createAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.stop(ctx.currentTime + duration);
  };

  const PLAYER_SIZE = 30;
  const PLAYER_COLOR = '#0ff'; // neon cyan
  const OBSTACLE_COLOR = '#f0f'; // neon magenta
  const BACKGROUND_COLOR = '#111'; // near black
  const GRID_COLOR = '#222'; // dark grid lines
  const GRAVITY = 0.8;
  const JUMP_VELOCITY = -15;
  const OBSTACLE_WIDTH = 40;
  const OBSTACLE_GAP = 150; // vertical distance between obstacles
  const SPAWN_INTERVAL = 1200; // ms

  let lastTime = 0;
let gridOffset = 0; // for scrolling background grid
  let spawnTimer = 0;
  let score = 0;

  const player = {
    x: 80,
    y: canvas.height - PLAYER_SIZE,
    vy: 0,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    onGround: true,
jump() {
        if (this.onGround) {
          // Play jump sound (high pitch)
          playTone(660);
          this.vy = JUMP_VELOCITY;
          this.onGround = false;
        }
      },
    update() {
      this.vy += GRAVITY;
      this.y += this.vy;
      // ground check
      if (this.y + this.height >= canvas.height) {
        this.y = canvas.height - this.height;
        this.vy = 0;
        this.onGround = true;
      }
    },
    draw() {
      // Neon glow effect
      ctx.shadowColor = PLAYER_COLOR;
      ctx.shadowBlur = 12;
      // Draw rounded square
      ctx.fillStyle = PLAYER_COLOR;
      const r = 6; // corner radius
      ctx.beginPath();
      ctx.moveTo(this.x + r, this.y);
      ctx.lineTo(this.x + this.width - r, this.y);
      ctx.quadraticCurveTo(this.x + this.width, this.y, this.x + this.width, this.y + r);
      ctx.lineTo(this.x + this.width, this.y + this.height - r);
      ctx.quadraticCurveTo(this.x + this.width, this.y + this.height, this.x + this.width - r, this.y + this.height);
      ctx.lineTo(this.x + r, this.y + this.height);
      ctx.quadraticCurveTo(this.x, this.y + this.height, this.x, this.y + this.height - r);
      ctx.lineTo(this.x, this.y + r);
      ctx.quadraticCurveTo(this.x, this.y, this.x + r, this.y);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  };

  const obstacles = [];

  function spawnObstacle() {
    const height = Math.random() * (canvas.height / 2) + 30;
    obstacles.push({
      x: canvas.width,
      y: canvas.height - height,
      width: OBSTACLE_WIDTH,
      height,
      speed: 3
    });
  }

  function updateObstacles(delta) {
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= o.speed;
      if (o.x + o.width < 0) {
        obstacles.splice(i, 1);
        score++;
      }
    }
  }

  function drawObstacles() {
    // Neon magenta obstacles with glow
    ctx.fillStyle = OBSTACLE_COLOR;
    ctx.shadowColor = OBSTACLE_COLOR;
    ctx.shadowBlur = 8;
    for (const o of obstacles) {
      ctx.fillRect(o.x, o.y, o.width, o.height);
    }
    // Reset shadow for other drawings
    ctx.shadowBlur = 0;
  }

  function checkCollision() {
    for (const o of obstacles) {
      if (
        player.x < o.x + o.width &&
        player.x + player.width > o.x &&
        player.y < o.y + o.height &&
        player.y + player.height > o.y
      ) {
        // game over – stop animation loop
cancelAnimationFrame(animationId);
          // Play collision sound (low pitch)
          playTone(220);
          ctx.fillStyle = '#f00';
          ctx.font = '30px monospace';
          ctx.fillText('Game Over', canvas.width / 2 - 80, canvas.height / 2);
          ctx.fillText(`Score: ${score}`, canvas.width / 2 - 80, canvas.height / 2 + 40);
          return true;
      }
    }
    return false;
  }

  function drawScore() {
    ctx.fillStyle = PLAYER_COLOR;
    ctx.font = '20px monospace';
    ctx.fillText(`Score: ${score}`, 10, 30);
  }

  function clear() {
    // Fill background with near‑black
    ctx.fillStyle = BACKGROUND_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw scrolling grid lines
    ctx.strokeStyle = GRID_COLOR;
    ctx.lineWidth = 1;
    const gridSize = 40;
    const offset = gridOffset % gridSize;
    ctx.beginPath();
    for (let x = -gridSize + offset; x < canvas.width; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
    }
    for (let y = -gridSize + offset; y < canvas.height; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
    }
    ctx.stroke();
  }

  function loop(timestamp) {
    const delta = timestamp - lastTime;
    lastTime = timestamp;
    spawnTimer += delta;
    if (spawnTimer > SPAWN_INTERVAL) {
      spawnObstacle();
      spawnTimer = 0;
    }

    // scroll background grid
    gridOffset += 2;

    clear();
    player.update();
    updateObstacles(delta);
    player.draw();
    drawObstacles();
    drawScore();
    if (!checkCollision()) {
      animationId = requestAnimationFrame(loop);
    }
  }

  let animationId = requestAnimationFrame(loop);

  // Input – click / tap anywhere
  canvas.addEventListener('pointerdown', () => player.jump());
})();
