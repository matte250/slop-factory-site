// Simple Pixel Escape game
// Canvas with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas "game" not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;

  // Player
  const player = { x: width / 2, y: height - 30, size: 5, speed: 2 };

  // Obstacles
  const obstacles = [];
  const obstacleFreq = 90; // frames
  let frame = 0;

  // Stars (points)
  const stars = [];
  const starFreq = 150;
  let score = 0;
  let gameOver = false;

  function spawnObstacle() {
    const size = 10 + Math.random() * 15;
    const x = Math.random() * (width - size);
    obstacles.push({ x, y: -size, size, speed: 1 + Math.random() * 2 });
  }

  function spawnStar() {
    const size = 4;
    const x = Math.random() * (width - size);
    stars.push({ x, y: -size, size, speed: 1 });
  }

  function update() {
    if (gameOver) return;
    // Move player based on keys
    if (keys['ArrowLeft'] || keys['a']) player.x -= player.speed;
    if (keys['ArrowRight'] || keys['d']) player.x += player.speed;
    if (keys['ArrowUp'] || keys['w']) player.y -= player.speed;
    if (keys['ArrowDown'] || keys['s']) player.y += player.speed;
    // Keep within bounds
    player.x = Math.max(0, Math.min(width - player.size, player.x));
    player.y = Math.max(0, Math.min(height - player.size, player.y));

    // Obstacles
    obstacles.forEach(o => o.y += o.speed);
    // Remove off‑screen obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      if (obstacles[i].y > height) obstacles.splice(i, 1);
    }
    // Stars
    stars.forEach(s => s.y += s.speed);
    for (let i = stars.length - 1; i >= 0; i--) {
      if (stars[i].y > height) stars.splice(i, 1);
    }

    // Collision detection
    for (const o of obstacles) {
      if (rectIntersect(player, o)) { gameOver = true; playTone(150, 0.4); break; }
    }
    // Collect stars
    for (let i = stars.length - 1; i >= 0; i--) {
      if (rectIntersect(player, stars[i])) { score++; playTone(400, 0.15); stars.splice(i, 1); }
    }

    // Spawn new objects
    if (frame % obstacleFreq === 0) spawnObstacle();
    if (frame % starFreq === 0) spawnStar();
    frame++;
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // Background: dark gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#0a0a1a');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // Player: neon circle with glow
    ctx.save();
    ctx.shadowColor = '#0f0';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.arc(player.x + player.size/2, player.y + player.size/2, player.size, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
    // Obstacles: rounded rectangles with red glow
    ctx.save();
    ctx.shadowColor = '#f44';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#f44';
    obstacles.forEach(o => {
      ctx.beginPath();
      const radius = 3;
      ctx.moveTo(o.x + radius, o.y);
      ctx.lineTo(o.x + o.size - radius, o.y);
      ctx.quadraticCurveTo(o.x + o.size, o.y, o.x + o.size, o.y + radius);
      ctx.lineTo(o.x + o.size, o.y + o.size - radius);
      ctx.quadraticCurveTo(o.x + o.size, o.y + o.size, o.x + o.size - radius, o.y + o.size);
      ctx.lineTo(o.x + radius, o.y + o.size);
      ctx.quadraticCurveTo(o.x, o.y + o.size, o.x, o.y + o.size - radius);
      ctx.lineTo(o.x, o.y + radius);
      ctx.quadraticCurveTo(o.x, o.y, o.x + radius, o.y);
      ctx.closePath();
      ctx.fill();
    });
    ctx.restore();
    // Stars: glowing circles with slight twinkle
    ctx.save();
    ctx.shadowColor = '#ff0';
    ctx.shadowBlur = 6;
    ctx.fillStyle = '#ff0';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x + s.size/2, s.y + s.size/2, s.size, 0, Math.PI*2);
      ctx.fill();
    });
    ctx.restore();
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '14px monospace';
    ctx.fillText('Score: ' + score, 10, 20);
    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = '24px monospace';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  // Ensure audio context is resumed on first user interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; resumeAudio(); });
  window.addEventListener('keyup', e => keys[e.key] = false);

  function rectIntersect(a, b) {
    return a.x < b.x + b.size && a.x + a.size > b.x &&
           a.y < b.y + b.size && a.y + a.size > b.y;
  }

  // Start the game loop
  requestAnimationFrame(loop);
})();
