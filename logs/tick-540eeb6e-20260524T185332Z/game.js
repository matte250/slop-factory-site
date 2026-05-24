// Simple dodge game implementation
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Audio context and simple sound helpers
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration = 0.1) => {
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
  };
  const playSpawn = () => playTone(300, 0.05);
  const playHit = () => playTone(100, 0.2);


  // Player configuration
  const player = {
    width: 50,
    height: 20,
    x: width / 2 - 25,
    y: height - 30,
    speed: 5,
    color: '#00f'
  };

  // Falling circles configuration
  const circles = [];
  const circleSpawnInterval = 1000; // ms
  const circleRadius = 15;
  const circleSpeed = 2;

  // Game state
  let leftPressed = false;
  let rightPressed = false;
  let lastSpawn = 0;
  let startTime = null;
  const gameDuration = 60 * 1000; // 60 seconds
  let gameOver = false;

  // Input handling
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') leftPressed = true;
    if (e.key === 'ArrowRight') rightPressed = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') leftPressed = false;
    if (e.key === 'ArrowRight') rightPressed = false;
  });

  function spawnCircle() {
    const x = Math.random() * (width - circleRadius * 2) + circleRadius;
    const colors = ['#ff5252', '#ffb74d', '#ffeb3b', '#8bc34a', '#00bcd4', '#9575cd'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    circles.push({ x, y: -circleRadius, radius: circleRadius, color });
    playSpawn();
  }

  function update(delta) {
    // Move player
    if (leftPressed) player.x = Math.max(0, player.x - player.speed);
    if (rightPressed) player.x = Math.min(width - player.width, player.x + player.speed);

    // Spawn circles
    if (performance.now() - lastSpawn > circleSpawnInterval) {
      spawnCircle();
      lastSpawn = performance.now();
    }

    // Update circles
    for (let i = circles.length - 1; i >= 0; i--) {
      const c = circles[i];
      c.y += circleSpeed;
      // Remove off‑screen circles
      if (c.y - c.radius > height) circles.splice(i, 1);
    }

    // Collision detection
    for (const c of circles) {
      const closestX = Math.max(player.x, Math.min(c.x, player.x + player.width));
      const closestY = Math.max(player.y, Math.min(c.y, player.y + player.height));
      const dx = c.x - closestX;
      const dy = c.y - closestY;
      if (dx * dx + dy * dy < c.radius * c.radius) {
        playHit();
        gameOver = true;
        break;
      }
    }

    // Timer check
    if (performance.now() - startTime >= gameDuration) gameOver = true;
  }

  function draw() {
    // Gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#87ceeb'); // sky blue
    bgGrad.addColorStop(1, '#f0f8ff'); // alice blue
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Helper to draw rounded rectangle
    const drawRoundedRect = (x, y, w, h, r) => {
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
    };

    // Draw player with rounded corners
    ctx.fillStyle = player.color;
    drawRoundedRect(player.x, player.y, player.width, player.height, 5);

    // Draw circles with radial gradient and varied colors
    for (const c of circles) {
      const grad = ctx.createRadialGradient(c.x, c.y, c.radius * 0.2, c.x, c.y, c.radius);
      grad.addColorStop(0, c.color);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw timer with subtle shadow
    const elapsed = Math.floor((performance.now() - startTime) / 1000);
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.shadowColor = 'rgba(255,255,255,0.7)';
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.fillText(`Time: ${elapsed}s`, 10, 20);
    ctx.shadowColor = 'transparent';
  }

  function loop(timestamp) {
    if (!startTime) startTime = timestamp;
    const delta = timestamp - (lastFrame ?? timestamp);
    lastFrame = timestamp;
    if (!gameOver) {
      update(delta);
      draw();
      requestAnimationFrame(loop);
    } else {
      // Game over screen
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  requestAnimationFrame(loop);
})();
