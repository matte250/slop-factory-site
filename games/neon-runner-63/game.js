// Neon Runner – enhanced graphics
// Assumes an HTML canvas with id="game"

(() => {
  // Helper to draw rounded rectangles
  function roundRect(x, y, w, h, r) {
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

  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // High‑DPI support
  const dpr = window.devicePixelRatio || 1;
  // Simple sound utility using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain).connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  function playCollision() { beep(150, 0.3); }
  function playScore() { beep(400, 0.07); }
  const width = canvas.offsetWidth || 800;
  const height = canvas.offsetHeight || 600;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  // Player (neon square)
  const player = { x: width / 2 - 15, y: height - 60, size: 30, speed: 4, color: '#0ff' };
  const trail = [];

  // Obstacles pool
  const obstacles = [];
  const obstacleFreq = 90; // frames
  let frame = 0;
  let score = 0;
  let running = true;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; audioCtx.resume && audioCtx.resume(); });
  window.addEventListener('keyup', e => keys[e.key] = false);
  // Touch support – simple left/right halves
  canvas.addEventListener('touchstart', e => {
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const cx = touch.clientX - rect.left;
    keys['ArrowLeft'] = cx < width / 2;
    keys['ArrowRight'] = cx >= width / 2;
  });
  canvas.addEventListener('touchend', () => { keys['ArrowLeft'] = keys['ArrowRight'] = false; });

  function spawnObstacle() {
    const w = 50 + Math.random() * 100;
    const h = 20 + Math.random() * 30;
    const x = Math.random() * (width - w);
    // start just above canvas and move downwards
    obstacles.push({ x, y: -h, w, h, speed: 2 + Math.random() * 2, color: '#f0f' });
  }

  function update() {
    // player movement
    if (keys['ArrowLeft']) player.x -= player.speed;
    if (keys['ArrowRight']) player.x += player.speed;
    // keep within bounds
    player.x = Math.max(0, Math.min(width - player.size, player.x));

    // obstacle movement & spawn
    if (frame % obstacleFreq === 0) spawnObstacle();
    obstacles.forEach(o => o.y += o.speed);
    // remove passed obstacles
    while (obstacles.length && obstacles[0].y > height) obstacles.shift();

    // collision detection
    for (const o of obstacles) {
      if (player.x < o.x + o.w && player.x + player.size > o.x &&
          player.y < o.y + o.h && player.y + player.size > o.y) {
        running = false;
        playCollision();
        break;
      }
    }
    // lose if falls off bottom (unlikely in upward runner but kept for spec)
    if (player.y > height) running = false;

    const newScore = Math.floor(frame / 60);
    if (newScore > score) {
      playScore();
    }
    score = newScore;
    frame++;
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#003');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // player with glow and rounded corners
    ctx.shadowColor = player.color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = player.color;
    roundRect(player.x, player.y, player.size, player.size, 6);
    // reset shadow for obstacles
    ctx.shadowColor = 'rgba(0,0,0,0)';
    ctx.shadowBlur = 0;
    // obstacles with rounded corners
    for (const o of obstacles) {
      ctx.fillStyle = o.color;
      ctx.shadowColor = o.color;
      ctx.shadowBlur = 8;
      roundRect(o.x, o.y, o.w, o.h, 4);
    }
    // reset shadow
    ctx.shadowColor = 'rgba(0,0,0,0)';
    ctx.shadowBlur = 0;
    // score overlay
    ctx.fillStyle = '#fff';
    ctx.font = '20px monospace';
    ctx.fillText('Score: ' + score, 10, 30);
  }

  function loop() {
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f88';
      ctx.font = '40px monospace';
      ctx.fillText('Game Over', width / 2 - 100, height / 2);
      return;
    }
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // start
  requestAnimationFrame(loop);
})();
