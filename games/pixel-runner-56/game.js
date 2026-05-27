// Simple endless runner targeting canvas with id "game"
(() => {
  // Graphic enhancements: background gradient, clouds, player shading, obstacle colors, star pulse
  const SKY_TOP = '#87ceeb';
  const SKY_BOTTOM = '#b0e0e6';
  const GROUND_COLOR = '#654321';
  const CLOUD_COLOR = '#fff';
  const CLOUD_SPEED = 1;
  const CLOUD_SPAWN = 4000; // ms
  let clouds = [];
  let lastCloudTime = 0;

  function spawnCloud() {
    const radius = 30 + Math.random() * 20;
    const y = Math.random() * GROUND_Y * 0.5;
    clouds.push({ x: canvas.width, y, r: radius });
  }

  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Set canvas size to its displayed size
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;

  const GRAVITY = 0.5;
  const JUMP_VELOCITY = -10;
  const SPEED = 3; // world scroll speed
  const GROUND_Y = canvas.height * 0.8;

  const player = {
    x: 50,
    y: GROUND_Y - 30,
    w: 30,
    h: 30,
    vy: 0,
    onGround: true,
  };

  let obstacles = [];
  let stars = [];
  let score = 0;
  let gameOver = false;
  let lastObstacleTime = 0;
  let lastStarTime = 0;

  function spawnObstacle() {
    const height = 30 + Math.random() * 40;
    const hue = Math.floor(Math.random() * 360);
    const color = `hsl(${hue}, 40%, 30%)`;
    obstacles.push({
      x: canvas.width,
      y: GROUND_Y - height,
      w: 20,
      h: height,
      color,
    });
  }

  function spawnStar() {
    const size = 12;
    const y = GROUND_Y - 80 - Math.random() * 100;
    stars.push({ x: canvas.width, y, r: size / 2, collected: false });
  }

  function rectCollision(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function circleRectCollision(circle, rect) {
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

  let audioCtx;
function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}
function playTone(freq, duration) {
  const ctx = getAudioCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = freq;
  osc.type = 'sine';
  osc.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0.001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
  osc.start(ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);
  osc.stop(ctx.currentTime + duration / 1000);
}
function jump() {
    if (player.onGround && !gameOver) {
      player.vy = JUMP_VELOCITY;
      player.onGround = false;
      playTone(300, 120); // jump sound
    }
  }

  canvas.addEventListener('click', jump);
  document.addEventListener('keydown', (e) => { if (e.code === 'Space') jump(); });

  function update(dt) {
    if (gameOver) return;
    // Player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y + player.h >= GROUND_Y) {
      player.y = GROUND_Y - player.h;
      player.vy = 0;
      player.onGround = true;
    }
    // Move obstacles, stars, clouds
    obstacles.forEach(o => (o.x -= SPEED));
    stars.forEach(s => (s.x -= SPEED));
    clouds.forEach(c => (c.x -= CLOUD_SPEED));
    // Remove off‑screen
    obstacles = obstacles.filter(o => o.x + o.w > 0);
    stars = stars.filter(s => s.x + s.r > 0 && !s.collected);
    clouds = clouds.filter(c => c.x + c.r > 0);
    // Spawn new obstacles, stars, clouds
    const now = performance.now();
    if (now - lastObstacleTime > 1500) {
      spawnObstacle();
      lastObstacleTime = now;
    }
    if (now - lastStarTime > 3000) {
      spawnStar();
      lastStarTime = now;
    }
    if (now - lastCloudTime > CLOUD_SPAWN) {
      spawnCloud();
      lastCloudTime = now;
    }
    // Collisions
    for (const o of obstacles) {
      if (rectCollision(player, o)) {
        gameOver = true;
        playTone(100, 300); // collision sound
        break;
      }
    }
    for (const s of stars) {
      if (!s.collected && circleRectCollision({ x: s.x, y: s.y, r: s.r }, player)) {
        s.collected = true;
        score += 10;
        playTone(600, 80); // star collect sound
      }
    }
    // Score by distance
    score += dt * 0.01;
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    skyGrad.addColorStop(0, SKY_TOP);
    skyGrad.addColorStop(1, SKY_BOTTOM);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, GROUND_Y);
    // clouds
    ctx.fillStyle = CLOUD_COLOR;
    clouds.forEach(c => {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // ground
    ctx.fillStyle = GROUND_COLOR;
    ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y);
    // player with shading
    const grad = ctx.createLinearGradient(player.x, player.y, player.x, player.y + player.h);
    grad.addColorStop(0, '#ff7f7f');
    grad.addColorStop(1, '#ff0000');
    ctx.fillStyle = grad;
    ctx.fillRect(player.x, player.y, player.w, player.h);
    // obstacles with individual colors
    obstacles.forEach(o => {
      ctx.fillStyle = o.color || '#000';
      ctx.fillRect(o.x, o.y, o.w, o.h);
    });
    // stars with pulse effect
    const pulse = Math.abs(Math.sin(performance.now() / 200)) * 0.5 + 0.75;
    ctx.fillStyle = '#ffd700';
    stars.forEach(s => {
      if (s.collected) return;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * pulse, 0, Math.PI * 2);
      ctx.fill();
    });
    // score
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '32px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
      ctx.font = '20px sans-serif';
      ctx.fillText('Click to restart', canvas.width / 2, canvas.height / 2 + 20);
    }
  }

  function loop(timestamp) {
    if (!lastFrame) lastFrame = timestamp;
    const dt = timestamp - lastFrame;
    lastFrame = timestamp;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  function restart() {
    obstacles = [];
    stars = [];
    score = 0;
    gameOver = false;
    player.y = GROUND_Y - player.h;
    player.vy = 0;
    player.onGround = true;
  }

  canvas.addEventListener('click', () => { if (gameOver) restart(); });

  let lastFrame = null;
  requestAnimationFrame(loop);
})();
