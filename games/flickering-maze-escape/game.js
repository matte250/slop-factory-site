// Minimal Flickering Maze Escape implementation
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 600;
  // Audio context for simple sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration = 0.1, type = 'sine') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  // generate simple starfield background
  const stars = [];
  for (let i = 0; i < 120; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      radius: Math.random() * 1.2 + 0.3,
    });
  }

  const TILE = 40; // size of maze cells
  const COLS = Math.floor(W / TILE);
  const ROWS = Math.floor(H / TILE);

  // simple maze: walls on grid edges + random interior walls
  const walls = new Set();
  for (let x = 0; x <= COLS; x++) {
    walls.add(`${x},0`);
    walls.add(`${x},${ROWS}`);
  }
  for (let y = 0; y <= ROWS; y++) {
    walls.add(`0,${y}`);
    walls.add(`${COLS},${y}`);
  }
  // random interior walls (30%)
  for (let i = 0; i < COLS * ROWS * 0.3; i++) {
    const x = 1 + Math.floor(Math.random() * (COLS - 1));
    const y = 1 + Math.floor(Math.random() * (ROWS - 1));
    walls.add(`${x},${y}`);
  }

  // player
  const player = { x: TILE / 2, y: TILE / 2, radius: TILE * 0.2 };
  // sound state flags
  let winPlayed = false;
  let losePlayed = false;

  // shards
  const shards = [];
  while (shards.length < 3) {
    const sx = Math.floor(Math.random() * COLS) * TILE + TILE / 2;
    const sy = Math.floor(Math.random() * ROWS) * TILE + TILE / 2;
    // avoid start position and walls
    if (Math.hypot(sx - player.x, sy - player.y) < TILE * 2) continue;
    if (walls.has(`${Math.floor(sx / TILE)},${Math.floor(sy / TILE)}`)) continue;
    shards.push({ x: sx, y: sy, collected: false });
  }

  // exit (bottom‑right corner)
  const exit = { x: (COLS - 1) * TILE + TILE / 2, y: (ROWS - 1) * TILE + TILE / 2, radius: TILE * 0.25 };

  // torch
  let torchRadius = TILE * 2.5;
  const torchFuel = 30; // seconds
  let fuelLeft = torchFuel;
  let flickerTimer = 0;

  // input handling
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function update(dt) {
    // timer
    fuelLeft -= dt / 1000;
    if (fuelLeft <= 0) fuelLeft = 0;

    // flicker effect every 0.5‑1s
    flickerTimer -= dt;
    if (flickerTimer <= 0) {
      flickerTimer = 500 + Math.random() * 500;
      torchRadius = TILE * (2 + Math.random() * 0.5);
    }

    const speed = 120; // px/s
    const dx = (keys['ArrowRight'] ? 1 : 0) - (keys['ArrowLeft'] ? 1 : 0);
    const dy = (keys['ArrowDown'] ? 1 : 0) - (keys['ArrowUp'] ? 1 : 0);
    if (dx || dy) {
      const len = Math.hypot(dx, dy);
      player.x += (dx / len) * speed * dt / 1000;
      player.y += (dy / len) * speed * dt / 1000;
    }

    // wall collision (simple cell check)
    const cellX = Math.floor(player.x / TILE);
    const cellY = Math.floor(player.y / TILE);
    if (walls.has(`${cellX},${cellY}`)) {
      // push back to previous safe position
      player.x -= (dx / Math.hypot(dx, dy || 1)) * speed * dt / 1000;
      player.y -= (dy / Math.hypot(dx, dy || 1)) * speed * dt / 1000;
    }

    // collect shards within torch light
    shards.forEach(s => {
      if (!s.collected && Math.hypot(s.x - player.x, s.y - player.y) < torchRadius) {
        s.collected = true;
        // play shard collection sound
        playTone(800, 0.07, 'triangle');
      }
    });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    // starfield background (dim stars)
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'white';
    stars.forEach(s => {
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    // dark base overlay (dim overall)
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, W, H);

    // torch light overlay (reveals area)
    const overlay = ctx.createRadialGradient(
      player.x,
      player.y,
      0,
      player.x,
      player.y,
      torchRadius
    );
    overlay.addColorStop(0, 'rgba(255,255,255,0.8)');
    overlay.addColorStop(0.3, 'rgba(255,255,255,0.2)');
    overlay.addColorStop(1, 'rgba(0,0,0,0.9)');
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = overlay;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';

    // draw walls inside visible area
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    walls.forEach(key => {
      const [cx, cy] = key.split(',').map(Number);
      const wx = cx * TILE;
      const wy = cy * TILE;
      // only draw if inside torch circle
      if (Math.hypot(wx + TILE / 2 - player.x, wy + TILE / 2 - player.y) < torchRadius + TILE) {
        ctx.strokeRect(wx, wy, TILE, TILE);
      }
    });

    // draw shards (if collected show glow)
    shards.forEach(s => {
      if (!s.collected) return;
      ctx.fillStyle = 'cyan';
      ctx.beginPath();
      ctx.arc(s.x, s.y, TILE * 0.1, 0, Math.PI * 2);
      ctx.fill();
    });

    // draw player with glow
    const playerGrad = ctx.createRadialGradient(
      player.x,
      player.y,
      player.radius * 0.2,
      player.x,
      player.y,
      player.radius
    );
    playerGrad.addColorStop(0, 'rgba(255,165,0,0.9)');
    playerGrad.addColorStop(1, 'rgba(255,69,0,0.2)');
    ctx.fillStyle = playerGrad;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();

    // draw exit (visible only in torch)
    if (Math.hypot(exit.x - player.x, exit.y - player.y) < torchRadius) {
      ctx.fillStyle = 'gold';
      ctx.beginPath();
      ctx.arc(exit.x, exit.y, exit.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // UI: fuel & shards left
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Fuel: ${fuelLeft.toFixed(1)}s`, 10, 20);
    ctx.fillText(`Shards: ${shards.filter(s => s.collected).length}/3`, 10, 40);

    // win/lose messages
    if (fuelLeft <= 0) {
      if (!losePlayed) {
        playTone(200, 0.3, 'sawtooth');
        losePlayed = true;
      }
      ctx.fillStyle = 'red';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', W / 2 - 120, H / 2);
    } else if (shards.every(s => s.collected) && Math.hypot(exit.x - player.x, exit.y - player.y) < exit.radius) {
      if (!winPlayed) {
        playTone(600, 0.3, 'sine');
        winPlayed = true;
      }
      ctx.fillStyle = 'lime';
      ctx.font = '48px sans-serif';
      ctx.fillText('You Win!', W / 2 - 120, H / 2);
    }
  }

  let last = performance.now();
  function loop(now) {
    const dt = now - last;
    last = now;
    if (fuelLeft > 0 && !(shards.every(s => s.collected) && Math.hypot(exit.x - player.x, exit.y - player.y) < exit.radius)) {
      update(dt);
    }
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
