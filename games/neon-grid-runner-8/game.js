// Minimal Neon Grid Runner implementation with enhanced neon graphics
(() => {
  // Sound setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start(audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }
  function playCollectSound() { playTone(800, 0.07); }
  function playGameOverSound() { playTone(150, 0.5); }
  // Rest of the game code...
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const W = (canvas.width = canvas.clientWidth || 800);
  const H = (canvas.height = canvas.clientHeight || 600);

  // Game state
  let ship = { x: W / 2, y: H * 0.8, w: 20, h: 30, speed: 0 };
  let orbs = [];
  let spikes = [];
  let score = 0;
  let gameOver = false;
  let gridOffset = 0;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    // Resume audio context on first interaction (required by some browsers)
    if (audioCtx.state !== 'running') audioCtx.resume();
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnOrb() {
    const x = Math.random() * (W - 20) + 10;
    orbs.push({ x, y: -20, r: 8 });
  }
  function spawnSpike() {
    const x = Math.random() * (W - 30) + 15;
    spikes.push({ x, y: -30, w: 30, h: 30 });
  }

  function update(dt) {
    if (gameOver) return;
    // Ship control
    if (keys.ArrowLeft) ship.x -= 300 * dt;
    if (keys.ArrowRight) ship.x += 300 * dt;
    if (keys.ArrowUp) ship.speed += 200 * dt;
    if (keys.ArrowDown) ship.speed -= 200 * dt;
    ship.speed = Math.max(0, Math.min(ship.speed, 500));
    ship.y -= ship.speed * dt;
    ship.x = Math.max(0, Math.min(W, ship.x));

    // Move grid
    gridOffset += ship.speed * dt * 0.5;

    // Spawn elements
    if (Math.random() < 0.02) spawnOrb();
    if (Math.random() < 0.015) spawnSpike();

    // Update orbs
    for (let i = orbs.length - 1; i >= 0; i--) {
      const o = orbs[i];
      o.y += ship.speed * dt * 0.5;
      // collision with ship
      const dx = o.x - ship.x, dy = o.y - ship.y;
      if (Math.hypot(dx, dy) < o.r + 10) {
        score++;
        playCollectSound();
        orbs.splice(i, 1);
        continue;
      }
      if (o.y > H) orbs.splice(i, 1);
    }

    // Update spikes
    for (let i = spikes.length - 1; i >= 0; i--) {
      const s = spikes[i];
      s.y += ship.speed * dt * 0.5;
      if (
        ship.x > s.x - ship.w &&
        ship.x < s.x + ship.w &&
        ship.y > s.y - ship.h &&
        ship.y < s.y + s.h
      ) {
playGameOverSound(); gameOver = true;
      }
      if (s.y > H) spikes.splice(i, 1);
    }

    // Lose condition: ship stalls too long (speed zero for >2s)
    if (ship.speed === 0) {
      ship.stallTime = (ship.stallTime || 0) + dt;
      if (ship.stallTime > 2) gameOver = true;
    } else {
      ship.stallTime = 0;
    }
  }

  function drawBackground() {
    // Gradient background for a cyber‑neon feel
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#001030');
    grad.addColorStop(1, '#000010');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  function drawGrid() {
    const size = 40;
    ctx.strokeStyle = '#0ff4';
    ctx.lineWidth = 1;
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 6;
    for (let x = 0; x <= W; x += size) {
      ctx.beginPath();
      ctx.moveTo(x, -gridOffset % size);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = -gridOffset % size; y <= H; y += size) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    // Reset shadow for other elements
    ctx.shadowBlur = 0;
  }

  function drawShip() {
    ctx.save();
    ctx.fillStyle = '#0ff';
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.h / 2);
    ctx.lineTo(ship.x - ship.w / 2, ship.y + ship.h / 2);
    ctx.lineTo(ship.x + ship.w / 2, ship.y + ship.h / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawOrbs() {
    ctx.save();
    ctx.fillStyle = '#ff0';
    ctx.shadowColor = '#ff0';
    ctx.shadowBlur = 8;
    orbs.forEach(o => {
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  function drawSpikes() {
    ctx.save();
    ctx.fillStyle = '#f44';
    ctx.shadowColor = '#f44';
    ctx.shadowBlur = 6;
    spikes.forEach(s => {
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - s.w / 2, s.y + s.h);
      ctx.lineTo(s.x + s.w / 2, s.y + s.h);
      ctx.closePath();
      ctx.fill();
    });
    ctx.restore();
  }

  function drawScore() {
    ctx.fillStyle = '#fff';
    ctx.font = '20px monospace';
    ctx.fillText('Score: ' + score, 10, 30);
  }

  function drawGameOver() {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#f44';
    ctx.font = '40px monospace';
    ctx.fillText('Game Over', W / 2 - 100, H / 2);
  }

  function draw() {
    drawBackground();
    drawGrid();
    drawShip();
    drawOrbs();
    drawSpikes();
    drawScore();
    if (gameOver) drawGameOver();
  }

  let last = performance.now();
  function loop(ts) {
    const dt = (ts - last) / 1000;
    last = ts;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
