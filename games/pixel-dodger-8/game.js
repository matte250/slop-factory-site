// Simple "Pixel Dodger" game implementation targeting <canvas id="game"></canvas>
// Player (blue square) moves up/down to dodge obstacles (red rectangles) and collect stars (yellow circles).
// Collision with an obstacle or timer reaching zero ends the game.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found.');
    return;
  }
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width = canvas.clientWidth || 800;
  const HEIGHT = canvas.height = canvas.clientHeight || 400;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  const PLAYER_SIZE = 20;
  const PLAYER_SPEED = 4;
  const OBSTACLE_SPEED = 3;
  const OBSTACLE_WIDTH = 30;
  const OBSTACLE_MIN_HEIGHT = 30;
  const OBSTACLE_MAX_HEIGHT = 120;
  const OBSTACLE_INTERVAL = 1500; // ms
  const STAR_RADIUS = 8;
  const STAR_SPEED = OBSTACLE_SPEED;
  const STAR_INTERVAL = 2000; // ms
  const TIMER_START = 30; // seconds

  const player = { x: 50, y: HEIGHT / 2 - PLAYER_SIZE / 2, w: PLAYER_SIZE, h: PLAYER_SIZE };
  const obstacles = [];
  const stars = [];
  const bgStars = [];
  let keys = {};
  let lastObstacle = 0;
  let lastStar = 0;
  let timer = TIMER_START;
  let score = 0;
  let gameOver = false;

  // generate background stars (slow moving)
  for (let i = 0; i < 100; i++) {
    bgStars.push({ x: Math.random() * WIDTH, y: Math.random() * HEIGHT, r: Math.random() * 1.5 + 0.5 });
  }

  // Input handling (resume audio on first interaction)
  window.addEventListener('keydown', e => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function rectsCollide(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }
  function circleRectCollide(circle, rect) {
    const distX = Math.abs(circle.x - rect.x - rect.w / 2);
    const distY = Math.abs(circle.y - rect.y - rect.h / 2);
    if (distX > rect.w / 2 + circle.r) return false;
    if (distY > rect.h / 2 + circle.r) return false;
    if (distX <= rect.w / 2) return true;
    if (distY <= rect.h / 2) return true;
    const dx = distX - rect.w / 2;
    const dy = distY - rect.h / 2;
    return dx * dx + dy * dy <= circle.r * circle.r;
  }

  function spawnObstacle() {
    const height = OBSTACLE_MIN_HEIGHT + Math.random() * (OBSTACLE_MAX_HEIGHT - OBSTACLE_MIN_HEIGHT);
    const y = Math.random() * (HEIGHT - height);
    obstacles.push({ x: WIDTH, y, w: OBSTACLE_WIDTH, h: height });
  }

  function spawnStar() {
    const y = Math.random() * (HEIGHT - STAR_RADIUS * 2) + STAR_RADIUS;
    stars.push({ x: WIDTH, y, r: STAR_RADIUS, collected: false });
  }

  function update(dt) {
    if (gameOver) return;
    // player movement
    if (keys['ArrowUp'] || keys['w']) player.y -= PLAYER_SPEED;
    if (keys['ArrowDown'] || keys['s']) player.y += PLAYER_SPEED;
    // keep within bounds
    player.y = Math.max(0, Math.min(HEIGHT - PLAYER_SIZE, player.y));

    // obstacles movement
    obstacles.forEach(o => o.x -= OBSTACLE_SPEED);
    while (obstacles.length && obstacles[0].x + obstacles[0].w < 0) obstacles.shift();

    // stars movement
    stars.forEach(s => s.x -= STAR_SPEED);
    while (stars.length && stars[0].x + stars[0].r < 0) stars.shift();

    // background stars slower movement for parallax
    bgStars.forEach(s => s.x -= 0.5);
    bgStars.forEach(s => { if (s.x < 0) { s.x = WIDTH; s.y = Math.random() * HEIGHT; } });

    // collisions
    for (let i = 0; i < obstacles.length; i++) {
      if (rectsCollide(player, obstacles[i])) {
        gameOver = true;
        // play collision sound (low tone)
        playTone(200, 0.3);
        break;
      }
    }
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      if (!s.collected && circleRectCollide(s, player)) {
        s.collected = true;
        score++;
        timer = Math.min(TIMER_START, timer + 1);
        // play collection sound (higher tone)
        playTone(800, 0.1);
        stars.splice(i, 1);
      }
    }

    // timer countdown
    timer -= dt / 1000;
    if (timer <= 0) gameOver = true;
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    bgGrad.addColorStop(0, '#0d0d2b');
    bgGrad.addColorStop(1, '#1a1a40');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // draw background stars
    ctx.fillStyle = '#fff';
    bgStars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // player with rounded rect and gradient
    const playerGrad = ctx.createLinearGradient(player.x, player.y, player.x + player.w, player.y + player.h);
    playerGrad.addColorStop(0, '#3498db');
    playerGrad.addColorStop(1, '#2980b9');
    ctx.fillStyle = playerGrad;
    ctx.beginPath();
    const radius = 4;
    ctx.moveTo(player.x + radius, player.y);
    ctx.lineTo(player.x + player.w - radius, player.y);
    ctx.quadraticCurveTo(player.x + player.w, player.y, player.x + player.w, player.y + radius);
    ctx.lineTo(player.x + player.w, player.y + player.h - radius);
    ctx.quadraticCurveTo(player.x + player.w, player.y + player.h, player.x + player.w - radius, player.y + player.h);
    ctx.lineTo(player.x + radius, player.y + player.h);
    ctx.quadraticCurveTo(player.x, player.y + player.h, player.x, player.y + player.h - radius);
    ctx.lineTo(player.x, player.y + radius);
    ctx.quadraticCurveTo(player.x, player.y, player.x + radius, player.y);
    ctx.closePath();
    ctx.fill();

    // obstacles with rounded corners
    ctx.fillStyle = '#e74c3c';
    obstacles.forEach(o => {
      const rad = 3;
      ctx.beginPath();
      ctx.moveTo(o.x + rad, o.y);
      ctx.lineTo(o.x + o.w - rad, o.y);
      ctx.quadraticCurveTo(o.x + o.w, o.y, o.x + o.w, o.y + rad);
      ctx.lineTo(o.x + o.w, o.y + o.h - rad);
      ctx.quadraticCurveTo(o.x + o.w, o.y + o.h, o.x + o.w - rad, o.y + o.h);
      ctx.lineTo(o.x + rad, o.y + o.h);
      ctx.quadraticCurveTo(o.x, o.y + o.h, o.x, o.y + o.h - rad);
      ctx.lineTo(o.x, o.y + rad);
      ctx.quadraticCurveTo(o.x, o.y, o.x + rad, o.y);
      ctx.closePath();
      ctx.fill();
    });

    // stars (still bright yellow)
    ctx.fillStyle = '#f1c40f';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // UI overlay
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Time: ${Math.max(0, timer.toFixed(1))}`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2 - 10);
      ctx.font = '20px sans-serif';
      ctx.fillText(`Final Score: ${score}`, WIDTH / 2, HEIGHT / 2 + 30);
    }
  }

  let lastTime = performance.now();
  function loop(now) {
    const dt = now - lastTime;
    lastTime = now;
    if (!gameOver) {
      if (now - lastObstacle > OBSTACLE_INTERVAL) { spawnObstacle(); lastObstacle = now; }
      if (now - lastStar > STAR_INTERVAL) { spawnStar(); lastStar = now; }
    }
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
