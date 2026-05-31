// Simple "Falling Blocks Escape" game with enhanced graphics
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');

  // Set canvas size if not already defined
  canvas.width = canvas.width || 400;
  canvas.height = canvas.height || 600;

  // Create a subtle background gradient for visual depth
  function drawBackground() {
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#e0f7ff'); // light blue top
    grad.addColorStop(1, '#fff');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Player settings – now a rounded rectangle with a drop shadow
  const player = {
    width: 40,
    height: 20,
    x: canvas.width / 2 - 20,
    y: canvas.height - 30,
    speed: 5,
    color: '#0066ff',
    moveLeft: false,
    moveRight: false,
    update() {
      if (this.moveLeft) this.x = Math.max(0, this.x - this.speed);
      if (this.moveRight) this.x = Math.min(canvas.width - this.width, this.x + this.speed);
    },
    draw() {
      // Shadow
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.filter = 'blur(4px)';
      ctx.fillRect(this.x + 2, this.y + 2, this.width, this.height);
      ctx.restore();
      // Rounded rectangle
      ctx.fillStyle = this.color;
      const radius = 4;
      ctx.beginPath();
      ctx.moveTo(this.x + radius, this.y);
      ctx.lineTo(this.x + this.width - radius, this.y);
      ctx.quadraticCurveTo(this.x + this.width, this.y, this.x + this.width, this.y + radius);
      ctx.lineTo(this.x + this.width, this.y + this.height - radius);
      ctx.quadraticCurveTo(this.x + this.width, this.y + this.height, this.x + this.width - radius, this.y + this.height);
      ctx.lineTo(this.x + radius, this.y + this.height);
      ctx.quadraticCurveTo(this.x, this.y + this.height, this.x, this.y + this.height - radius);
      ctx.lineTo(this.x, this.y + radius);
      ctx.quadraticCurveTo(this.x, this.y, this.x + radius, this.y);
      ctx.closePath();
      ctx.fill();
    }
  };

  // Block settings – each block gets a random pastel color
  const blocks = [];
  let blockSpawnInterval = 2000; // ms
  let lastSpawn = 0;
  let blockSpeed = 2;

  function randomPastel() {
    const r = Math.round((Math.random() * 127) + 127);
    const g = Math.round((Math.random() * 127) + 127);
    const b = Math.round((Math.random() * 127) + 127);
    return `rgb(${r},${g},${b})`;
  }

  function spawnBlock() {
    const width = 20 + Math.random() * 80;
    const height = 20 + Math.random() * 40;
    const x = Math.random() * (canvas.width - width);
    blocks.push({
      x,
      y: -height,
      width,
      height,
      speed: blockSpeed,
      color: randomPastel()
    });
  }

  // Score handling – use a clearer font and a semi‑transparent background for readability
  let startTime = performance.now();
  let score = 0;
  const highScore = Number(localStorage.getItem('highScore') || 0);
  const scoreDrawer = {
    draw() {
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillRect(0, 0, 130, 30);
      ctx.fillStyle = '#000';
      ctx.font = '16px sans-serif';
      ctx.fillText(`Score: ${score}`, 10, 20);
      ctx.fillText(`High: ${highScore}`, 70, 20);
      ctx.restore();
    }
  };

  // Audio setup – simple beep synthesis
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // Input handling
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') player.moveLeft = true;
    if (e.key === 'ArrowRight') player.moveRight = true;
    // optional movement sound (soft click)
    // playBeep(600, 0.02);
  });
  window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft') player.moveLeft = false;
    if (e.key === 'ArrowRight') player.moveRight = false;
  });

  // Collision detection
  function collides(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x &&
           a.y < b.y + b.height && a.y + a.height > b.y;
  }

  // Main loop with background drawing and smoother block rendering
  function loop(timestamp) {
    // Draw background gradient first
    drawBackground();

    // Update and draw player
    player.update();
    player.draw();

    // Spawn blocks over time
    if (timestamp - lastSpawn > blockSpawnInterval) {
      spawnBlock();
      // sound for new block
      playBeep(300, 0.05);
      lastSpawn = timestamp;
      if (blockSpawnInterval > 500) blockSpawnInterval -= 50;
      blockSpeed += 0.05;
    }

    // Update blocks
    for (let i = blocks.length - 1; i >= 0; i--) {
      const b = blocks[i];
      b.y += b.speed;
      // Draw block with a slight shadow for depth
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      ctx.fillRect(b.x + 2, b.y + 2, b.width, b.height);
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.width, b.height);
      ctx.restore();

      if (collides(player, b)) {
        // collision sound
        playBeep(100, 0.3);
        alert('Game Over! Score: ' + score);
        if (score > highScore) {
          localStorage.setItem('highScore', score);
        }
        return;
      }

      if (b.y > canvas.height) {
        blocks.splice(i, 1);
      }
    }

    // Update and draw score
    score = Math.floor((timestamp - startTime) / 1000);
    scoreDrawer.draw();

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
