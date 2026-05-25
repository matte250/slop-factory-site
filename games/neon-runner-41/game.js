// Simple endless runner based on IDEA.md
// Canvas must have id="game"

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio can start after user interaction
  window.addEventListener('click', () => audioCtx.resume(), { once: true });

  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }

  function playCollect() {
    playTone(800, 0.1);
  }

  function playCollision() {
    playTone(200, 0.5);
  }


  // Player – glowing dot
  const player = {
    radius: 10,
    x: 50,
    y: height / 2,
    speed: 3,
    moveX: 0,
    moveY: 0,
  };

  // Input handling (Arrow keys / WASD)
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // Game objects
  const obstacles = [];
  const stars = [];
  let obstacleTimer = 0;
  let starTimer = 0;
  let speedFactor = 1;
  let score = 0;
  let gameOver = false;

  function spawnObstacle() {
    const heightObs = 20 + Math.random() * 30;
    const yPos = Math.random() * (height - heightObs);
    obstacles.push({ x: width, y: yPos, w: 20, h: heightObs });
  }

  function spawnStar() {
    const size = 8;
    const yPos = Math.random() * (height - size);
    stars.push({ x: width, y: yPos, size });
  }

  function update() {
    if (gameOver) return;
    // handle input
    player.moveX = 0; player.moveY = 0;
    if (keys['ArrowLeft'] || keys['a']) player.moveX = -player.speed;
    if (keys['ArrowRight'] || keys['d']) player.moveX = player.speed;
    if (keys['ArrowUp'] || keys['w']) player.moveY = -player.speed;
    if (keys['ArrowDown'] || keys['s']) player.moveY = player.speed;

    player.x = Math.max(player.radius, Math.min(width - player.radius, player.x + player.moveX));
    player.y = Math.max(player.radius, Math.min(height - player.radius, player.y + player.moveY));
    // add trail point for glowing effect
    addTrail(player.x, player.y);

    // spawn obstacles
    obstacleTimer -= 1;
    if (obstacleTimer <= 0) {
      spawnObstacle();
      obstacleTimer = 90 / speedFactor; // roughly every 1.5s initially
    }

    // spawn stars
    starTimer -= 1;
    if (starTimer <= 0) {
      spawnStar();
      starTimer = 150;
    }

    // move obstacles & check collision
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= 2 * speedFactor;
      // collision (circle-rect)
      const distX = Math.abs(player.x - o.x - o.w / 2);
      const distY = Math.abs(player.y - o.y - o.h / 2);
        if (distX > (o.w / 2 + player.radius) || distY > (o.h / 2 + player.radius)) {
          // no collision
        } else if (distX <= o.w / 2 || distY <= o.h / 2) {
          playCollision();
          gameOver = true;
          break;
        } else {
          const dx = distX - o.w / 2;
          const dy = distY - o.h / 2;
          if (dx * dx + dy * dy <= player.radius * player.radius) {
            playCollision();
            gameOver = true;
            break;
          }
        }
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }

    // move stars & collect
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.x -= 2 * speedFactor;
      const dx = player.x - s.x;
      const dy = player.y - s.y;
        if (dx * dx + dy * dy < (player.radius + s.size) ** 2) {
          playCollect();
          score += 10;
          stars.splice(i, 1);
          continue;
        }
      if (s.x + s.size < 0) stars.splice(i, 1);
    }

    // increase difficulty over time
    speedFactor += 0.0005;
    score += 0.1;
  }

  // graphics helpers
const trail = [];
const maxTrail = 12;
function addTrail(x, y) {
  trail.push({x, y});
  if (trail.length > maxTrail) trail.shift();
}
function drawBackground() {
  // dark neon gradient background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#001');
  bgGrad.addColorStop(1, '#003');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);
}
function drawTrail() {
  for (let i = 0; i < trail.length; i++) {
    const p = trail[i];
    const alpha = (i + 1) / trail.length * 0.6;
    ctx.fillStyle = `rgba(0,255,255,${alpha})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, player.radius * 0.8, 0, Math.PI * 2);
    ctx.fill();
  }
}
function drawStars() {
  stars.forEach(s => {
    // twinkle effect using sine wave based on frame count
    const t = (performance.now() / 1000 + s.x) % 2;
    const alpha = 0.5 + 0.5 * Math.sin(t * Math.PI);
    ctx.fillStyle = `rgba(255,255,0,${alpha})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
  });
}
function drawObstacles() {
  obstacles.forEach(o => {
    const grad = ctx.createLinearGradient(o.x, o.y, o.x + o.w, o.y);
    grad.addColorStop(0, '#f44');
    grad.addColorStop(1, '#a00');
    ctx.fillStyle = grad;
    ctx.fillRect(o.x, o.y, o.w, o.h);
    // subtle glow
    ctx.shadowColor = 'rgba(255,0,0,0.5)';
    ctx.shadowBlur = 6;
    ctx.fillRect(o.x, o.y, o.w, o.h);
    ctx.shadowBlur = 0;
  });
}
function draw() {
  // background
  drawBackground();
  // player trail
  drawTrail();
  // player glow
  const grad = ctx.createRadialGradient(player.x, player.y, player.radius / 2, player.x, player.y, player.radius * 2);
  grad.addColorStop(0, 'rgba(0,255,255,0.8)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius * 2, 0, Math.PI * 2);
  ctx.fill();
  // player core
  ctx.fillStyle = '#0ff';
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fill();

  // obstacles with gradient and glow
  drawObstacles();
  // stars with twinkle
  drawStars();

  // score UI
  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Score: ' + Math.floor(score), 10, 20);
  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#f00';
    ctx.textAlign = 'center';
    ctx.font = '48px sans-serif';
    ctx.fillText('Game Over', width / 2, height / 2);
  }
}

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
