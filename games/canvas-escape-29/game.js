// Simple Canvas Escape game
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Set a fixed size if not already set
  canvas.width = canvas.width || 400;
  canvas.height = canvas.height || 400;

  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
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
    osc.stop(audioCtx.currentTime + duration);
  }

  const player = { x: canvas.width / 2, y: canvas.height - 30, size: 20, speed: 4 };
  const keys = {};
  const circles = [];
  let spawnTimer = 0;
  let spawnInterval = 1000; // ms
  let lastTime = performance.now();
  let score = 0;
  let gameOver = false;

  // Input handling
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function spawnCircle() {
    const radius = Math.random() * 15 + 10;
    const x = Math.random() * (canvas.width - 2 * radius) + radius;
    const speed = 1 + Math.random() * 2 + score / 30; // increase speed with score
    circles.push({ x, y: -radius, radius, speed });
    // Play a short high‑pitched tone for spawn
    playTone(600, 0.05);
  }

  function update(dt) {
    // Player movement
    if (keys.ArrowLeft || keys.a) player.x -= player.speed;
    if (keys.ArrowRight || keys.d) player.x += player.speed;
    if (keys.ArrowUp || keys.w) player.y -= player.speed;
    if (keys.ArrowDown || keys.s) player.y += player.speed;
    // Keep inside canvas
    player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));

    // Circle movement and removal
    for (let i = circles.length - 1; i >= 0; i--) {
      const c = circles[i];
      c.y += c.speed;
      if (c.y - c.radius > canvas.height) circles.splice(i, 1);
    }

    // Spawn logic
    spawnTimer += dt;
    if (spawnTimer > spawnInterval) {
      spawnCircle();
      spawnTimer = 0;
      // gradually speed up spawning
      if (spawnInterval > 300) spawnInterval -= 20;
    }

    // Collision detection (square vs circle)
    for (const c of circles) {
      const closestX = Math.max(player.x, Math.min(c.x, player.x + player.size));
      const closestY = Math.max(player.y, Math.min(c.y, player.y + player.size));
      const dx = c.x - closestX;
      const dy = c.y - closestY;
      if (dx * dx + dy * dy < c.radius * c.radius) {
        // Play collision tone
        playTone(200, 0.3);
        gameOver = true;
        break;
      }
    }
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#111');
    bgGrad.addColorStop(1, '#222');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Helper for rounded rectangle
    function drawRoundedRect(x, y, w, h, r) {
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

    // Draw player with gradient and shadow
    ctx.save();
    const playerGrad = ctx.createLinearGradient(player.x, player.y, player.x + player.size, player.y + player.size);
    playerGrad.addColorStop(0, '#33a');
    playerGrad.addColorStop(1, '#006');
    ctx.fillStyle = playerGrad;
    ctx.shadowColor = 'rgba(0,0,255,0.5)';
    ctx.shadowBlur = 8;
    drawRoundedRect(player.x, player.y, player.size, player.size, 4);
    ctx.restore();

    // Draw circles with radial gradient and subtle shadow
    for (const c of circles) {
      const grad = ctx.createRadialGradient(c.x, c.y, c.radius * 0.2, c.x, c.y, c.radius);
      grad.addColorStop(0, '#ff7777');
      grad.addColorStop(1, '#880000');
      ctx.save();
      ctx.fillStyle = grad;
      ctx.shadowColor = 'rgba(255,0,0,0.3)';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  function loop(now) {
    const dt = now - lastTime;
    lastTime = now;
    if (!gameOver) {
      update(dt);
      score += dt / 1000; // seconds survived
    }
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
