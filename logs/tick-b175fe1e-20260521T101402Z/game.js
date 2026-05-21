// Minimal "Escape the Grid" game
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');

  // Resize for high‑DPI displays
  const dpr = window.devicePixelRatio || 1;
  canvas.width = canvas.clientWidth * dpr;
  canvas.height = canvas.clientHeight * dpr;
  ctx.scale(dpr, dpr);

  const PLAYER_RADIUS = 5;
  const PLAYER_SPEED = 2;
  const WALL_SPEED = 0.5; // scroll speed
  const WALL_INTERVAL = 1500; // ms between new wall rows
  const GAME_TIME = 60; // seconds

  let player = { x: canvas.width / 2, y: canvas.height - 30 };
  let walls = [];
  let exit = null;
  let lastWallTime = 0;
  let startTime = null;
  let dead = false;
  let won = false;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; if (audioCtx.state === 'suspended') audioCtx.resume(); });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playSound(type) {
    switch(type) {
      case 'lose':
        playTone(150, 0.4);
        break;
      case 'win':
        playTone(600, 0.5);
        break;
      case 'hit':
        playTone(300, 0.1);
        break;
    }
  }

  function spawnWallRow() {
    const cols = 8;
    const cellW = canvas.width / cols;
    // Randomly decide which cells are solid walls (avoid leaving a path)
    const openIdx = Math.floor(Math.random() * cols);
    for (let i = 0; i < cols; i++) {
      if (i === openIdx) continue; // leave a gap
      walls.push({
        x: i * cellW,
        y: -20,
        w: cellW - 2,
        h: 20,
      });
    }
    // Occasionally place the exit at the top when enough time passed
    if (!exit && Math.random() < 0.1) {
      exit = {
        x: openIdx * cellW + cellW / 4,
        y: -30,
        w: cellW / 2,
        h: 20,
        color: 'lime',
      };
    }
  }

  function update(dt) {
    if (dead || won) return;
    // Player movement
    if (keys.ArrowUp) player.y -= PLAYER_SPEED;
    if (keys.ArrowDown) player.y += PLAYER_SPEED;
    if (keys.ArrowLeft) player.x -= PLAYER_SPEED;
    if (keys.ArrowRight) player.x += PLAYER_SPEED;
    // Keep inside bounds
    player.x = Math.max(PLAYER_RADIUS, Math.min(canvas.width - PLAYER_RADIUS, player.x));
    player.y = Math.max(PLAYER_RADIUS, Math.min(canvas.height - PLAYER_RADIUS, player.y));

    // Move walls down
    walls.forEach(w => w.y += WALL_SPEED);
    if (exit) exit.y += WALL_SPEED;

    // Remove off‑screen walls
    walls = walls.filter(w => w.y < canvas.height);
    if (exit && exit.y > canvas.height) exit = null;

    // Spawn new wall rows periodically
    if (performance.now() - lastWallTime > WALL_INTERVAL) {
      spawnWallRow();
      lastWallTime = performance.now();
    }

    // Collision detection
    for (const w of walls) {
      if (
        player.x + PLAYER_RADIUS > w.x &&
        player.x - PLAYER_RADIUS < w.x + w.w &&
        player.y + PLAYER_RADIUS > w.y &&
        player.y - PLAYER_RADIUS < w.y + w.h
      ) {
          playSound('hit');
          playSound('lose');
          dead = true;
        }
      }
    }

    // Exit check
    if (exit &&
        player.x > exit.x &&
        player.x < exit.x + exit.w &&
        player.y > exit.y &&
        player.y < exit.y + exit.h) {
      won = true;
      playSound('win');
    }

    // Time out
    const elapsed = (performance.now() - startTime) / 1000;
    if (elapsed > GAME_TIME) dead = true;
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

// Draw background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#0a0a0a');
  bgGrad.addColorStop(1, '#000020');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Helper to draw rounded rectangles
  function drawRoundedRect(x, y, w, h, r, color) {
    ctx.fillStyle = color;
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

  // Draw walls with rounded corners
  walls.forEach(w => {
    drawRoundedRect(w.x, w.y, w.w, w.h, 3, '#555');
  });

    // Draw exit
    if (exit) {
      ctx.fillStyle = exit.color;
      ctx.fillRect(exit.x, exit.y, exit.w, exit.h);
    }

    // Draw player with glow
    const glowGrad = ctx.createRadialGradient(
      player.x, player.y, PLAYER_RADIUS,
      player.x, player.y, PLAYER_RADIUS * 4
    );
    glowGrad.addColorStop(0, 'rgba(0,255,255,0.9)');
    glowGrad.addColorStop(1, 'rgba(0,255,255,0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(player.x, player.y, PLAYER_RADIUS * 4, 0, Math.PI * 2);
    ctx.fill();
    // inner core
    ctx.fillStyle = '#0ff';
    ctx.beginPath();
    ctx.arc(player.x, player.y, PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    // UI
    ctx.fillStyle = 'white';
    ctx.font = '12px sans-serif';
    const remaining = Math.max(0, Math.ceil(GAME_TIME - (performance.now() - startTime) / 1000));
    ctx.fillText(`Time: ${remaining}s`, 10, 15);
    if (dead) {
      ctx.fillStyle = 'red';
      ctx.fillText('Game Over', canvas.width / 2 - 30, canvas.height / 2);
    }
    if (won) {
      ctx.fillStyle = 'lime';
      ctx.fillText('You Escaped!', canvas.width / 2 - 40, canvas.height / 2);
    }
  }

  function loop(timestamp) {
    if (!startTime) startTime = timestamp;
    const dt = timestamp - (lastTimestamp || timestamp);
    lastTimestamp = timestamp;
    update(dt);
    draw();
    if (!dead && !won) requestAnimationFrame(loop);
  }
  let lastTimestamp = null;
  requestAnimationFrame(loop);
})();
