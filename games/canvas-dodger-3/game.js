// Canvas Dodger – enhanced graphics version
// Targets an existing <canvas id="game"></canvas>.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) { console.error('Canvas #game not found'); return; }
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.clientWidth || 400;
  const h = canvas.height = canvas.clientHeight || 600;

  // Helper: draw rounded rectangle
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, length) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + length / 1000);
  }
  function roundRect(x, y, width, height, radius, fill) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (fill) ctx.fillStyle = fill, ctx.fill();
  }

  // Background gradient 
  const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
  bgGrad.addColorStop(0, '#001d3d');
  bgGrad.addColorStop(1, '#003566');

  // Player (rounded square)
  const player = {
    size: 30,
    x: w / 2 - 15,
    y: h - 50,
    speed: 5,
    dx: 0,
    draw() { roundRect(this.x, this.y, this.size, this.size, 6, '#0a84ff'); }
  };

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; if (audioCtx.state !== 'running') audioCtx.resume(); });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // Obstacles – rounded, with slight rotation for flair
  const obstacles = [];
  let spawnTimer = 0;
  let spawnInterval = 1100; // faster start
  let lastTime = 0;
  let speedFactor = 1;
  let gameOver = false;

  function spawnObstacle() { playTone(500, 80);
    const size = 20 + Math.random() * 25;
    const x = Math.random() * (w - size);
    const angle = (Math.random() - 0.5) * 0.2; // small tilt
    obstacles.push({ x, y: -size, size, speed: 2 * speedFactor, angle });
  }

  function update(delta) {
    // player movement
    if (keys['ArrowLeft']) player.dx = -player.speed;
    else if (keys['ArrowRight']) player.dx = player.speed;
    else player.dx = 0;
    player.x = Math.max(0, Math.min(w - player.size, player.x + player.dx));

    // move obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += o.speed;
      if (o.y > h) obstacles.splice(i, 1);
    }

    // collision detection (axis‑aligned for simplicity)
    for (const o of obstacles) {
      if (player.x < o.x + o.size &&
          player.x + player.size > o.x &&
          player.y < o.y + o.size &&
          player.y + player.size > o.y) {
        gameOver = true; playTone(200, 300);
        break;
      }
    }

    // difficulty ramp
    spawnTimer += delta;
    if (spawnTimer > spawnInterval) {
      spawnObstacle();
      spawnTimer = 0;
      speedFactor = Math.min(3.5, speedFactor + 0.025);
      spawnInterval = Math.max(350, spawnInterval - 6);
    }
  }

  function drawBackground() {
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);
    // optional subtle stars
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    for (let i = 0; i < 30; i++) {
      const sx = Math.random() * w;
      const sy = Math.random() * h;
      ctx.fillRect(sx, sy, 1, 1);
    }
  }

  function draw() {
    drawBackground();
    // player
    player.draw();
    // obstacles with tilt
    ctx.fillStyle = '#ff3b30';
    for (const o of obstacles) {
      ctx.save();
      ctx.translate(o.x + o.size / 2, o.y + o.size / 2);
      ctx.rotate(o.angle);
      ctx.translate(-o.size / 2, -o.size / 2);
      roundRect(0, 0, o.size, o.size, 4, '#ff3b30');
      ctx.restore();
    }
    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#fff';
      ctx.font = '28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', w / 2, h / 2);
    }
  }

  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const delta = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) update(delta);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
