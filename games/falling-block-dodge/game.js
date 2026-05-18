// Falling Block Dodge game
// Canvas should have id="game"

(() => {
  const canvas = document.getElementById('game');
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(freq) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    osc.start(now);
    osc.stop(now + 0.1);
  }
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width = canvas.width || 400;
  const HEIGHT = canvas.height = canvas.height || 600;

  // Player
  const PLAYER_WIDTH = 50;
  const PLAYER_HEIGHT = 20;
  const PLAYER_SPEED = 5;
  const player = {
    x: WIDTH / 2 - PLAYER_WIDTH / 2,
    y: HEIGHT - PLAYER_HEIGHT - 10,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    dx: 0,
    draw() {
        // Player gradient fill
        const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
        grad.addColorStop(0, '#6dd5fa');
        grad.addColorStop(1, '#2980b9');
        ctx.fillStyle = grad;
        // Rounded rectangle
        const radius = 5;
        ctx.beginPath();
        ctx.moveTo(this.x + radius, this.y);
        ctx.lineTo(this.x + this.width - radius, this.y);
        ctx.quadraticCurveTo(this.x + this.width, this.y, this.x + this.width, this.y + radius);
        ctx.lineTo(this.x + this.width, this.y + this.height - radius);
        ctx.quadraticCurveTo(this.x + this.width, this.y + this.height, this.x + this.width - radius, this.y + this.height);
        ctx.lineTo(this.x + radius, this.y + this.height);
        ctx.quadraticCurveTo(this.x, this.y + this.height, this.x, this.y + this.height - radius);
        ctx.lineTo(this.x, this.y + radius);
        ctx.quadraticCurveTo(this.x, this.y, this.x + radius, this.y);
        ctx.closePath();
        ctx.fill();
      }
  };

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // Falling blocks
  const blocks = [];
  const BLOCK_WIDTH = 40;
  const BLOCK_HEIGHT = 40;
  let blockSpawnTimer = 0;
  const SPAWN_INTERVAL = 90; // frames
  let speedIncreaseTimer = 0;
  let blockSpeed = 2;

  // Score
  let score = 0;

  function spawnBlock() {
    const x = Math.random() * (WIDTH - BLOCK_WIDTH);
    blocks.push({ x, y: -BLOCK_HEIGHT, width: BLOCK_WIDTH, height: BLOCK_HEIGHT });
  }

  function update() {
    // Move player
    if (keys['ArrowLeft']) player.x -= PLAYER_SPEED;
    if (keys['ArrowRight']) player.x += PLAYER_SPEED;
    // Keep inside bounds
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > WIDTH) player.x = WIDTH - player.width;

    // Spawn blocks
    if (blockSpawnTimer <= 0) {
      spawnBlock();
      blockSpawnTimer = SPAWN_INTERVAL;
    } else {
      blockSpawnTimer--;
    }

    // Increase difficulty over time
    if (speedIncreaseTimer <= 0) {
      blockSpeed += 0.2; // accelerate
      speedIncreaseTimer = 600; // ~10 seconds at 60fps
    } else {
      speedIncreaseTimer--;
    }

    // Update blocks
    for (let i = blocks.length - 1; i >= 0; i--) {
      const b = blocks[i];
      b.y += blockSpeed;
      // Remove off‑screen blocks and increment score
      if (b.y > HEIGHT) {
        blocks.splice(i, 1);
        score++;
        playSound(600);
      } else if (isColliding(b, player)) {
        // Game over
        playSound(200);
        cancelAnimationFrame(frameId);
        alert('Game Over! Your score: ' + score);
        return;
      }
    }
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    bgGrad.addColorStop(0, '#f0f8ff');
    bgGrad.addColorStop(1, '#cce6ff');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    // Draw player with rounded corners
    player.draw();
    // Draw blocks with radial gradient
    for (const b of blocks) {
      const grad = ctx.createRadialGradient(
        b.x + b.width / 2,
        b.y + b.height / 2,
        b.width / 4,
        b.x + b.width / 2,
        b.y + b.height / 2,
        b.width / 2
      );
      grad.addColorStop(0, '#ff8c8c');
      grad.addColorStop(1, '#e74c3c');
      ctx.fillStyle = grad;
      ctx.fillRect(b.x, b.y, b.width, b.height);
    }
    // Draw score with subtle shadow
    ctx.fillStyle = '#2c3e50';
    ctx.font = '16px sans-serif';
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.shadowBlur = 2;
    ctx.fillText('Score: ' + score, 10, 20);
    ctx.shadowColor = 'transparent';
  }

  function loop() {
    update();
    draw();
    frameId = requestAnimationFrame(loop);
  }

  function isColliding(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
  }

  let frameId = requestAnimationFrame(loop);
})();
