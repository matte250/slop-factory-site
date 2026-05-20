// Simple Gravity Dodge game targeting canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // canvas must exist
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth;
  const height = canvas.height = canvas.offsetHeight;

  // Audio context and helper for simple beep sounds
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    osc.start(now);
    osc.stop(now + duration);
  }

  const player = { x: width / 2, y: height - 30, r: 15, speed: 5 };
  const keys = { left: false, right: false };
  const obstacles = [];
  let obstacleTimer = 0;
  let obstacleInterval = 1500; // ms
  let lastTime = 0;
  let score = 0;
  let speedFactor = 1;

  // Input handling
  document.addEventListener('keydown', e => {
    // ensure audio context is running (required by some browsers)
    if (audioCtx.state !== 'running') audioCtx.resume();
    if (e.key === 'ArrowLeft') { keys.left = true; beep(400, 0.05); }
    if (e.key === 'ArrowRight') { keys.right = true; beep(400, 0.05); }
  });
  document.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') keys.left = false;
    if (e.key === 'ArrowRight') keys.right = false;
  });

  function spawnObstacle() {
    const size = 20 + Math.random() * 30;
    const x = Math.random() * (width - size);
    obstacles.push({ x, y: -size, w: size, h: size, speed: 2 * speedFactor });
    // sound for new obstacle
    beep(600, 0.04);
  }

  function update(dt) {
    // player movement
    if (keys.left) player.x -= player.speed;
    if (keys.right) player.x += player.speed;
    // keep within bounds
    player.x = Math.max(player.r, Math.min(width - player.r, player.x));

    // obstacles
    obstacleTimer += dt;
    if (obstacleTimer > obstacleInterval) {
      spawnObstacle();
      obstacleTimer = 0;
      // gradually increase difficulty
      speedFactor += 0.02;
      obstacleInterval = Math.max(400, obstacleInterval - 5);
    }
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += o.speed;
      if (o.y > height) {
        obstacles.splice(i, 1);
        score++;
      } else if (
        player.x + player.r > o.x &&
        player.x - player.r < o.x + o.w &&
        player.y - player.r < o.y + o.h &&
        player.y + player.r > o.y
      ) {
        // collision – stop game
        alert('Game Over! Score: ' + score);
        document.location.reload();
        return;
      }
    }
  }

function draw() {
  // background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#001d3d');
  bgGrad.addColorStop(1, '#003566');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // stars (background particles)
  if (!window._stars) window._stars = [];
  const stars = window._stars;
  // create new stars occasionally
  if (Math.random() < 0.05) {
    stars.push({ x: Math.random() * width, y: -2, size: Math.random() * 2 + 1, speed: 0.5 + Math.random() * 0.5 });
  }
  ctx.fillStyle = '#fff';
  stars.forEach((s, i) => {
    s.y += s.speed;
    ctx.fillRect(s.x, s.y, s.size, s.size);
    if (s.y > height) stars.splice(i, 1);
  });

  // player with radial gradient
  const pGrad = ctx.createRadialGradient(player.x, player.y, player.r * 0.2, player.x, player.y, player.r);
  pGrad.addColorStop(0, '#66f');
  pGrad.addColorStop(1, '#00a');
  ctx.fillStyle = pGrad;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
  ctx.fill();

  // obstacles with rounded corners and slight color variation
  obstacles.forEach(o => {
    const radius = 4;
    ctx.fillStyle = '#a22';
    ctx.beginPath();
    ctx.moveTo(o.x + radius, o.y);
    ctx.lineTo(o.x + o.w - radius, o.y);
    ctx.quadraticCurveTo(o.x + o.w, o.y, o.x + o.w, o.y + radius);
    ctx.lineTo(o.x + o.w, o.y + o.h - radius);
    ctx.quadraticCurveTo(o.x + o.w, o.y + o.h, o.x + o.w - radius, o.y + o.h);
    ctx.lineTo(o.x + radius, o.y + o.h);
    ctx.quadraticCurveTo(o.x, o.y + o.h, o.x, o.y + o.h - radius);
    ctx.lineTo(o.x, o.y + radius);
    ctx.quadraticCurveTo(o.x, o.y, o.x + radius, o.y);
    ctx.closePath();
    ctx.fill();
  });

  // score
  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  ctx.fillText('Score: ' + score, 10, 20);
}

  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
