// Neon Grid Runner – simple endless runner
// Targets <canvas id="game"></canvas>

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = window.innerWidth;
  const height = canvas.height = window.innerHeight;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // Game constants
  const PLAYER_SIZE = 30;
  const PLAYER_SPEED = 5;
  const BLOCK_SIZE = 40;
  const LASER_WIDTH = 10;
  const LASER_SPEED = 3;
  const SPAWN_INTERVAL = 1500; // ms
  const TIMER_START = 60; // seconds

  // State
  let player = { x: width / 2 - PLAYER_SIZE / 2, y: height - PLAYER_SIZE * 2, size: PLAYER_SIZE };
  let blocks = [];
  let lasers = [];
  let lastSpawn = 0;
  let elapsed = 0;
  let remaining = TIMER_START;
  let score = 0;
  let gameOver = false;

  // Input handling
  const keys = { left: false, right: false };
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') keys.left = true;
    if (e.key === 'ArrowRight') keys.right = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') keys.left = false;
    if (e.key === 'ArrowRight') keys.right = false;
  });

  function spawnObstacles() {
    // Static block – random column
    const colCount = Math.floor(width / BLOCK_SIZE);
    const col = Math.floor(Math.random() * colCount);
    blocks.push({ x: col * BLOCK_SIZE, y: -BLOCK_SIZE, size: BLOCK_SIZE });
    playTone(300, 0.08); // block spawn sound
    // Laser bar – vertical moving bar across the top
    const laserX = Math.random() * (width - LASER_WIDTH);
    lasers.push({ x: laserX, y: -height, width: LASER_WIDTH, height: height, speed: LASER_SPEED });
    playTone(600, 0.08); // laser spawn sound
  }

  function update(dt) {
    if (gameOver) return;
    elapsed += dt;
    if (elapsed - lastSpawn > SPAWN_INTERVAL) {
      spawnObstacles();
      lastSpawn = elapsed;
    }
    // Timer
    remaining = Math.max(0, TIMER_START - Math.floor(elapsed / 1000));
    if (remaining === 0) { playTone(200, 0.3); gameOver = true; }

    // Player movement
    if (keys.left) player.x = Math.max(0, player.x - PLAYER_SPEED);
    if (keys.right) player.x = Math.min(width - PLAYER_SIZE, player.x + PLAYER_SPEED);

    // Update blocks
    blocks.forEach(b => b.y += PLAYER_SPEED);
    blocks = blocks.filter(b => b.y < height);

    // Update lasers
    lasers.forEach(l => l.y += l.speed);
    lasers = lasers.filter(l => l.y < height);

    // Collision detection
    const collide = (obj) => {
      return (
        player.x < obj.x + obj.size &&
        player.x + player.size > obj.x &&
        player.y < obj.y + obj.size &&
        player.y + player.size > obj.y
      );
    };
    const collideLaser = (laser) => {
      return (
        player.x < laser.x + laser.width &&
        player.x + player.size > laser.x &&
        player.y < laser.y + laser.height &&
        player.y + player.size > laser.y
      );
    };
    if (blocks.some(collide) || lasers.some(collideLaser)) { playTone(100, 0.2); gameOver = true; }

    // Score is distance survived (time elapsed)
    score = Math.floor(elapsed / 100);
  }

  function drawGrid() {
    const gridSize = 40;
    ctx.strokeStyle = '#0ff';
    ctx.lineWidth = 1;
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 6;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.shadowBlur = 0; // reset
  }

  function drawBackground() {
    // Gradient neon background
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#02010a');
    grad.addColorStop(1, '#0a0a2a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }

function drawNeonShape(x, y, w, h, color) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
    ctx.shadowBlur = 0; // reset
  }

function render() {
    ctx.clearRect(0, 0, width, height);
    drawBackground();
    // Neon grid with glow
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 8;
    drawGrid();
    ctx.shadowBlur = 0;
    // Player with neon glow
    drawNeonShape(player.x, player.y, player.size, player.size, '#0ff');
    // Blocks
    blocks.forEach(b => drawNeonShape(b.x, b.y, b.size, b.size, '#f00'));
    // Lasers - neon yellow with longer blur
    ctx.shadowColor = '#ff0';
    ctx.shadowBlur = 15;
    lasers.forEach(l => drawNeonShape(l.x, l.y, l.width, l.height, '#ff0'))
    ctx.shadowBlur = 0;
    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '20px monospace';
    ctx.fillText(`Time: ${remaining}s`, 10, 30);
    ctx.fillText(`Score: ${score}`, 10, 60);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  let lastTime = performance.now();
  function loop(now) {
    const dt = now - lastTime;
    lastTime = now;
    update(dt);
    render();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
