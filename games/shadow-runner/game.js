// Simple "Shadow Runner" game implementation with improved graphics.
// Canvas element with id="game" must exist in the host HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // ----- Audio assets -----
  const hitSound = new Audio('https://cdn.jsdelivr.net/gh/jakesgordon/javascript-misc-sound-effects@master/soundeffects/hit.wav');
  const collectSound = new Audio('https://cdn.jsdelivr.net/gh/jakesgordon/javascript-misc-sound-effects@master/soundeffects/pickup.wav');
  const bgMusic = new Audio('https://cdn.jsdelivr.net/gh/jakesgordon/javascript-misc-sound-effects@master/soundeffects/ambient1.mp3');
  bgMusic.loop = true;
  bgMusic.volume = 0.2;
  let audioStarted = false;
  function startAudio(){
    if (!audioStarted){
      bgMusic.play().catch(()=>{});
      audioStarted = true;
    }
  }

  // ----- Player (glowing orb) -----
  const player = {
    x: width * 0.2,
    y: height / 2,
    radius: 15,
    speed: 3,
    dx: 0,
    dy: 0,
    color: '#fffa8b'
  };

  // ----- Input handling -----
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    player.x = e.clientX - rect.left;
    player.y = e.clientY - rect.top;
  });

  // ----- Obstacles (shadow bars) -----
  const obstacles = [];
  const obstacleSpeed = 2;
  const obstacleInterval = 1500; // ms
  let lastObstacle = 0;

  // ----- Light shards (collectibles) -----
  const shards = [];
  const shardInterval = 2000; // ms
  let lastShard = 0;

  // ----- Game state -----
  let score = 0;
  let gameOver = false;

  // ----- Utility: circle‑rectangle collision -----
  function circleRectCollide(cx, cy, r, rx, ry, rw, rh) {
    // Find nearest point on rectangle to circle centre
    const nearestX = Math.max(rx, Math.min(cx, rx + rw));
    const nearestY = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - nearestX;
    const dy = cy - nearestY;
    return dx * dx + dy * dy < r * r;
  }

  // ----- Game loop -----
  function update(timestamp) {
    if (gameOver) return drawGameOver();
    // Ensure background music starts
    startAudio();
    // Move player according to keyboard (if mouse not used)
    if (keys.ArrowUp) player.dy = -player.speed;
    else if (keys.ArrowDown) player.dy = player.speed;
    else player.dy = 0;
    if (keys.ArrowLeft) player.dx = -player.speed;
    else if (keys.ArrowRight) player.dx = player.speed;
    else player.dx = 0;
    player.x = Math.max(player.radius, Math.min(width - player.radius, player.x + player.dx));
    player.y = Math.max(player.radius, Math.min(height - player.radius, player.y + player.dy));

    // Spawn obstacles
    if (timestamp - lastObstacle > obstacleInterval) {
      const gapHeight = 80 + Math.random() * 60;
      const gapY = Math.random() * (height - gapHeight);
      obstacles.push({ x: width, w: 30, gapY, gapHeight });
      lastObstacle = timestamp;
    }
    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= obstacleSpeed;
      // Top bar
      if (circleRectCollide(player.x, player.y, player.radius, o.x, 0, o.w, o.gapY)) { hitSound.play().catch(()=>{}); gameOver = true; }
      // Bottom bar
      if (circleRectCollide(player.x, player.y, player.radius, o.x, o.gapY + o.gapHeight, o.w, height - (o.gapY + o.gapHeight))) gameOver = true;
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }

    // Spawn shards
    if (timestamp - lastShard > shardInterval) {
      const shard = {
        x: width,
        y: Math.random() * height,
        r: 6,
        speed: obstacleSpeed + 0.5
      };
      shards.push(shard);
      lastShard = timestamp;
    }
    // Update shards
    for (let i = shards.length - 1; i >= 0; i--) {
      const s = shards[i];
      s.x -= s.speed;
      // Collision with player
      const dx = player.x - s.x;
      const dy = player.y - s.y;
      if (dx * dx + dy * dy < (player.radius + s.r) ** 2) {
        collectSound.play().catch(()=>{});
        score++;
        shards.splice(i, 1);
        continue;
      }
      if (s.x + s.r < 0) shards.splice(i, 1);
    }

    draw();
    requestAnimationFrame(update);
  }

  function draw() {
    // Background gradient (deep space)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#111');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Draw player with glowing radial gradient
    const grad = ctx.createRadialGradient(player.x, player.y, player.radius * 0.2, player.x, player.y, player.radius);
    grad.addColorStop(0, '#fff9c4');
    grad.addColorStop(1, player.color);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw obstacles (shadow bars) with subtle gradient
    const obsGrad = ctx.createLinearGradient(0, 0, 0, height);
    obsGrad.addColorStop(0, '#2c2c2c');
    obsGrad.addColorStop(1, '#111');
    ctx.fillStyle = obsGrad;
    obstacles.forEach(o => {
      // top bar
      ctx.fillRect(o.x, 0, o.w, o.gapY);
      // bottom bar
      ctx.fillRect(o.x, o.gapY + o.gapHeight, o.w, height - (o.gapY + o.gapHeight));
    });

    // Draw shards (sparkles) with slight outer glow
    shards.forEach(s => {
      const shardGrad = ctx.createRadialGradient(s.x, s.y, s.r * 0.2, s.x, s.y, s.r);
      shardGrad.addColorStop(0, '#fff');
      shardGrad.addColorStop(1, '#ffd700');
      ctx.fillStyle = shardGrad;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
  }

  function drawGameOver() {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#ff5555';
    ctx.font = '24px sans-serif';
    ctx.fillText('Game Over', width / 2 - 60, height / 2);
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, width / 2 - 30, height / 2 + 30);
  }

  // Start the game loop
  requestAnimationFrame(update);
})();
