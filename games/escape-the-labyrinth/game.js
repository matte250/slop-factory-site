// Simple canvas game based on IDEA.md
// Canvas element with id="game" is expected in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = 400;
  const height = canvas.height = 400;

  // --- Game Constants ---
  const PLAYER_RADIUS = 10;
  const PLAYER_SPEED = 2;
  const WALL_THICKNESS = 20;
  const NUM_WALLS = 8; // simple random walls
  const TIMER_START = 60; // seconds

  // --- Game State ---
  const player = { x: PLAYER_RADIUS + 5, y: PLAYER_RADIUS + 5, radius: PLAYER_RADIUS };
  const walls = [];
  let keys = {};
  let elapsed = 0;
  let startTime = null;
  let gameOver = false;
  let win = false;

  // Helper: generate random walls (axis-aligned rectangles)
  function generateWalls() {
    for (let i = 0; i < NUM_WALLS; i++) {
      const w = Math.random() * 80 + 40;
      const h = Math.random() * 80 + 40;
      const x = Math.random() * (width - w - WALL_THICKNESS) + WALL_THICKNESS;
      const y = Math.random() * (height - h - WALL_THICKNESS) + WALL_THICKNESS;
      walls.push({ x, y, w, h });
    }
    // Add border walls
    walls.push({ x: 0, y: 0, w: width, h: WALL_THICKNESS }); // top
    walls.push({ x: 0, y: height - WALL_THICKNESS, w: width, h: WALL_THICKNESS }); // bottom
    walls.push({ x: 0, y: 0, w: WALL_THICKNESS, h: height }); // left
    walls.push({ x: width - WALL_THICKNESS, y: 0, w: WALL_THICKNESS, h: height }); // right
    // Generate keys and enemies after walls are set
    generateKeys();
    generateEnemies();
  }

  // --- Visual extras ---
  const KEY_COUNT = 3;
  const ENEMY_COUNT = 2;
  const keysPos = [];
  const enemies = [];

  function randomFreePos(radius) {
    let x, y, safe;
    do {
      safe = true;
      x = Math.random() * (width - 2 * radius) + radius;
      y = Math.random() * (height - 2 * radius) + radius;
      // avoid walls
      for (const wall of walls) {
        if (x + radius > wall.x && x - radius < wall.x + wall.w &&
            y + radius > wall.y && y - radius < wall.y + wall.h) {
          safe = false; break;
        }
      }
    } while (!safe);
    return { x, y };
  }

  function generateKeys() {
    for (let i = 0; i < KEY_COUNT; i++) {
      keysPos.push(randomFreePos(5));
    }
  }

  function generateEnemies() {
    for (let i = 0; i < ENEMY_COUNT; i++) {
      const pos = randomFreePos(8);
      enemies.push({ x: pos.x, y: pos.y, radius: 8, dir: Math.random() < 0.5 ? 1 : -1 });
    }
  }

  // Simple rectangle-circle collision detection
  function collidesWall(px, py) {
    for (const wall of walls) {
      const nearestX = Math.max(wall.x, Math.min(px, wall.x + wall.w));
      const nearestY = Math.max(wall.y, Math.min(py, wall.y + wall.h));
      const dx = px - nearestX;
      const dy = py - nearestY;
      if (dx * dx + dy * dy < player.radius * player.radius) {
        return true;
      }
    }
    return false;
  }

  // --- Audio setup ---
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio context is resumed on first user interaction (required by browsers)
  const resumeAudio = () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
  };
  window.addEventListener('click', resumeAudio, { once: true });
  window.addEventListener('keydown', resumeAudio, { once: true });

  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playCollect() { playTone(800, 0.2); }
  function playGameOver() { playTone(200, 0.5); }
  function playWin() { playTone(600, 0.2); playTone(800, 0.2); playTone(1000, 0.3); }

  // Flags to avoid replaying sounds each frame
  let winSoundPlayed = false;
  let loseSoundPlayed = false;


  // --- Input handling ---
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // Game state helpers
  let keysCollected = 0;
  const KEY_RADIUS = 5;
  const ENEMY_SPEED = 1.2;

  function update(dt) {
    if (gameOver) return;
    // Move player
    let nx = player.x;
    let ny = player.y;
    if (keys['ArrowUp'] || keys['w']) ny -= PLAYER_SPEED;
    if (keys['ArrowDown'] || keys['s']) ny += PLAYER_SPEED;
    if (keys['ArrowLeft'] || keys['a']) nx -= PLAYER_SPEED;
    if (keys['ArrowRight'] || keys['d']) nx += PLAYER_SPEED;
    // Check collision with walls for player
    if (!collidesWall(nx, ny)) {
      player.x = nx;
      player.y = ny;
    }
    // Collect keys
    for (let i = keysPos.length - 1; i >= 0; i--) {
      const k = keysPos[i];
      const dx = player.x - k.x;
      const dy = player.y - k.y;
      if (dx * dx + dy * dy < (player.radius + KEY_RADIUS) ** 2) {
        keysPos.splice(i, 1);
        keysCollected++;
        // reward: add 5 seconds
        elapsed = Math.max(0, elapsed - 5);
      }
    }
    // Move enemies
    enemies.forEach(e => {
      e.x += ENEMY_SPEED * e.dir;
      // bounce on walls or canvas edges
      if (collidesWall(e.x, e.y) || e.x < e.radius || e.x > width - e.radius) {
        e.dir *= -1;
      }
    });
    // Check collision with enemies
    for (const e of enemies) {
      const dx = player.x - e.x;
      const dy = player.y - e.y;
      if (dx * dx + dy * dy < (player.radius + e.radius) ** 2) {
        gameOver = true; // player caught
        win = false;
        break;
      }
    }
    // Timer
    elapsed += dt;
    if (elapsed >= TIMER_START) {
      gameOver = true; // time out
    }
    // Win condition: all keys collected and player in exit area
    const exitSize = 30;
    const exitX = width - exitSize - WALL_THICKNESS;
    const exitY = height - exitSize - WALL_THICKNESS;
    if (keysCollected === KEY_COUNT &&
        player.x > exitX && player.x < exitX + exitSize &&
        player.y > exitY && player.y < exitY + exitSize) {
      win = true;
      gameOver = true;
    }
  }

  function draw() {
    // Clear and draw background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#222');
    bgGrad.addColorStop(1, '#555');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // Draw walls with subtle gradient
    const wallGrad = ctx.createLinearGradient(0, 0, width, 0);
    wallGrad.addColorStop(0, '#666');
    wallGrad.addColorStop(1, '#999');
    ctx.fillStyle = wallGrad;
    for (const wall of walls) {
      ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    }
    // Draw player with radial gradient for depth
    const playerGrad = ctx.createRadialGradient(
      player.x, player.y, player.radius * 0.2,
      player.x, player.y, player.radius
    );
    playerGrad.addColorStop(0, '#aaffaa');
    playerGrad.addColorStop(1, '#00aa00');
    ctx.fillStyle = playerGrad;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    // Draw exit area (bottom‑right corner) with gradient border
    const exitSize = 30;
    const exitX = width - exitSize - WALL_THICKNESS;
    const exitY = height - exitSize - WALL_THICKNESS;
    const exitGrad = ctx.createLinearGradient(exitX, exitY, exitX + exitSize, exitY + exitSize);
    exitGrad.addColorStop(0, '#ffdd55');
    exitGrad.addColorStop(1, '#ff8800');
    ctx.fillStyle = exitGrad;
    ctx.fillRect(exitX, exitY, exitSize, exitSize);
    ctx.strokeStyle = '#aa6600';
    ctx.lineWidth = 2;
    ctx.strokeRect(exitX, exitY, exitSize, exitSize);

    // Draw keys
    ctx.fillStyle = '#ffea00';
    for (const k of keysPos) {
      ctx.beginPath();
      ctx.arc(k.x, k.y, KEY_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    }
    // Draw enemies with radial gradient
    for (const e of enemies) {
      const enemyGrad = ctx.createRadialGradient(
        e.x, e.y, e.radius * 0.2,
        e.x, e.y, e.radius
      );
      enemyGrad.addColorStop(0, '#ff7777');
      enemyGrad.addColorStop(1, '#aa0000');
      ctx.fillStyle = enemyGrad;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // UI: timer
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    const remaining = Math.max(0, Math.ceil(TIMER_START - elapsed));
    ctx.fillText(`Time: ${remaining}s`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = win ? 'green' : 'red';
      ctx.font = '30px sans-serif';
      const msg = win ? 'You escaped!' : 'Game Over';
      const textMetrics = ctx.measureText(msg);
      ctx.fillText(msg, (width - textMetrics.width) / 2, height / 2);
    }
  }

  function loop(timestamp) {
    if (!startTime) startTime = timestamp;
    const dt = (timestamp - startTime) / 1000; // seconds
    startTime = timestamp;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  generateWalls();
  requestAnimationFrame(loop);
})();
