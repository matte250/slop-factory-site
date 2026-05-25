// Canvas Chase game implementation
// Assumes an HTML canvas element with id="game"

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas element with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // Resize canvas to fill the window
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // Game state
  const player = { x: 100, y: 100, size: 20, speed: 4 };
  const obstacles = [];
  const gems = [];
  let score = 0;
  let gameOver = false;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    // Ensure audio context is running after user interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // Utility functions
  function randRange(min, max) {
    return Math.random() * (max - min) + min;
  }
  function normalize(vx, vy) {
    const len = Math.hypot(vx, vy);
    return len === 0 ? [0, 0] : [vx / len, vy / len];
  }
  function spawnObstacle() {
    const edge = Math.floor(randRange(0, 4)); // 0 top,1 right,2 bottom,3 left
    let x, y, vx, vy;
    const speed = 2 + Math.random() * 1.5;
    if (edge === 0) { // top
      x = randRange(0, canvas.width);
      y = -20;
    } else if (edge === 1) { // right
      x = canvas.width + 20;
      y = randRange(0, canvas.height);
    } else if (edge === 2) { // bottom
      x = randRange(0, canvas.width);
      y = canvas.height + 20;
    } else { // left
      x = -20;
      y = randRange(0, canvas.height);
    }
    // direction toward current player position
    [vx, vy] = normalize(player.x - x, player.y - y);
    vx *= speed;
    vy *= speed;
    obstacles.push({ x, y, radius: 15, vx, vy });
  }

  function spawnGem() {
    const radius = 8;
    const x = randRange(radius, canvas.width - radius);
    const y = randRange(radius, canvas.height - radius);
    gems.push({ x, y, radius });
  }

  function rectCircleCollide(rect, circle) {
    const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.size));
    const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.size));
    const dx = circle.x - closestX;
    const dy = circle.y - closestY;
    return dx * dx + dy * dy <= circle.radius * circle.radius;
  }

  function circleCircleCollide(c1, c2) {
    const dx = c1.x - c2.x;
    const dy = c1.y - c2.y;
    const rSum = c1.radius + c2.radius;
    return dx * dx + dy * dy <= rSum * rSum;
  }

  // Game loop
  let lastObstacle = 0;
  let lastGem = 0;
  function update(timestamp) {
    if (gameOver) return;
    // Move player
    if (keys['ArrowUp'] || keys['w']) player.y -= player.speed;
    if (keys['ArrowDown'] || keys['s']) player.y += player.speed;
    if (keys['ArrowLeft'] || keys['a']) player.x -= player.speed;
    if (keys['ArrowRight'] || keys['d']) player.x += player.speed;
    // Keep player inside bounds
    player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));

    // Spawn obstacles every 1000ms
    if (timestamp - lastObstacle > 1000) {
      spawnObstacle();
      lastObstacle = timestamp;
    }
    // Spawn gems every 5000ms
    if (timestamp - lastGem > 5000) {
      spawnGem();
      lastGem = timestamp;
    }

    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x += o.vx;
      o.y += o.vy;
      // Remove if far off screen
      if (o.x < -50 || o.x > canvas.width + 50 || o.y < -50 || o.y > canvas.height + 50) {
        obstacles.splice(i, 1);
        continue;
      }
      // Collision with player
      if (rectCircleCollide(player, o)) {
        beep(200, 0.3); // collision sound
gameOver = true;
      }
    }

    // Check gem collection
    for (let i = gems.length - 1; i >= 0; i--) {
      const g = gems[i];
      if (circleCircleCollide({ x: player.x + player.size / 2, y: player.y + player.size / 2, radius: player.size / 2 }, g)) {
        score += 10;
        beep(800, 0.1); // gem collection sound
        gems.splice(i, 1);
      }
    }

    // Draw
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#222');
    bgGrad.addColorStop(1, '#555');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Player (rounded square with gradient)
    const pGrad = ctx.createLinearGradient(player.x, player.y, player.x + player.size, player.y + player.size);
    pGrad.addColorStop(0, '#4a90e2');
    pGrad.addColorStop(1, '#0033ff');
    ctx.fillStyle = pGrad;
    const r = 4; // corner radius
    ctx.beginPath();
    ctx.moveTo(player.x + r, player.y);
    ctx.lineTo(player.x + player.size - r, player.y);
    ctx.quadraticCurveTo(player.x + player.size, player.y, player.x + player.size, player.y + r);
    ctx.lineTo(player.x + player.size, player.y + player.size - r);
    ctx.quadraticCurveTo(player.x + player.size, player.y + player.size, player.x + player.size - r, player.y + player.size);
    ctx.lineTo(player.x + r, player.y + player.size);
    ctx.quadraticCurveTo(player.x, player.y + player.size, player.x, player.y + player.size - r);
    ctx.lineTo(player.x, player.y + r);
    ctx.quadraticCurveTo(player.x, player.y, player.x + r, player.y);
    ctx.closePath();
    ctx.fill();

    // Obstacles (radial gradient circles)
    obstacles.forEach(o => {
      const grad = ctx.createRadialGradient(o.x, o.y, o.radius * 0.2, o.x, o.y, o.radius);
      grad.addColorStop(0, '#ff7777');
      grad.addColorStop(1, '#aa0000');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Gems (glowing yellow)
    gems.forEach(g => {
      ctx.save();
      ctx.shadowColor = 'rgba(255,255,0,0.8)';
      ctx.shadowBlur = 12;
      const grad = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.radius);
      grad.addColorStop(0, '#ffff99');
      grad.addColorStop(1, '#ffcc00');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText('Score: ' + score, 10, 30);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
      ctx.font = '24px sans-serif';
      ctx.fillText('Final Score: ' + score, canvas.width / 2, canvas.height / 2 + 40);
      return;
    }
    requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
})();
