// Canvas Dodge game
// Targets a <canvas id="game"></canvas> element.
// Arrow keys move a triangular player; circles spawn at edges and move across.
// Collision ends the game; score = survival time (seconds).

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  // Handle high‑DPI displays
  const dpr = window.devicePixelRatio || 1;
  const cw = canvas.width = canvas.clientWidth * dpr;
  const ch = canvas.height = canvas.clientHeight * dpr;
  ctx.scale(dpr, dpr);

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }

  const player = {
    x: cw / 2,
    y: ch / 2,
    size: 20,
    speed: 4,
    dir: { left: false, up: false, right: false, down: false },
    draw() {
      // cyan triangle with glow
      ctx.save();
      ctx.fillStyle = '#00ffdd';
      ctx.shadowColor = 'rgba(0,255,221,0.6)';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - this.size);
      ctx.lineTo(this.x - this.size, this.y + this.size);
      ctx.lineTo(this.x + this.size, this.y + this.size);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    },
    update() {
      if (this.dir.left) this.x -= this.speed;
      if (this.dir.right) this.x += this.speed;
      if (this.dir.up) this.y -= this.speed;
      if (this.dir.down) this.y += this.speed;
      // keep inside canvas
      this.x = Math.max(this.size, Math.min(cw - this.size, this.x));
      this.y = Math.max(this.size, Math.min(ch - this.size, this.y));
    }
  };

  const circles = [];
  const circleConfig = {
    spawnInterval: 800, // ms
    minRadius: 10,
    maxRadius: 30,
    speed: 2
  };

  let lastSpawn = 0;
  let startTime = null;
  let animationId = null;
  let gameOver = false;

  function spawnCircle() {
    const radius = Math.random() * (circleConfig.maxRadius - circleConfig.minRadius) + circleConfig.minRadius;
    // pick a random edge
    const edge = Math.floor(Math.random() * 4); // 0 top,1 right,2 bottom,3 left
    let x, y, vx, vy;
    switch (edge) {
      case 0: // top
        x = Math.random() * cw;
        y = -radius;
        break;
      case 1: // right
        x = cw + radius;
        y = Math.random() * ch;
        break;
      case 2: // bottom
        x = Math.random() * cw;
        y = ch + radius;
        break;
      case 3: // left
        x = -radius;
        y = Math.random() * ch;
        break;
    }
    // direction toward opposite side roughly
    const targetX = Math.random() * cw;
    const targetY = Math.random() * ch;
    const angle = Math.atan2(targetY - y, targetX - x);
    vx = Math.cos(angle) * circleConfig.speed;
    vy = Math.sin(angle) * circleConfig.speed;
    // random reddish-orange color per circle
    const hue = Math.random() * 30 + 10; // 10-40 degrees
    const color = `hsl(${hue}, 80%, 60%)`;
    circles.push({ x, y, radius, vx, vy, color });
    // play a subtle tone on spawn, pitch based on size
    playTone(200 + radius * 5, 80);
  }

  function updateCircles(delta) {
    for (let i = circles.length - 1; i >= 0; i--) {
      const c = circles[i];
      c.x += c.vx;
      c.y += c.vy;
      // remove if off-screen
      if (c.x < -c.radius * 2 || c.x > cw + c.radius * 2 || c.y < -c.radius * 2 || c.y > ch + c.radius * 2) {
        circles.splice(i, 1);
      }
    }
  }

  function drawBackground(){
    const grad = ctx.createLinearGradient(0,0,cw,ch);
    grad.addColorStop(0,'#0e0e20');
    grad.addColorStop(1,'#001020');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,cw,ch);
  }

function drawCircles() {
    circles.forEach(c => {
      ctx.save();
      ctx.fillStyle = c.color || 'red';
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  function checkCollision() {
    for (const c of circles) {
      const dx = c.x - player.x;
      const dy = c.y - player.y;
      const dist = Math.hypot(dx, dy);
      if (dist < c.radius + player.size) {
        return true;
      }
    }
    return false;
  }

  function drawScore() {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    ctx.fillStyle = 'white';
    ctx.font = '16px monospace';
    ctx.fillText(`Score: ${elapsed}s`, 10, 20);
  }

  function gameLoop(timestamp) {
    if (!startTime) startTime = Date.now();
    const now = Date.now();
    const delta = now - (lastSpawn || now);
    if (now - lastSpawn > circleConfig.spawnInterval) {
      spawnCircle();
      lastSpawn = now;
    }

    // draw gradient background
    drawBackground();
    player.update();
    player.draw();
    updateCircles(delta);
    drawCircles();
    drawScore();

    if (checkCollision()) {
      gameOver = true;
      ctx.fillStyle = 'yellow';
      ctx.font = '30px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', cw / 2, ch / 2);
      cancelAnimationFrame(animationId);
      return;
    }

    animationId = requestAnimationFrame(gameLoop);
  }

  // Keyboard handling
  window.addEventListener('keydown', e => {
    switch (e.key) {
      case 'ArrowLeft': player.dir.left = true; break;
      case 'ArrowRight': player.dir.right = true; break;
      case 'ArrowUp': player.dir.up = true; break;
      case 'ArrowDown': player.dir.down = true; break;
    }
  });
  window.addEventListener('keyup', e => {
    switch (e.key) {
      case 'ArrowLeft': player.dir.left = false; break;
      case 'ArrowRight': player.dir.right = false; break;
      case 'ArrowUp': player.dir.up = false; break;
      case 'ArrowDown': player.dir.down = false; break;
    }
  });

  // start loop
  animationId = requestAnimationFrame(gameLoop);
})();
