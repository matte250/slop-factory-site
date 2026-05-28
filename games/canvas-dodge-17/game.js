// Simple Canvas Dodge game based on IDEA.md
// The HTML contains a <canvas id="game"></canvas>
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio context is resumed on first interaction
  const resumeAudio = () => { audioCtx.state === 'suspended' && audioCtx.resume(); };
  document.addEventListener('keydown', resumeAudio, {once: true});
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
  function playSpawnSound() { playTone(300, 0.05); }
  function playHitSound() { playTone(150, 0.2); }
  // Set canvas size (adjust as needed)
  canvas.width = 800;
  canvas.height = 600;

  // Draw a gradient background
  function drawBackground() {
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001d3d'); // dark blue top
    bgGrad.addColorStop(1, '#004080'); // lighter bottom
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // optional subtle stars
    for (let i = 0; i < 30; i++) {
      const sx = Math.random() * canvas.width;
      const sy = Math.random() * canvas.height;
      const sr = Math.random() * 1.5 + 0.5;
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillRect(sx, sy, sr, sr);
    }
  }

  // Helper to draw rounded rectangle with shadow
  function drawRoundedRect(x, y, w, h, radius, fillStyle) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 8;
    ctx.fillStyle = fillStyle;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }


  // Player definition
  const player = {
    width: 60,
    height: 20,
    x: canvas.width / 2 - 30,
    y: canvas.height - 30,
    speed: 5,
    dx: 0,
    draw() {
      // Player with rounded corners and slight glow
      const playerGrad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
      playerGrad.addColorStop(0, '#6ab7ff');
      playerGrad.addColorStop(1, '#0a84ff');
      drawRoundedRect(this.x, this.y, this.width, this.height, 6, playerGrad);
    },
    update() {
      this.x += this.dx;
      // keep within bounds
      if (this.x < 0) this.x = 0;
      if (this.x + this.width > canvas.width) this.x = canvas.width - this.width;
    },
  };

  // Input handling
  const keys = { ArrowLeft: false, ArrowRight: false };
  document.addEventListener('keydown', e => {
    if (e.key in keys) keys[e.key] = true;
  });
  document.addEventListener('keyup', e => {
    if (e.key in keys) keys[e.key] = false;
  });

  // Circle (obstacle) definition
  class Circle {
    constructor() {
      this.radius = 15 + Math.random() * 10;
      this.x = Math.random() * (canvas.width - this.radius * 2) + this.radius;
      this.y = -this.radius;
      this.speed = 2 + Math.random() * 2;
    }
    update() {
      this.y += this.speed;
    }
draw() {
        // Circle with radial gradient and shadow for depth
        ctx.save();
        ctx.shadowColor = 'rgba(255,0,0,0.6)';
        ctx.shadowBlur = 10;
        const grad = ctx.createRadialGradient(this.x, this.y, this.radius * 0.2, this.x, this.y, this.radius);
        grad.addColorStop(0, '#ff8a80'); // light center
        grad.addColorStop(1, '#d50000'); // dark edge
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
  }

  let circles = [];
  let lastSpawn = 0;
  const spawnInterval = 1000; // ms
  let startTime = null;
  let gameOver = false;
  let score = 0;

  function spawnCircle(timestamp) {
    if (timestamp - lastSpawn > spawnInterval) {
      circles.push(new Circle());
      playSpawnSound();
      lastSpawn = timestamp;
    }
  }

  function updateCircles() {
    circles.forEach(c => c.update());
    // Remove circles that left the canvas
    circles = circles.filter(c => c.y - c.radius <= canvas.height);
  }

  function checkCollision() {
    for (const c of circles) {
      // Simple AABB vs circle collision
      const closestX = Math.max(player.x, Math.min(c.x, player.x + player.width));
      const closestY = Math.max(player.y, Math.min(c.y, player.y + player.height));
      const dx = c.x - closestX;
      const dy = c.y - closestY;
      if (dx * dx + dy * dy < c.radius * c.radius) {
        return true;
      }
    }
    return false;
  }

function drawScore() {
  // Gradient text for score
  const grad = ctx.createLinearGradient(0, 0, 200, 0);
  grad.addColorStop(0, '#fffd75');
  grad.addColorStop(1, '#ff6a00');
  ctx.fillStyle = grad;
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 4;
  ctx.font = '20px sans-serif';
  ctx.fillText(`Score: ${Math.floor(score)}`, 10, 30);
}

  function gameLoop(timestamp) {
    if (!startTime) startTime = timestamp;
    const delta = timestamp - startTime;
    score = delta / 1000; // seconds survived

    drawBackground();

    // handle input
    player.dx = 0;
    if (keys.ArrowLeft) player.dx = -player.speed;
    if (keys.ArrowRight) player.dx = player.speed;
    player.update();
    player.draw();

    // spawn & update circles
    spawnCircle(timestamp);
    updateCircles();
    circles.forEach(c => c.draw());

    drawScore();

    // collision detection
    if (checkCollision()) {
      playHitSound();
      gameOver = true;
    }

    if (!gameOver) {
      requestAnimationFrame(gameLoop);
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
      ctx.font = '32px sans-serif';
      ctx.fillText(`Score: ${Math.floor(score)}`, canvas.width / 2, canvas.height / 2 + 30);
    }
  }

  // start the loop
  requestAnimationFrame(gameLoop);
})();
