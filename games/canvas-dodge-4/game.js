// Simple Canvas Dodge game
// Targets <canvas id="game"></canvas>
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // canvas must exist
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 400;
  const height = canvas.height = canvas.clientHeight || 600;

  // Sound setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, dur) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  };

  // Player
  const player = {
    radius: 12,
    x: width / 2,
    y: height - 20,
    speed: 4,
    dx: 0,
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#ff6600';
      ctx.fill();
    },
    update() {
      this.x += this.dx;
      if (this.x < this.radius) this.x = this.radius;
      if (this.x > width - this.radius) this.x = width - this.radius;
    }
  };

  // Falling blocks
  const blocks = [];
  const blockSpawnInterval = 1000; // ms
  const blockSpeed = 2;
  function spawnBlock() {
    const blockWidth = 40 + Math.random() * 80;
    const x = Math.random() * (width - blockWidth);
    blocks.push({x, y: -20, w: blockWidth, h: 20});
    // sound for new block
    playTone(300, 0.05);
  }
  let lastSpawn = 0;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
  });

  let startTime = null;
  let gameOver = false;

  function update(dt) {
    if (gameOver) return;
    // player movement
    player.dx = 0;
    if (keys.left) player.dx = -player.speed;
    if (keys.right) player.dx = player.speed;
    player.update();

    // blocks movement
    for (let i = blocks.length - 1; i >= 0; i--) {
      const b = blocks[i];
      b.y += blockSpeed;
      // collision detection (circle-rect)
      const distX = Math.abs(player.x - (b.x + b.w / 2));
      const distY = Math.abs(player.y - (b.y + b.h / 2));
      if (distX > (b.w / 2 + player.radius) || distY > (b.h / 2 + player.radius)) {
        // no collision
      } else if (distX <= (b.w / 2) || distY <= (b.h / 2)) {
playTone(150, 0.2);
        gameOver = true;
      } else {
        const dx = distX - b.w / 2;
        const dy = distY - b.h / 2;
        if (dx * dx + dy * dy <= player.radius * player.radius) gameOver = true;
      }
      // remove off-screen
      if (b.y > height) blocks.splice(i, 1);
    }

    // spawn blocks
    if (performance.now() - lastSpawn > blockSpawnInterval) {
      spawnBlock();
      lastSpawn = performance.now();
    }
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#87ceeb'); // sky blue
    bgGrad.addColorStop(1, '#f0f8ff'); // light
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // draw player with radial gradient and shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 8;
    const grad = ctx.createRadialGradient(player.x, player.y, player.radius * 0.2, player.x, player.y, player.radius);
    grad.addColorStop(0, '#ffcc00');
    grad.addColorStop(1, '#ff6600');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // helper for rounded rectangles
    const roundRect = (x, y, w, h, r) => {
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
    };

    // draw blocks with rounded corners and subtle shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.2)';
    ctx.shadowBlur = 4;
    for (const b of blocks) {
      const hue = 180 + Math.random() * 60; // varied teal-blue
      ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
      roundRect(b.x, b.y, b.w, b.h, 4);
      ctx.fill();
    }
    ctx.restore();

    // score with bold font
    ctx.fillStyle = '#000';
    ctx.font = 'bold 16px sans-serif';
    const seconds = ((performance.now() - startTime) / 1000).toFixed(1);
    ctx.fillText(`Time: ${seconds}s`, 10, 30);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop(timestamp) {
    if (!startTime) startTime = timestamp;
    const dt = timestamp - (lastTime || timestamp);
    lastTime = timestamp;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  let lastTime = null;
  requestAnimationFrame(loop);
})();
