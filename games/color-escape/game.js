// Simple "Color Escape" game based on IDEA.md
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas element with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');

  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start(audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }

  // Set canvas size (you can adjust as needed)
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  // Color palette indexed by digits 0-9
  const COLORS = [
    '#e6194b', '#3cb44b', '#ffe119', '#0082c8', '#f58231',
    '#911eb4', '#46f0f0', '#f032e6', '#d2f53c', '#fabebe'
  ];

  // Player properties
  const PLAYER = {
    width: 80,
    height: 20,
    x: canvas.width / 2 - 40, // centered
    y: canvas.height - 30,
    speed: 6,
    colorIndex: 0, // start with first color
  };

  // Game state
  let circles = [];

  // Helper: draw rounded rectangle
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
  let score = 0;
  let lives = 3;
  let lastSpawn = 0;
  const SPAWN_INTERVAL = 1000; // ms
  const CIRCLE_RADIUS = 15;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    // Change color with digit keys (0‑9)
    if (/^[0-9]$/.test(e.key)) {
      PLAYER.colorIndex = Number(e.key) % COLORS.length;
    }
  });
  window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
  });

  function spawnCircle(timestamp) {
    const x = Math.random() * (canvas.width - CIRCLE_RADIUS * 2) + CIRCLE_RADIUS;
    const colorIndex = Math.floor(Math.random() * COLORS.length);
    circles.push({ x, y: -CIRCLE_RADIUS, radius: CIRCLE_RADIUS, colorIndex, speed: 2 + Math.random() * 2 });
  }

  function update(delta) {
    // Move player
    if (keys['ArrowLeft']) {
      PLAYER.x = Math.max(0, PLAYER.x - PLAYER.speed);
    }
    if (keys['ArrowRight']) {
      PLAYER.x = Math.min(canvas.width - PLAYER.width, PLAYER.x + PLAYER.speed);
    }

    // Update circles
    for (let i = circles.length - 1; i >= 0; i--) {
      const c = circles[i];
      c.y += c.speed;

      // Check collision with player
      const withinX = c.x + c.radius > PLAYER.x && c.x - c.radius < PLAYER.x + PLAYER.width;
      const touchingY = c.y + c.radius >= PLAYER.y && c.y - c.radius <= PLAYER.y + PLAYER.height;
      if (withinX && touchingY) {
        if (c.colorIndex === PLAYER.colorIndex) {
          score += 10;
          playTone(800, 0.1);
        } else {
          lives -= 1;
          playTone(200, 0.2);
        }
        circles.splice(i, 1);
        continue;
      }

      // Remove off‑screen circles
      if (c.y - c.radius > canvas.height) {
        circles.splice(i, 1);
      }
    }
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#00172d');
    bgGrad.addColorStop(1, '#004080');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw player with rounded corners and shadow
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 6;
    ctx.fillStyle = COLORS[PLAYER.colorIndex];
    drawRoundedRect(PLAYER.x, PLAYER.y, PLAYER.width, PLAYER.height, 6);
    ctx.shadowBlur = 0;

    // Draw circles with radial gradient and stroke
    circles.forEach((c) => {
      const grad = ctx.createRadialGradient(c.x, c.y, c.radius * 0.3, c.x, c.y, c.radius);
      grad.addColorStop(0, 'white');
      grad.addColorStop(1, COLORS[c.colorIndex]);
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // UI: score and lives
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Lives: ${lives}`, canvas.width - 80, 20);
  }

  let lastTime = 0;
  function loop(timestamp) {
    const delta = timestamp - lastTime;
    lastTime = timestamp;

    if (lives <= 0) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#000';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
      ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 40);
      return; // stop animation
    }

    if (timestamp - lastSpawn > SPAWN_INTERVAL) {
      spawnCircle(timestamp);
      lastSpawn = timestamp;
    }

    update(delta);
    render();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
