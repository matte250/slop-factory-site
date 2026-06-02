// Simple endless vertical scrolling game "Sky Diver"
// Canvas element with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth || 400;
  const height = canvas.height = canvas.offsetHeight || 600;

  // Player (parachuter)
  const player = { x: width / 2, y: height - 50, w: 30, h: 30, speed: 4 };

  // Game objects
  const obstacles = [];
  const coins = [];
  let score = 0;
  let gameOver = false;

  // Input handling
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(freq, type = 'sine', duration = 0.1) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }
  function playCoinSound() { playSound(800, 'triangle', 0.08); }
  function playCollisionSound() { playSound(200, 'sawtooth', 0.3); }

  const keys = {};
  window.addEventListener('keydown', e => keys[e.key] = true);
  window.addEventListener('keyup', e => keys[e.key] = false);

  function spawnObstacle() {
    const size = 30 + Math.random() * 20;
    obstacles.push({ x: Math.random() * (width - size), y: -size, w: size, h: size, speed: 2 + Math.random() * 2 });
  }
  function spawnCoin() {
    const size = 15;
    coins.push({ x: Math.random() * (width - size), y: -size, r: size / 2, speed: 2 });
  }

  let obstacleTimer = 0, coinTimer = 0;

  function update() {
    if (gameOver) return;
    // Player movement
    if (keys['ArrowLeft'] || keys['a']) player.x -= player.speed;
    if (keys['ArrowRight'] || keys['d']) player.x += player.speed;
    // Clamp
    if (player.x < 0) player.x = 0;
    if (player.x + player.w > width) player.x = width - player.w;

    // Spawn obstacles/coins
    obstacleTimer++;
    coinTimer++;
    if (obstacleTimer > 90) { spawnObstacle(); obstacleTimer = 0; }
    if (coinTimer > 150) { spawnCoin(); coinTimer = 0; }

    // Move obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += o.speed;
      if (o.y > height) obstacles.splice(i, 1);
      // Collision with player
      if (rectIntersect(player, o)) { playCollisionSound(); gameOver = true; }
    }
    // Move coins
    for (let i = coins.length - 1; i >= 0; i--) {
      const c = coins[i];
      c.y += c.speed;
      if (c.y > height) { coins.splice(i, 1); continue; }
      if (circleRectIntersect(c, player)) { playCoinSound(); score++; coins.splice(i, 1); }
    }
  }

function draw() {
    // Sky background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#87ceeb'); // light sky
    grad.addColorStop(1, '#1e90ff'); // deeper
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Simple moving clouds (light white ellipses)
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    for (let i = 0; i < 5; i++) {
      const cx = (i * 150 + (Date.now() / 30) % width) % width;
      ctx.beginPath();
      ctx.ellipse(cx, 80 + i * 30, 60, 30, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Player (parachuter with canopy) – already drawn in its own code block
    // (drawn earlier in draw function)
    // Redraw player here using existing logic
    // Player (parachuter with canopy)
    // Draw parachute canopy
    ctx.fillStyle = '#ff0';
    ctx.beginPath();
    ctx.arc(player.x + player.w / 2, player.y, player.w, Math.PI, 2 * Math.PI);
    ctx.fill();
    // Draw cords
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y + player.h);
    ctx.lineTo(player.x + player.w / 2, player.y);
    ctx.moveTo(player.x + player.w, player.y + player.h);
    ctx.lineTo(player.x + player.w / 2, player.y);
    ctx.stroke();
    // Draw body
    ctx.fillStyle = '#ff0';
    ctx.fillRect(player.x, player.y + player.h / 2, player.w, player.h / 2);

    // Obstacles – birds (red triangles) and balloons (blue circles)
    obstacles.forEach(o => {
      if (o.w > 40) {
        // Balloon
        ctx.fillStyle = '#00aaff';
        ctx.beginPath();
        ctx.arc(o.x + o.w / 2, o.y + o.h / 2, o.w / 2, 0, Math.PI * 2);
        ctx.fill();
        // String
        ctx.strokeStyle = '#555';
        ctx.beginPath();
        ctx.moveTo(o.x + o.w / 2, o.y + o.h / 2);
        ctx.lineTo(o.x + o.w / 2, o.y + o.h + 10);
        ctx.stroke();
      } else {
        // Bird – simple triangle
        ctx.fillStyle = '#f00';
        ctx.beginPath();
        ctx.moveTo(o.x, o.y + o.h);
        ctx.lineTo(o.x + o.w / 2, o.y);
        ctx.lineTo(o.x + o.w, o.y + o.h);
        ctx.closePath();
        ctx.fill();
      }
    });

    // Coins – gold radial gradient
    coins.forEach(c => {
      const radGrad = ctx.createRadialGradient(c.x + c.r, c.y + c.r, c.r * 0.2, c.x + c.r, c.y + c.r, c.r);
      radGrad.addColorStop(0, '#ffd700');
      radGrad.addColorStop(1, '#ff8c00');
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(c.x + c.r, c.y + c.r, c.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Score
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', width / 2 - 80, height / 2);
    }
  }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // Helper collision functions
  function rectIntersect(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }
  function circleRectIntersect(c, r) {
    const distX = Math.abs(c.x + c.r - (r.x + r.w / 2));
    const distY = Math.abs(c.y + c.r - (r.y + r.h / 2));
    if (distX > (r.w / 2 + c.r)) return false;
    if (distY > (r.h / 2 + c.r)) return false;
    if (distX <= (r.w / 2)) return true;
    if (distY <= (r.h / 2)) return true;
    const dx = distX - r.w / 2;
    const dy = distY - r.h / 2;
    return (dx * dx + dy * dy <= (c.r * c.r));
  }
})();
