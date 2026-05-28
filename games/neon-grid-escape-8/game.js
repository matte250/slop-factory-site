// Simple Neon Grid Escape game
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const w = (canvas.width = canvas.clientWidth || 800);
  const h = (canvas.height = canvas.clientHeight || 600);

  const player = { x: w / 2 - 10, y: h - 40, size: 20, vx: 0, vy: 0, speed: 4 };
  let scrollSpeed = 2;
  let barriers = [];
  let frames = 0;
  let gameOver = false;

  const keys = {};
  // setup audio context
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  // background hum
  const bgInterval = setInterval(() => playTone(220, 0.1), 2000);

  window.addEventListener('keydown', e => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnBarrier() {
    // Random width/height, position either horizontally or vertically aligned
    const isVertical = Math.random() < 0.5;
    const size = 30 + Math.random() * 40; // 30-70px
    if (isVertical) {
      const x = Math.random() * (w - size);
      barriers.push({ x, y: -size, w: size, h: size * 2, type: 'vertical' });
    } else {
      const y = Math.random() * (h - size);
      barriers.push({ x: -size, y, w: size * 2, h: size, type: 'horizontal' });
    }
  }

  function update() {
    if (gameOver) return;
    // Player movement
    player.vx = 0;
    player.vy = 0;
    if (keys.ArrowLeft) player.vx = -player.speed;
    if (keys.ArrowRight) player.vx = player.speed;
    if (keys.ArrowUp) player.vy = -player.speed;
    if (keys.ArrowDown) player.vy = player.speed;
    player.x += player.vx;
    player.y += player.vy;

    // Keep player within canvas
    if (player.x < 0 || player.x + player.size > w || player.y < 0 || player.y + player.size > h) {
      gameOver = true;
      playTone(440, 0.2); // wall collision
    }

    // Scroll barriers downwards to simulate upward motion
    barriers.forEach(b => (b.y += scrollSpeed));
    // Remove off‑screen barriers
    barriers = barriers.filter(b => b.y < h && b.x < w);

    // Collision detection
    for (const b of barriers) {
if (
          player.x < b.x + b.w &&
          player.x + player.size > b.x &&
          player.y < b.y + b.h &&
          player.y + player.size > b.y
        ) {
          gameOver = true;
          playTone(440, 0.2); // barrier hit
          break;
        }
    }

    // Increase difficulty
    if (frames % 300 === 0) scrollSpeed += 0.3;
    if (frames % 120 === 0) spawnBarrier();
    frames++;
  }

  function drawGrid() {
    const gap = 40;
    ctx.strokeStyle = '#0ff4';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= w; x += gap) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += gap) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }

  function render() {
    ctx.clearRect(0, 0, w, h);
    // neon background with slight glow
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, w, h);
    // draw glowing grid
    ctx.save();
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 8;
    drawGrid();
    ctx.restore();
    // player with neon glow
    const playerGrad = ctx.createLinearGradient(0, player.y, 0, player.y + player.size);
    playerGrad.addColorStop(0, '#0ff');
    playerGrad.addColorStop(1, '#00f');
    ctx.fillStyle = playerGrad;
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 12;
    ctx.fillRect(player.x, player.y, player.size, player.size);
    // barriers with rounded neon glow
    ctx.shadowColor = '#f0f';
    ctx.shadowBlur = 10;
    barriers.forEach(b => {
      const grad = ctx.createLinearGradient(b.x, b.y, b.x + b.w, b.y + b.h);
      grad.addColorStop(0, '#f0f');
      grad.addColorStop(1, '#f00');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(b.x, b.y, b.w, b.h, Math.min(b.w, b.h) * 0.2);
      ctx.fill();
    });
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#fff';
      ctx.font = '30px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', w / 2, h / 2);
    }
  }

  function loop() {
    update();
    render();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // start
  requestAnimationFrame(loop);
})();
