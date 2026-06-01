// Canvas Dodge game implementation
// Canvas element with id "game" is expected in the HTML.

(() => {
  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  // Ensure context resumes after first user interaction
  const resumeAudio = () => { audioCtx.resume(); };
  window.addEventListener('click', resumeAudio, { once: true });
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const width = (canvas.width = canvas.clientWidth);
  const height = (canvas.height = canvas.clientHeight);
  const center = { x: width / 2, y: height / 2 };

  // Player square
  const player = {
    size: 20,
    x: center.x - 10,
    y: center.y - 10,
    speed: 200, // pixels per second
    dx: 0,
    dy: 0,
  };

  // Input handling
  const keys = {};
  window.addEventListener('keydown', (e) => { keys[e.key] = true; });
  window.addEventListener('keyup', (e) => { keys[e.key] = false; });

  function updatePlayer(dt) {
    player.dx = 0;
    player.dy = 0;
    if (keys.ArrowUp || keys.w) player.dy = -1;
    if (keys.ArrowDown || keys.s) player.dy = 1;
    if (keys.ArrowLeft || keys.a) player.dx = -1;
    if (keys.ArrowRight || keys.d) player.dx = 1;
    // Normalize diagonal movement
    if (player.dx && player.dy) {
      const inv = 1 / Math.sqrt(2);
      player.dx *= inv;
      player.dy *= inv;
    }
    player.x += player.dx * player.speed * dt;
    player.y += player.dy * player.speed * dt;
    // Keep inside canvas
    player.x = Math.max(0, Math.min(width - player.size, player.x));
    player.y = Math.max(0, Math.min(height - player.size, player.y));
  }

  // Circle enemies
  const circles = [];
  let spawnInterval = 1000; // ms
  let lastSpawn = 0;
  let difficultyTimer = 0;
  let score = 0;
  let startTime = performance.now();

  function spawnCircle() {
  // Play spawn sound
  playTone(300, 80);
    // Spawn at random edge
    const side = Math.floor(Math.random() * 4);
    let x, y;
    if (side === 0) { // top
      x = Math.random() * width;
      y = -20;
    } else if (side === 1) { // bottom
      x = Math.random() * width;
      y = height + 20;
    } else if (side === 2) { // left
      x = -20;
      y = Math.random() * height;
    } else { // right
      x = width + 20;
      y = Math.random() * height;
    }
    const angle = Math.atan2(center.y - y, center.x - x);
    const speed = 50 + difficultyTimer * 0.02; // increase speed over time
    circles.push({ x, y, r: 15, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed });
  }

  function updateCircles(dt) {
    for (let i = circles.length - 1; i >= 0; i--) {
      const c = circles[i];
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      // Remove if passed center (optional)
      if (
        (c.vx > 0 && c.x > center.x) ||
        (c.vx < 0 && c.x < center.x) ||
        (c.vy > 0 && c.y > center.y) ||
        (c.vy < 0 && c.y < center.y)
      ) {
        circles.splice(i, 1);
      }
    }
  }

  function checkCollision() {
    for (const c of circles) {
      const closestX = Math.max(player.x, Math.min(c.x, player.x + player.size));
      const closestY = Math.max(player.y, Math.min(c.y, player.y + player.size));
      const dx = c.x - closestX;
      const dy = c.y - closestY;
      if (dx * dx + dy * dy < c.r * c.r) {
        return true;
      }
    }
    return false;
  }

  function draw() {
    // Clear and draw gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#222');
    bgGrad.addColorStop(1, '#111');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // Draw player with glow and rounded corners
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(0,0,255,0.7)';
    ctx.fillStyle = '#00f';
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
    ctx.shadowBlur = 0;
    // Draw circles with radial gradient glow
    for (const c of circles) {
      const grad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r);
      grad.addColorStop(0, 'rgba(255,0,0,0.8)');
      grad.addColorStop(1, 'rgba(255,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Score
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
  }

  function loop(timestamp) {
    const dt = (timestamp - (lastTime || timestamp)) / 1000;
    lastTime = timestamp;
    // Update difficulty and score
    difficultyTimer += dt * 1000;
    if (difficultyTimer - lastSpawn > spawnInterval) {
      spawnCircle();
      lastSpawn = difficultyTimer;
    }
    // Gradually increase spawn rate
    if (spawnInterval > 200) spawnInterval -= dt * 5;
    score = (timestamp - startTime) / 1000;
    updatePlayer(dt);
    updateCircles(dt);
    if (checkCollision()) {
    // Play collision sound
    playTone(150, 200);
      // Game over
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
      ctx.font = '24px sans-serif';
      ctx.fillText('Final Score: ' + Math.floor(score), width / 2, height / 2 + 40);
      return;
    }
    draw();
    requestAnimationFrame(loop);
  }

  let lastTime = null;
  requestAnimationFrame(loop);
})();
